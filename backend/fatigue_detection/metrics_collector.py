"""
Fatigue Metrics Collector

Collects and aggregates metrics from various sources for fatigue analysis.
Interfaces with Moodle activity logs and student interaction data.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import asyncpg

from .fatigue_calculator import FatigueMetrics, CognitiveDomain, get_cognitive_domain_from_activity_type

logger = logging.getLogger(__name__)


class MetricsCollector:
    """
    Collects metrics for fatigue detection.

    Aggregates data from:
    - Learning sessions
    - Moodle activity logs
    - Student routine history
    - Baseline profiles
    """

    def __init__(self, db_pool: asyncpg.Pool):
        """
        Initialize MetricsCollector.

        Args:
            db_pool: PostgreSQL connection pool
        """
        self.db_pool = db_pool

    async def collect_metrics(
        self,
        student_id: str,
        session_id: str
    ) -> FatigueMetrics:
        """
        Collect current metrics for a student session.

        Args:
            student_id: Student UUID
            session_id: Session UUID

        Returns:
            FatigueMetrics object with collected data
        """
        async with self.db_pool.acquire() as conn:
            # Get session duration
            session_duration = await self._get_session_duration(conn, session_id)

            # Get recent interaction count (last 5 minutes)
            interaction_count = await self._get_recent_interaction_count(
                conn, session_id, minutes=5
            )

            # Get recent error rate (last 10 minutes)
            error_rate = await self._get_recent_error_rate(
                conn, session_id, minutes=10
            )

            # Get average response time (last 10 minutes)
            avg_response_time = await self._get_average_response_time(
                conn, session_id, minutes=10
            )

            # Get time since last break
            minutes_since_break = await self._get_minutes_since_last_break(
                conn, session_id
            )

            # Get current activity difficulty
            content_difficulty = await self._get_current_content_difficulty(
                conn, session_id
            )

            # Get current time
            time_of_day = datetime.utcnow().time()

            # Get baseline metrics if available
            baseline = await self._get_baseline_metrics(conn, student_id)

        metrics = FatigueMetrics(
            session_duration_minutes=session_duration,
            interaction_count_last_5min=interaction_count,
            error_rate_last_10min=error_rate,
            avg_response_time_seconds=avg_response_time,
            minutes_since_last_break=minutes_since_break,
            content_difficulty=content_difficulty,
            time_of_day=time_of_day,
            baseline_error_rate=baseline.get('error_rate'),
            baseline_response_time=baseline.get('response_time'),
            baseline_interaction_rate=baseline.get('interaction_rate')
        )

        logger.debug(
            f"Collected metrics for student {student_id}, session {session_id}: "
            f"duration={session_duration}min, interactions={interaction_count}, "
            f"error_rate={error_rate:.1f}%, fatigue_candidate"
        )

        return metrics

    async def _get_session_duration(
        self,
        conn: asyncpg.Connection,
        session_id: str
    ) -> int:
        """Get session duration in minutes."""
        row = await conn.fetchrow("""
            SELECT EXTRACT(EPOCH FROM (NOW() - started_at))/60 AS duration_minutes
            FROM learning_sessions
            WHERE id = $1
        """, session_id)

        return int(row['duration_minutes']) if row else 0

    async def _get_recent_interaction_count(
        self,
        conn: asyncpg.Connection,
        session_id: str,
        minutes: int = 5
    ) -> int:
        """Get interaction count in recent time window."""
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)

        row = await conn.fetchrow("""
            SELECT COUNT(*) AS count
            FROM moodle_activity_logs
            WHERE session_id = $1
              AND event_time >= $2
        """, session_id, cutoff_time)

        return row['count'] if row else 0

    async def _get_recent_error_rate(
        self,
        conn: asyncpg.Connection,
        session_id: str,
        minutes: int = 10
    ) -> float:
        """
        Calculate error rate from recent quiz attempts.

        Returns:
            Error rate as percentage (0-100)
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)

        # Count quiz attempts and incorrect answers
        row = await conn.fetchrow("""
            SELECT
                COUNT(*) FILTER (
                    WHERE event_name LIKE '%quiz%'
                      AND (event_data->>'is_correct')::boolean = false
                ) AS errors,
                COUNT(*) FILTER (
                    WHERE event_name LIKE '%quiz%'
                      AND event_data ? 'is_correct'
                ) AS total_attempts
            FROM moodle_activity_logs
            WHERE session_id = $1
              AND event_time >= $2
        """, session_id, cutoff_time)

        if row and row['total_attempts'] > 0:
            return (row['errors'] / row['total_attempts']) * 100
        else:
            # No recent quiz data; check historical session error rate
            session_row = await conn.fetchrow("""
                SELECT total_errors, total_correct
                FROM learning_sessions
                WHERE id = $1
            """, session_id)

            if session_row:
                total = session_row['total_errors'] + session_row['total_correct']
                if total > 0:
                    return (session_row['total_errors'] / total) * 100

        return 0.0

    async def _get_average_response_time(
        self,
        conn: asyncpg.Connection,
        session_id: str,
        minutes: int = 10
    ) -> int:
        """
        Calculate average response time for quiz questions.

        Returns:
            Average time in seconds
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=minutes)

        row = await conn.fetchrow("""
            SELECT AVG((event_data->>'time_spent_seconds')::int) AS avg_time
            FROM moodle_activity_logs
            WHERE session_id = $1
              AND event_time >= $2
              AND event_name LIKE '%quiz%'
              AND event_data ? 'time_spent_seconds'
        """, session_id, cutoff_time)

        if row and row['avg_time']:
            return int(row['avg_time'])

        # Default if no data
        return 30  # 30 seconds default

    async def _get_minutes_since_last_break(
        self,
        conn: asyncpg.Connection,
        session_id: str
    ) -> int:
        """Get minutes since last break or routine."""
        # Check for completed routines
        row = await conn.fetchrow("""
            SELECT completed_at
            FROM student_routine_history
            WHERE session_id = $1
              AND completion_status = 'completed'
            ORDER BY completed_at DESC
            LIMIT 1
        """, session_id)

        if row and row['completed_at']:
            elapsed = datetime.utcnow() - row['completed_at']
            return int(elapsed.total_seconds() / 60)

        # No break taken; use session start time
        session_row = await conn.fetchrow("""
            SELECT started_at
            FROM learning_sessions
            WHERE id = $1
        """, session_id)

        if session_row:
            elapsed = datetime.utcnow() - session_row['started_at']
            return int(elapsed.total_seconds() / 60)

        return 0

    async def _get_current_content_difficulty(
        self,
        conn: asyncpg.Connection,
        session_id: str
    ) -> CognitiveDomain:
        """
        Determine current content difficulty based on recent activities.

        Returns:
            CognitiveDomain enum
        """
        # Get most recent activity
        row = await conn.fetchrow("""
            SELECT event_name, event_data
            FROM moodle_activity_logs
            WHERE session_id = $1
            ORDER BY event_time DESC
            LIMIT 1
        """, session_id)

        if row:
            event_name = row['event_name']

            # Map event to activity type
            activity_type = self._map_event_to_activity_type(event_name)

            return get_cognitive_domain_from_activity_type(activity_type)

        # Default to APPLY if no recent activity
        return CognitiveDomain.APPLY

    def _map_event_to_activity_type(self, event_name: str) -> str:
        """Map Moodle event name to activity type."""
        event_lower = event_name.lower()

        if 'quiz' in event_lower:
            if 'multiple' in event_lower or 'choice' in event_lower:
                return 'quiz_multiple_choice'
            elif 'essay' in event_lower:
                return 'quiz_essay'
            else:
                return 'quiz_short_answer'
        elif 'assignment' in event_lower:
            if 'essay' in event_lower or 'writing' in event_lower:
                return 'assignment_essay'
            elif 'project' in event_lower:
                return 'assignment_project'
            else:
                return 'assignment_text'
        elif 'forum' in event_lower:
            return 'forum_view'
        elif 'resource' in event_lower or 'view' in event_lower:
            return 'resource_view'
        else:
            return 'resource_view'

    async def _get_baseline_metrics(
        self,
        conn: asyncpg.Connection,
        student_id: str
    ) -> Dict[str, Optional[float]]:
        """
        Get student's baseline metrics.

        Returns:
            Dictionary with baseline values
        """
        row = await conn.fetchrow("""
            SELECT
                avg_error_rate,
                avg_response_time_seconds,
                avg_interactions_per_hour
            FROM student_baseline_profiles
            WHERE student_id = $1
        """, student_id)

        if row:
            return {
                'error_rate': row['avg_error_rate'],
                'response_time': row['avg_response_time_seconds'],
                'interaction_rate': row['avg_interactions_per_hour'] / 12 if row['avg_interactions_per_hour'] else None  # Convert to per 5 min
            }

        return {
            'error_rate': None,
            'response_time': None,
            'interaction_rate': None
        }

    async def record_fatigue_metric(
        self,
        student_id: str,
        session_id: str,
        metrics: FatigueMetrics,
        fatigue_score: int,
        fatigue_level: str,
        component_scores: Dict[str, int]
    ) -> str:
        """
        Record calculated fatigue metric to database.

        Args:
            student_id: Student UUID
            session_id: Session UUID
            metrics: Input metrics
            fatigue_score: Calculated fatigue score
            fatigue_level: Fatigue level classification
            component_scores: Individual component scores

        Returns:
            UUID of created metric record
        """
        import uuid

        metric_id = str(uuid.uuid4())

        # Get current activity context
        async with self.db_pool.acquire() as conn:
            activity_row = await conn.fetchrow("""
                SELECT event_name, moodle_course_id, moodle_module_id
                FROM moodle_activity_logs
                WHERE session_id = $1
                ORDER BY event_time DESC
                LIMIT 1
            """, session_id)

            current_activity_type = None
            current_course_id = None
            current_activity_id = None

            if activity_row:
                current_activity_type = activity_row['event_name']
                current_course_id = activity_row['moodle_course_id']
                current_activity_id = activity_row['moodle_module_id']

            # Insert metric
            await conn.execute("""
                INSERT INTO student_fatigue_metrics (
                    id, student_id, session_id, timestamp,
                    session_duration_minutes, interaction_count_last_5min,
                    error_rate_last_10min, avg_response_time_seconds,
                    minutes_since_last_break,
                    session_duration_score, interaction_frequency_score,
                    error_rate_score, response_time_score, break_pattern_score,
                    content_difficulty_score, time_of_day_score,
                    fatigue_score, fatigue_level,
                    current_course_id, current_activity_id, current_activity_type,
                    content_difficulty, time_of_day,
                    day_of_week, is_weekend
                ) VALUES (
                    $1, $2, $3, NOW(),
                    $4, $5, $6, $7, $8,
                    $9, $10, $11, $12, $13, $14, $15,
                    $16, $17,
                    $18, $19, $20,
                    $21, $22, $23, $24
                )
            """,
                metric_id, student_id, session_id,
                metrics.session_duration_minutes,
                metrics.interaction_count_last_5min,
                metrics.error_rate_last_10min,
                metrics.avg_response_time_seconds,
                metrics.minutes_since_last_break,
                component_scores['session_duration'],
                component_scores['interaction_frequency'],
                component_scores['error_rate'],
                component_scores['response_time'],
                component_scores['break_pattern'],
                component_scores['content_difficulty'],
                component_scores['time_of_day'],
                fatigue_score,
                fatigue_level,
                current_course_id,
                current_activity_id,
                current_activity_type,
                metrics.content_difficulty.value,
                metrics.time_of_day,
                datetime.utcnow().isoweekday(),
                datetime.utcnow().isoweekday() in [6, 7]  # Saturday or Sunday
            )

        logger.info(
            f"Recorded fatigue metric {metric_id} for student {student_id}: "
            f"score={fatigue_score}, level={fatigue_level}"
        )

        return metric_id

    async def get_recent_fatigue_trend(
        self,
        student_id: str,
        session_id: str,
        hours: int = 2
    ) -> List[Dict]:
        """
        Get recent fatigue score trend.

        Args:
            student_id: Student UUID
            session_id: Session UUID
            hours: Hours of history to retrieve

        Returns:
            List of fatigue metrics (newest first)
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)

        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT
                    timestamp,
                    fatigue_score,
                    fatigue_level,
                    session_duration_minutes,
                    error_rate_last_10min,
                    interaction_count_last_5min
                FROM student_fatigue_metrics
                WHERE student_id = $1
                  AND session_id = $2
                  AND timestamp >= $3
                ORDER BY timestamp DESC
            """, student_id, session_id, cutoff_time)

            return [dict(row) for row in rows]
