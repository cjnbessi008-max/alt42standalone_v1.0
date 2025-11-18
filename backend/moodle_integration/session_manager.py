"""
Session Management for Moodle-Alt42 Integration

Manages student learning sessions, tracks activity, and monitors session state.
Integrates with fatigue detection system to track continuous learning time.
"""

import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional, List, Any
from dataclasses import dataclass, asdict
from enum import Enum

import asyncpg
import redis.asyncio as redis

logger = logging.getLogger(__name__)


class SessionStatus(Enum):
    """Session status enumeration."""
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"
    TIMED_OUT = "timed_out"


@dataclass
class LearningSession:
    """Learning session data structure."""
    id: str
    student_id: str
    moodle_session_id: Optional[str]
    started_at: datetime
    ended_at: Optional[datetime]
    last_activity_at: datetime
    moodle_course_id: Optional[str]
    course_name: Optional[str]
    course_category: Optional[str]
    total_interactions: int = 0
    total_errors: int = 0
    total_correct: int = 0
    break_count: int = 0
    switching_routine_count: int = 0
    activity_summary: Dict[str, int] = None
    completion_status: str = SessionStatus.ACTIVE.value
    final_fatigue_score: Optional[int] = None
    max_fatigue_score_reached: Optional[int] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    ip_address: Optional[str] = None

    def __post_init__(self):
        if self.activity_summary is None:
            self.activity_summary = {
                "quiz_attempts": 0,
                "forum_posts": 0,
                "resource_views": 0,
                "assignment_submissions": 0
            }

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        data = asdict(self)
        # Convert datetime objects to ISO format
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict) -> 'LearningSession':
        """Create from dictionary."""
        # Convert ISO strings to datetime
        if isinstance(data.get('started_at'), str):
            data['started_at'] = datetime.fromisoformat(data['started_at'])
        if data.get('ended_at') and isinstance(data['ended_at'], str):
            data['ended_at'] = datetime.fromisoformat(data['ended_at'])
        if isinstance(data.get('last_activity_at'), str):
            data['last_activity_at'] = datetime.fromisoformat(data['last_activity_at'])
        return cls(**data)


class SessionManager:
    """
    Manages student learning sessions.

    Handles session creation, updates, and termination.
    Integrates with PostgreSQL for persistent storage and Redis for caching.
    """

    def __init__(
        self,
        db_pool: asyncpg.Pool,
        redis_client: redis.Redis,
        session_timeout_minutes: int = 30,
        auto_complete_hours: int = 4
    ):
        """
        Initialize SessionManager.

        Args:
            db_pool: PostgreSQL connection pool
            redis_client: Redis client for caching
            session_timeout_minutes: Minutes of inactivity before timeout warning
            auto_complete_hours: Hours of inactivity before auto-completion
        """
        self.db_pool = db_pool
        self.redis = redis_client
        self.session_timeout = timedelta(minutes=session_timeout_minutes)
        self.auto_complete_duration = timedelta(hours=auto_complete_hours)

        # Redis key prefixes
        self.SESSION_KEY_PREFIX = "session:"
        self.ACTIVE_SESSIONS_KEY = "active_sessions"
        self.STUDENT_SESSION_KEY_PREFIX = "student_sessions:"

    async def create_session(
        self,
        student_id: str,
        moodle_session_id: Optional[str] = None,
        moodle_course_id: Optional[str] = None,
        course_name: Optional[str] = None,
        course_category: Optional[str] = None,
        device_type: Optional[str] = None,
        browser: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> LearningSession:
        """
        Create a new learning session.

        Args:
            student_id: Student UUID
            moodle_session_id: Moodle session identifier
            moodle_course_id: Moodle course ID
            course_name: Course name
            course_category: Course category
            device_type: Device type (desktop, mobile, tablet)
            browser: Browser name
            ip_address: Client IP address

        Returns:
            Created LearningSession
        """
        session_id = str(uuid.uuid4())
        now = datetime.utcnow()

        session = LearningSession(
            id=session_id,
            student_id=student_id,
            moodle_session_id=moodle_session_id,
            started_at=now,
            ended_at=None,
            last_activity_at=now,
            moodle_course_id=moodle_course_id,
            course_name=course_name,
            course_category=course_category,
            device_type=device_type,
            browser=browser,
            ip_address=ip_address
        )

        # Insert into database
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO learning_sessions (
                    id, student_id, moodle_session_id, started_at, last_activity_at,
                    moodle_course_id, course_name, course_category,
                    activity_summary, completion_status,
                    device_type, browser, ip_address
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            """,
                session.id, session.student_id, session.moodle_session_id,
                session.started_at, session.last_activity_at,
                session.moodle_course_id, session.course_name, session.course_category,
                session.activity_summary, session.completion_status,
                session.device_type, session.browser, session.ip_address
            )

        # Cache in Redis
        await self._cache_session(session)

        # Add to active sessions set
        await self.redis.sadd(self.ACTIVE_SESSIONS_KEY, session_id)

        # Track student's sessions
        await self.redis.lpush(
            f"{self.STUDENT_SESSION_KEY_PREFIX}{student_id}",
            session_id
        )

        logger.info(
            f"Created session {session_id} for student {student_id} "
            f"in course {moodle_course_id}"
        )

        return session

    async def get_session(self, session_id: str) -> Optional[LearningSession]:
        """
        Get session by ID.

        Args:
            session_id: Session UUID

        Returns:
            LearningSession if found, None otherwise
        """
        # Try cache first
        cached = await self._get_cached_session(session_id)
        if cached:
            return cached

        # Fetch from database
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT
                    id, student_id, moodle_session_id, started_at, ended_at,
                    last_activity_at, moodle_course_id, course_name, course_category,
                    total_interactions, total_errors, total_correct,
                    break_count, switching_routine_count, activity_summary,
                    completion_status, final_fatigue_score, max_fatigue_score_reached,
                    device_type, browser, ip_address
                FROM learning_sessions
                WHERE id = $1
            """, session_id)

            if not row:
                return None

            session = LearningSession(
                id=row['id'],
                student_id=row['student_id'],
                moodle_session_id=row['moodle_session_id'],
                started_at=row['started_at'],
                ended_at=row['ended_at'],
                last_activity_at=row['last_activity_at'],
                moodle_course_id=row['moodle_course_id'],
                course_name=row['course_name'],
                course_category=row['course_category'],
                total_interactions=row['total_interactions'],
                total_errors=row['total_errors'],
                total_correct=row['total_correct'],
                break_count=row['break_count'],
                switching_routine_count=row['switching_routine_count'],
                activity_summary=row['activity_summary'],
                completion_status=row['completion_status'],
                final_fatigue_score=row['final_fatigue_score'],
                max_fatigue_score_reached=row['max_fatigue_score_reached'],
                device_type=row['device_type'],
                browser=row['browser'],
                ip_address=row['ip_address']
            )

            # Cache for future requests
            await self._cache_session(session)

            return session

    async def get_active_session(self, student_id: str) -> Optional[LearningSession]:
        """
        Get student's active session.

        Args:
            student_id: Student UUID

        Returns:
            Active LearningSession if exists, None otherwise
        """
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT
                    id, student_id, moodle_session_id, started_at, ended_at,
                    last_activity_at, moodle_course_id, course_name, course_category,
                    total_interactions, total_errors, total_correct,
                    break_count, switching_routine_count, activity_summary,
                    completion_status, final_fatigue_score, max_fatigue_score_reached,
                    device_type, browser, ip_address
                FROM learning_sessions
                WHERE student_id = $1 AND completion_status = 'active'
                ORDER BY started_at DESC
                LIMIT 1
            """, student_id)

            if not row:
                return None

            return LearningSession(
                id=row['id'],
                student_id=row['student_id'],
                moodle_session_id=row['moodle_session_id'],
                started_at=row['started_at'],
                ended_at=row['ended_at'],
                last_activity_at=row['last_activity_at'],
                moodle_course_id=row['moodle_course_id'],
                course_name=row['course_name'],
                course_category=row['course_category'],
                total_interactions=row['total_interactions'],
                total_errors=row['total_errors'],
                total_correct=row['total_correct'],
                break_count=row['break_count'],
                switching_routine_count=row['switching_routine_count'],
                activity_summary=row['activity_summary'],
                completion_status=row['completion_status'],
                final_fatigue_score=row['final_fatigue_score'],
                max_fatigue_score_reached=row['max_fatigue_score_reached'],
                device_type=row['device_type'],
                browser=row['browser'],
                ip_address=row['ip_address']
            )

    async def update_activity(
        self,
        session_id: str,
        activity_type: Optional[str] = None,
        is_error: bool = False,
        is_correct: bool = False
    ) -> None:
        """
        Update session activity metrics.

        Args:
            session_id: Session UUID
            activity_type: Type of activity (quiz_attempt, forum_post, etc.)
            is_error: Whether this action resulted in an error
            is_correct: Whether this action was correct
        """
        now = datetime.utcnow()

        # Build update query
        updates = ["last_activity_at = $2", "total_interactions = total_interactions + 1"]
        params = [session_id, now]
        param_index = 3

        if is_error:
            updates.append(f"total_errors = total_errors + 1")
        if is_correct:
            updates.append(f"total_correct = total_correct + 1")

        if activity_type:
            # Update activity_summary JSONB
            updates.append(
                f"activity_summary = jsonb_set("
                f"activity_summary, '{{\"{activity_type}\"}}', "
                f"(COALESCE((activity_summary->>'{activity_type}')::int, 0) + 1)::text::jsonb"
                f")"
            )

        query = f"""
            UPDATE learning_sessions
            SET {', '.join(updates)}
            WHERE id = $1
        """

        async with self.db_pool.acquire() as conn:
            await conn.execute(query, *params)

        # Invalidate cache
        await self._invalidate_session_cache(session_id)

        logger.debug(f"Updated activity for session {session_id}: {activity_type}")

    async def record_break(self, session_id: str) -> None:
        """
        Record that student took a break.

        Args:
            session_id: Session UUID
        """
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE learning_sessions
                SET break_count = break_count + 1
                WHERE id = $1
            """, session_id)

        await self._invalidate_session_cache(session_id)
        logger.info(f"Recorded break for session {session_id}")

    async def record_switching_routine(self, session_id: str) -> None:
        """
        Record that student completed a cognitive switching routine.

        Args:
            session_id: Session UUID
        """
        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE learning_sessions
                SET switching_routine_count = switching_routine_count + 1
                WHERE id = $1
            """, session_id)

        await self._invalidate_session_cache(session_id)
        logger.info(f"Recorded switching routine for session {session_id}")

    async def complete_session(
        self,
        session_id: str,
        final_fatigue_score: Optional[int] = None,
        status: SessionStatus = SessionStatus.COMPLETED
    ) -> None:
        """
        Complete a learning session.

        Args:
            session_id: Session UUID
            final_fatigue_score: Final fatigue score
            status: Completion status
        """
        now = datetime.utcnow()

        async with self.db_pool.acquire() as conn:
            await conn.execute("""
                UPDATE learning_sessions
                SET
                    ended_at = $2,
                    completion_status = $3,
                    final_fatigue_score = $4
                WHERE id = $1
            """, session_id, now, status.value, final_fatigue_score)

        # Remove from active sessions
        await self.redis.srem(self.ACTIVE_SESSIONS_KEY, session_id)

        # Invalidate cache
        await self._invalidate_session_cache(session_id)

        logger.info(
            f"Completed session {session_id} with status {status.value}, "
            f"final fatigue: {final_fatigue_score}"
        )

    async def check_timeouts(self) -> List[str]:
        """
        Check for timed-out sessions and mark them.

        Returns:
            List of timed-out session IDs
        """
        timeout_threshold = datetime.utcnow() - self.auto_complete_duration
        timed_out = []

        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id
                FROM learning_sessions
                WHERE completion_status = 'active'
                  AND last_activity_at < $1
            """, timeout_threshold)

            for row in rows:
                session_id = row['id']
                await self.complete_session(session_id, status=SessionStatus.TIMED_OUT)
                timed_out.append(session_id)

        if timed_out:
            logger.info(f"Marked {len(timed_out)} sessions as timed out")

        return timed_out

    async def get_session_duration(self, session_id: str) -> Optional[int]:
        """
        Get session duration in minutes.

        Args:
            session_id: Session UUID

        Returns:
            Duration in minutes, or None if session not found
        """
        session = await self.get_session(session_id)
        if not session:
            return None

        end_time = session.ended_at or datetime.utcnow()
        duration = end_time - session.started_at
        return int(duration.total_seconds() / 60)

    async def get_student_sessions(
        self,
        student_id: str,
        limit: int = 10,
        offset: int = 0
    ) -> List[LearningSession]:
        """
        Get student's recent sessions.

        Args:
            student_id: Student UUID
            limit: Maximum number of sessions to return
            offset: Offset for pagination

        Returns:
            List of LearningSession objects
        """
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT
                    id, student_id, moodle_session_id, started_at, ended_at,
                    last_activity_at, moodle_course_id, course_name, course_category,
                    total_interactions, total_errors, total_correct,
                    break_count, switching_routine_count, activity_summary,
                    completion_status, final_fatigue_score, max_fatigue_score_reached,
                    device_type, browser, ip_address
                FROM learning_sessions
                WHERE student_id = $1
                ORDER BY started_at DESC
                LIMIT $2 OFFSET $3
            """, student_id, limit, offset)

            sessions = []
            for row in rows:
                sessions.append(LearningSession(
                    id=row['id'],
                    student_id=row['student_id'],
                    moodle_session_id=row['moodle_session_id'],
                    started_at=row['started_at'],
                    ended_at=row['ended_at'],
                    last_activity_at=row['last_activity_at'],
                    moodle_course_id=row['moodle_course_id'],
                    course_name=row['course_name'],
                    course_category=row['course_category'],
                    total_interactions=row['total_interactions'],
                    total_errors=row['total_errors'],
                    total_correct=row['total_correct'],
                    break_count=row['break_count'],
                    switching_routine_count=row['switching_routine_count'],
                    activity_summary=row['activity_summary'],
                    completion_status=row['completion_status'],
                    final_fatigue_score=row['final_fatigue_score'],
                    max_fatigue_score_reached=row['max_fatigue_score_reached'],
                    device_type=row['device_type'],
                    browser=row['browser'],
                    ip_address=row['ip_address']
                ))

            return sessions

    # ========== Cache Management ==========

    async def _cache_session(self, session: LearningSession) -> None:
        """Cache session in Redis."""
        import json
        key = f"{self.SESSION_KEY_PREFIX}{session.id}"
        await self.redis.setex(
            key,
            3600,  # 1 hour TTL
            json.dumps(session.to_dict(), default=str)
        )

    async def _get_cached_session(self, session_id: str) -> Optional[LearningSession]:
        """Get session from Redis cache."""
        import json
        key = f"{self.SESSION_KEY_PREFIX}{session_id}"
        cached = await self.redis.get(key)

        if cached:
            data = json.loads(cached)
            return LearningSession.from_dict(data)

        return None

    async def _invalidate_session_cache(self, session_id: str) -> None:
        """Invalidate session cache."""
        key = f"{self.SESSION_KEY_PREFIX}{session_id}"
        await self.redis.delete(key)

    async def get_session_statistics(self, session_id: str) -> Dict[str, Any]:
        """
        Get detailed session statistics.

        Args:
            session_id: Session UUID

        Returns:
            Dictionary with session statistics
        """
        session = await self.get_session(session_id)
        if not session:
            return {}

        duration = await self.get_session_duration(session_id)

        # Calculate error rate
        total_attempts = session.total_errors + session.total_correct
        error_rate = (session.total_errors / total_attempts * 100) if total_attempts > 0 else 0

        # Calculate interactions per minute
        interactions_per_minute = session.total_interactions / duration if duration > 0 else 0

        return {
            'session_id': session_id,
            'student_id': session.student_id,
            'course': {
                'id': session.moodle_course_id,
                'name': session.course_name,
                'category': session.course_category
            },
            'duration_minutes': duration,
            'status': session.completion_status,
            'metrics': {
                'total_interactions': session.total_interactions,
                'interactions_per_minute': round(interactions_per_minute, 2),
                'total_errors': session.total_errors,
                'total_correct': session.total_correct,
                'error_rate_percent': round(error_rate, 2),
                'break_count': session.break_count,
                'switching_routine_count': session.switching_routine_count
            },
            'activity_breakdown': session.activity_summary,
            'fatigue': {
                'final_score': session.final_fatigue_score,
                'max_score_reached': session.max_fatigue_score_reached
            },
            'device': {
                'type': session.device_type,
                'browser': session.browser
            },
            'timestamps': {
                'started_at': session.started_at.isoformat(),
                'ended_at': session.ended_at.isoformat() if session.ended_at else None,
                'last_activity_at': session.last_activity_at.isoformat()
            }
        }
