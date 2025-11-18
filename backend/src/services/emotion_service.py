"""
Emotion Refresh Routine - Emotion Service
=========================================
Business logic for emotion tracking and analysis.
"""

import asyncpg
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from uuid import UUID, uuid4
import logging

from models.emotion import (
    EmotionCheckInRequest,
    EmotionCheckInResponse,
    StudentEmotionHistoryResponse,
    EmotionAnalyticsResponse,
    EmotionTrendPoint,
    EmotionType,
)

logger = logging.getLogger(__name__)


class EmotionService:
    """Service for managing emotion check-ins and analytics"""

    def __init__(self, db_pool: asyncpg.Pool):
        """
        Initialize emotion service.

        Args:
            db_pool: PostgreSQL connection pool
        """
        self.db_pool = db_pool

    async def create_check_in(
        self,
        request: EmotionCheckInRequest
    ) -> EmotionCheckInResponse:
        """
        Create a new emotion check-in.

        Args:
            request: Emotion check-in request data

        Returns:
            EmotionCheckInResponse with check-in ID and suggestions
        """
        async with self.db_pool.acquire() as conn:
            # Insert check-in
            check_in_id = await conn.fetchval(
                """
                INSERT INTO emotion_check_ins (
                    student_id,
                    module_id,
                    emotion_type,
                    emotion_score,
                    context_note,
                    session_duration_minutes
                )
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
                """,
                request.student_id,
                request.module_id,
                request.emotion_type.value,
                request.emotion_score,
                request.context_note,
                request.session_duration_minutes,
            )

            # Determine if we should suggest a refresh activity
            should_suggest = await self._should_suggest_refresh(
                conn,
                request.student_id,
                request.emotion_type,
                request.emotion_score,
            )

            suggested_activity_id = None
            if should_suggest:
                # Find a suitable activity
                suggested_activity_id = await self._find_suitable_activity(
                    conn,
                    request.emotion_type,
                )

            # Generate appropriate message
            message = self._generate_check_in_message(
                request.emotion_type,
                request.emotion_score,
                should_suggest,
            )

            return EmotionCheckInResponse(
                check_in_id=check_in_id,
                suggested_activity_id=suggested_activity_id,
                message=message,
                timestamp=datetime.utcnow(),
            )

    async def get_student_history(
        self,
        student_id: UUID,
        days: int = 7
    ) -> StudentEmotionHistoryResponse:
        """
        Get student's emotion history.

        Args:
            student_id: Student UUID
            days: Number of days to look back (default: 7)

        Returns:
            StudentEmotionHistoryResponse with emotion trends
        """
        async with self.db_pool.acquire() as conn:
            start_date = datetime.utcnow() - timedelta(days=days)
            end_date = datetime.utcnow()

            # Get daily emotion trends
            trend_data = await conn.fetch(
                """
                SELECT
                    DATE(timestamp) as date,
                    ROUND(AVG(emotion_score)::numeric, 2) as avg_score,
                    COUNT(*) as check_ins,
                    MODE() WITHIN GROUP (ORDER BY emotion_type) as most_common
                FROM emotion_check_ins
                WHERE student_id = $1
                  AND timestamp >= $2
                  AND timestamp <= $3
                GROUP BY DATE(timestamp)
                ORDER BY date DESC
                """,
                student_id,
                start_date,
                end_date,
            )

            emotion_trend = [
                EmotionTrendPoint(
                    date=str(row['date']),
                    avg_score=float(row['avg_score']),
                    check_ins=row['check_ins'],
                    most_common_emotion=EmotionType(row['most_common']) if row['most_common'] else None,
                )
                for row in trend_data
            ]

            # Get overall statistics
            stats = await conn.fetchrow(
                """
                SELECT
                    MODE() WITHIN GROUP (ORDER BY emotion_type) as most_common_emotion,
                    COUNT(*) as total_check_ins
                FROM emotion_check_ins
                WHERE student_id = $1
                  AND timestamp >= $2
                """,
                student_id,
                start_date,
            )

            # Get refresh session statistics
            session_stats = await conn.fetchrow(
                """
                SELECT
                    COUNT(*) as total_sessions,
                    ROUND(AVG(post_emotion_score - pre_emotion_score)::numeric, 2) as avg_improvement
                FROM student_refresh_sessions
                WHERE student_id = $1
                  AND session_timestamp >= $2
                  AND post_emotion_score IS NOT NULL
                """,
                student_id,
                start_date,
            )

            return StudentEmotionHistoryResponse(
                student_id=student_id,
                date_range={
                    "start": start_date.strftime("%Y-%m-%d"),
                    "end": end_date.strftime("%Y-%m-%d"),
                },
                emotion_trend=emotion_trend,
                most_common_emotion=EmotionType(stats['most_common_emotion']),
                total_check_ins=stats['total_check_ins'],
                total_refresh_sessions=session_stats['total_sessions'] or 0,
                avg_improvement=float(session_stats['avg_improvement'] or 0),
            )

    async def get_module_analytics(
        self,
        module_id: UUID,
        date: Optional[datetime] = None
    ) -> EmotionAnalyticsResponse:
        """
        Get emotion analytics for a module (teacher dashboard).

        Args:
            module_id: Module UUID
            date: Specific date (default: today)

        Returns:
            EmotionAnalyticsResponse with aggregated analytics
        """
        if date is None:
            date = datetime.utcnow()

        date_str = date.strftime("%Y-%m-%d")

        async with self.db_pool.acquire() as conn:
            # Try to get cached analytics first
            cached = await conn.fetchrow(
                """
                SELECT *
                FROM emotion_analytics_cache
                WHERE module_id = $1 AND date = $2
                """,
                module_id,
                date.date(),
            )

            if cached and (datetime.utcnow() - cached['last_updated']).seconds < 3600:
                # Cache is fresh (< 1 hour old)
                return EmotionAnalyticsResponse(
                    module_id=module_id,
                    date=date_str,
                    total_students=cached['total_students'],
                    total_check_ins=cached['total_check_ins'],
                    avg_emotion_score=float(cached['avg_emotion_score'] or 0),
                    emotion_distribution=cached['emotion_distribution'] or {},
                    refresh_participation_rate=float(cached['refresh_participation_rate'] or 0),
                    avg_improvement_score=float(cached['avg_improvement_score'] or 0),
                    correlation_with_performance=float(cached['correlation_with_performance'] or 0) if cached['correlation_with_performance'] else None,
                    top_activities=cached['top_activities'] or [],
                )

            # Compute fresh analytics
            analytics = await self._compute_module_analytics(conn, module_id, date)

            # Cache the results
            await self._cache_analytics(conn, module_id, date, analytics)

            return analytics

    async def _should_suggest_refresh(
        self,
        conn: asyncpg.Connection,
        student_id: UUID,
        emotion_type: EmotionType,
        emotion_score: int,
    ) -> bool:
        """
        Determine if we should suggest a refresh activity.

        Suggests if:
        - Negative emotion (stressed, tired, frustrated, anxious, bored) with score >= 6
        - Multiple negative check-ins in short time
        """
        # Check emotion type and score
        negative_emotions = {
            EmotionType.STRESSED,
            EmotionType.TIRED,
            EmotionType.FRUSTRATED,
            EmotionType.ANXIOUS,
            EmotionType.BORED,
        }

        if emotion_type in negative_emotions and emotion_score >= 6:
            return True

        # Check recent pattern
        recent_count = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM emotion_check_ins
            WHERE student_id = $1
              AND timestamp >= NOW() - INTERVAL '30 minutes'
              AND emotion_score >= 6
              AND emotion_type IN ('stressed', 'tired', 'frustrated', 'anxious', 'bored')
            """,
            student_id,
        )

        if recent_count >= 2:
            return True

        return False

    async def _find_suitable_activity(
        self,
        conn: asyncpg.Connection,
        emotion_type: EmotionType,
    ) -> Optional[UUID]:
        """Find a suitable refresh activity for the given emotion."""
        # Map emotions to preferred activity types
        emotion_to_activity = {
            EmotionType.STRESSED: 'breathing',
            EmotionType.TIRED: 'stretch',
            EmotionType.ANXIOUS: 'mindfulness',
            EmotionType.FRUSTRATED: 'breathing',
            EmotionType.BORED: 'energy',
        }

        target_activity_type = emotion_to_activity.get(emotion_type)

        if target_activity_type:
            activity_id = await conn.fetchval(
                """
                SELECT id
                FROM refresh_activities
                WHERE target_emotion = $1
                  AND activity_type = $2
                  AND is_active = TRUE
                ORDER BY avg_effectiveness_score DESC NULLS LAST
                LIMIT 1
                """,
                emotion_type.value,
                target_activity_type,
            )
            return activity_id

        return None

    def _generate_check_in_message(
        self,
        emotion_type: EmotionType,
        emotion_score: int,
        should_suggest: bool,
    ) -> str:
        """Generate appropriate message for check-in response."""
        if should_suggest:
            if emotion_type == EmotionType.STRESSED:
                return "스트레스가 많이 보이네요. 잠깐 쉬면서 기분을 전환해볼까요?"
            elif emotion_type == EmotionType.TIRED:
                return "많이 피곤해 보여요. 잠깐 스트레칭하면 도움이 될 거예요."
            elif emotion_type == EmotionType.ANXIOUS:
                return "불안한 마음이 느껴지네요. 1분만 시간을 내서 마음을 가라앉혀볼까요?"
            elif emotion_type == EmotionType.FRUSTRATED:
                return "화가 나 있는 것 같아요. 심호흡으로 마음을 진정시켜보세요."
            elif emotion_type == EmotionType.BORED:
                return "지루한가요? 짧은 활동으로 기분을 바꿔볼까요?"
            else:
                return "잠깐 쉬면서 기분을 전환해볼까요?"
        else:
            if emotion_score >= 7:
                return "좋은 컨디션이네요! 계속 열심히 해봐요 💪"
            else:
                return "체크인 완료! 필요하면 언제든지 다시 체크인하세요."

    async def _compute_module_analytics(
        self,
        conn: asyncpg.Connection,
        module_id: UUID,
        date: datetime,
    ) -> EmotionAnalyticsResponse:
        """Compute fresh analytics for a module."""
        date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        date_end = date_start + timedelta(days=1)

        # Get unique students who checked in
        total_students = await conn.fetchval(
            """
            SELECT COUNT(DISTINCT student_id)
            FROM emotion_check_ins
            WHERE module_id = $1
              AND timestamp >= $2
              AND timestamp < $3
            """,
            module_id,
            date_start,
            date_end,
        )

        # Get total check-ins
        total_check_ins = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM emotion_check_ins
            WHERE module_id = $1
              AND timestamp >= $2
              AND timestamp < $3
            """,
            module_id,
            date_start,
            date_end,
        )

        # Get average emotion score
        avg_score = await conn.fetchval(
            """
            SELECT ROUND(AVG(emotion_score)::numeric, 2)
            FROM emotion_check_ins
            WHERE module_id = $1
              AND timestamp >= $2
              AND timestamp < $3
            """,
            module_id,
            date_start,
            date_end,
        )

        # Get emotion distribution
        distribution_data = await conn.fetch(
            """
            SELECT emotion_type, COUNT(*) as count
            FROM emotion_check_ins
            WHERE module_id = $1
              AND timestamp >= $2
              AND timestamp < $3
            GROUP BY emotion_type
            """,
            module_id,
            date_start,
            date_end,
        )

        emotion_distribution = {
            row['emotion_type']: row['count']
            for row in distribution_data
        }

        # Get refresh session stats
        session_stats = await conn.fetchrow(
            """
            SELECT
                COUNT(*) as total_sessions,
                COUNT(*) FILTER (WHERE completed = TRUE) as completed_sessions,
                ROUND(AVG(post_emotion_score - pre_emotion_score)::numeric, 2) as avg_improvement
            FROM student_refresh_sessions
            WHERE module_id = $1
              AND session_timestamp >= $2
              AND session_timestamp < $3
              AND post_emotion_score IS NOT NULL
            """,
            module_id,
            date_start,
            date_end,
        )

        total_sessions = session_stats['total_sessions'] or 0
        completed_sessions = session_stats['completed_sessions'] or 0
        participation_rate = (
            completed_sessions / total_students if total_students > 0 else 0
        )

        # Get top activities
        top_activities_data = await conn.fetch(
            """
            SELECT
                ra.id,
                ra.ai_generated_content->>'title' as title,
                ra.activity_type,
                COUNT(srs.id) as usage_count,
                ROUND(AVG(srs.post_emotion_score - srs.pre_emotion_score)::numeric, 2) as avg_improvement
            FROM refresh_activities ra
            JOIN student_refresh_sessions srs ON srs.activity_id = ra.id
            WHERE srs.module_id = $1
              AND srs.session_timestamp >= $2
              AND srs.session_timestamp < $3
              AND srs.post_emotion_score IS NOT NULL
            GROUP BY ra.id, ra.ai_generated_content, ra.activity_type
            ORDER BY usage_count DESC, avg_improvement DESC
            LIMIT 5
            """,
            module_id,
            date_start,
            date_end,
        )

        top_activities = [
            {
                "activity_id": str(row['id']),
                "title": row['title'],
                "activity_type": row['activity_type'],
                "usage_count": row['usage_count'],
                "avg_improvement": float(row['avg_improvement'] or 0),
            }
            for row in top_activities_data
        ]

        return EmotionAnalyticsResponse(
            module_id=module_id,
            date=date.strftime("%Y-%m-%d"),
            total_students=total_students or 0,
            total_check_ins=total_check_ins or 0,
            avg_emotion_score=float(avg_score or 0),
            emotion_distribution=emotion_distribution,
            refresh_participation_rate=participation_rate,
            avg_improvement_score=float(session_stats['avg_improvement'] or 0),
            top_activities=top_activities,
        )

    async def _cache_analytics(
        self,
        conn: asyncpg.Connection,
        module_id: UUID,
        date: datetime,
        analytics: EmotionAnalyticsResponse,
    ) -> None:
        """Cache analytics results."""
        await conn.execute(
            """
            INSERT INTO emotion_analytics_cache (
                module_id,
                date,
                total_students,
                total_check_ins,
                avg_emotion_score,
                emotion_distribution,
                total_refresh_sessions,
                refresh_participation_rate,
                avg_improvement_score,
                top_activities
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (module_id, date)
            DO UPDATE SET
                total_students = EXCLUDED.total_students,
                total_check_ins = EXCLUDED.total_check_ins,
                avg_emotion_score = EXCLUDED.avg_emotion_score,
                emotion_distribution = EXCLUDED.emotion_distribution,
                refresh_participation_rate = EXCLUDED.refresh_participation_rate,
                avg_improvement_score = EXCLUDED.avg_improvement_score,
                top_activities = EXCLUDED.top_activities,
                last_updated = NOW()
            """,
            module_id,
            date.date(),
            analytics.total_students,
            analytics.total_check_ins,
            analytics.avg_emotion_score,
            analytics.emotion_distribution,
            0,  # total_refresh_sessions - computed separately
            analytics.refresh_participation_rate,
            analytics.avg_improvement_score,
            analytics.top_activities,
        )
