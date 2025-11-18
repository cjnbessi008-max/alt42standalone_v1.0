"""
Emotion Refresh Routine - Activity Generator Service
===================================================
Uses Claude API to generate personalized refresh activities.
"""

import anthropic
import asyncpg
import json
import logging
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4

from models.emotion import (
    GenerateActivityRequest,
    GenerateActivityResponse,
    CompleteSessionRequest,
    CompleteSessionResponse,
    ActivityContent,
    ActivityStep,
    EmotionType,
    ActivityType,
)
from prompts.emotion_refresh_prompts import (
    get_activity_generation_prompt,
    get_feedback_generation_prompt,
)

logger = logging.getLogger(__name__)


class RoutineGeneratorService:
    """Service for generating and managing refresh routines"""

    def __init__(
        self,
        db_pool: asyncpg.Pool,
        anthropic_api_key: str,
        model: str = "claude-sonnet-4-5-20250929"
    ):
        """
        Initialize routine generator service.

        Args:
            db_pool: PostgreSQL connection pool
            anthropic_api_key: Anthropic API key
            model: Claude model to use
        """
        self.db_pool = db_pool
        self.client = anthropic.AsyncAnthropic(api_key=anthropic_api_key)
        self.model = model

    async def generate_activity(
        self,
        request: GenerateActivityRequest,
    ) -> GenerateActivityResponse:
        """
        Generate a personalized refresh activity using Claude API.

        Args:
            request: Activity generation request

        Returns:
            GenerateActivityResponse with activity content
        """
        async with self.db_pool.acquire() as conn:
            # Get student's grade level and preferences
            preferences = request.preferences or {}
            past_preferences = await self._get_student_activity_preferences(
                conn,
                request.student_id,
            )

            # Check if we have a cached suitable activity
            cached_activity = await self._find_cached_activity(
                conn,
                request.emotion_type,
                request.grade_level,
                preferences,
            )

            if cached_activity and self._should_use_cached(conn):
                # Use cached activity
                activity_id = cached_activity['id']
                activity_content = self._parse_activity_content(
                    cached_activity['ai_generated_content']
                )
            else:
                # Generate new activity using Claude
                activity_content = await self._generate_with_claude(
                    request.emotion_type,
                    request.emotion_score,
                    request.grade_level,
                    request.subject,
                    past_preferences,
                )

                # Save the new activity
                activity_id = await self._save_activity(
                    conn,
                    activity_content,
                    request.emotion_type,
                    request.grade_level,
                )

            # Create a session
            session_id = await self._create_session(
                conn,
                request.student_id,
                activity_id,
                request.emotion_type,
                request.emotion_score,
            )

            return GenerateActivityResponse(
                activity_id=activity_id,
                session_id=session_id,
                activity=activity_content,
            )

    async def complete_session(
        self,
        request: CompleteSessionRequest,
    ) -> CompleteSessionResponse:
        """
        Complete a refresh session and generate feedback.

        Args:
            request: Session completion request

        Returns:
            CompleteSessionResponse with improvement metrics and feedback
        """
        async with self.db_pool.acquire() as conn:
            # Get session data
            session = await conn.fetchrow(
                """
                SELECT *
                FROM student_refresh_sessions
                WHERE id = $1
                """,
                request.session_id,
            )

            if not session:
                raise ValueError(f"Session {request.session_id} not found")

            # Calculate improvement
            improvement = request.post_emotion_score - session['pre_emotion_score']

            # Update session
            await conn.execute(
                """
                UPDATE student_refresh_sessions
                SET
                    post_emotion_type = $1,
                    post_emotion_score = $2,
                    completed = $3,
                    completion_percentage = $4,
                    student_rating = $5,
                    feedback_note = $6,
                    actual_duration_seconds = $7,
                    completed_at = NOW()
                WHERE id = $8
                """,
                request.post_emotion_type.value,
                request.post_emotion_score,
                request.completed,
                request.completion_percentage,
                request.student_rating.value if request.student_rating else None,
                request.feedback_note,
                request.actual_duration_seconds,
                request.session_id,
            )

            # Update activity statistics
            if request.student_rating is not None:
                await self._update_activity_stats(
                    conn,
                    session['activity_id'],
                    improvement,
                    request.student_rating.value,
                )

            # Generate encouraging feedback using Claude
            feedback_message = await self._generate_feedback(
                session['pre_emotion_type'],
                session['pre_emotion_score'],
                request.post_emotion_type.value,
                request.post_emotion_score,
                improvement,
                request.completed,
            )

            # Check for badges
            badges = await self._check_badges(
                conn,
                session['student_id'],
                improvement,
            )

            return CompleteSessionResponse(
                session_id=request.session_id,
                improvement_score=float(improvement),
                message=feedback_message,
                badges=badges,
            )

    async def _generate_with_claude(
        self,
        emotion_type: EmotionType,
        emotion_score: int,
        grade_level: int,
        subject: str,
        past_preferences: List[str],
    ) -> ActivityContent:
        """Generate activity using Claude API."""
        # Build prompt
        prompt = get_activity_generation_prompt(
            grade_level=grade_level,
            emotion_type=emotion_type.value,
            emotion_score=emotion_score,
            session_duration_minutes=30,  # default
            subject=subject,
            past_preferences=past_preferences,
        )

        try:
            # Call Claude API
            message = await self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                temperature=0.7,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Parse response
            response_text = message.content[0].text
            activity_data = json.loads(response_text)

            # Convert to ActivityContent model
            return self._parse_activity_content(activity_data)

        except Exception as e:
            logger.error(f"Error generating activity with Claude: {e}")
            # Fall back to a default activity
            return self._get_default_activity(emotion_type)

    async def _generate_feedback(
        self,
        pre_emotion: str,
        pre_score: int,
        post_emotion: str,
        post_score: int,
        improvement: float,
        completed: bool,
    ) -> str:
        """Generate encouraging feedback using Claude API."""
        prompt = get_feedback_generation_prompt(
            pre_emotion=pre_emotion,
            pre_score=pre_score,
            post_emotion=post_emotion,
            post_score=post_score,
            improvement=improvement,
            completed=completed,
        )

        try:
            message = await self.client.messages.create(
                model=self.model,
                max_tokens=256,
                temperature=0.8,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            feedback = message.content[0].text.strip()
            return feedback

        except Exception as e:
            logger.error(f"Error generating feedback with Claude: {e}")
            # Fall back to default messages
            if improvement >= 3:
                return "와! 기분이 많이 좋아졌네요. 필요할 때마다 다시 해보세요 🌟"
            elif improvement >= 1:
                return "기분이 나아졌어요. 잘했어요! 😊"
            else:
                return "괜찮아요. 다음에 다시 시도해보면 도움이 될 거예요 💪"

    async def _get_student_activity_preferences(
        self,
        conn: asyncpg.Connection,
        student_id: UUID,
    ) -> List[str]:
        """Get student's preferred activity types based on history."""
        # Get top-rated activity types
        preferences = await conn.fetch(
            """
            SELECT
                ra.activity_type,
                COUNT(*) as usage_count,
                AVG(srs.post_emotion_score - srs.pre_emotion_score) as avg_improvement
            FROM student_refresh_sessions srs
            JOIN refresh_activities ra ON ra.id = srs.activity_id
            WHERE srs.student_id = $1
              AND srs.student_rating = 1
              AND srs.post_emotion_score IS NOT NULL
            GROUP BY ra.activity_type
            ORDER BY avg_improvement DESC, usage_count DESC
            LIMIT 3
            """,
            student_id,
        )

        return [row['activity_type'] for row in preferences]

    async def _find_cached_activity(
        self,
        conn: asyncpg.Connection,
        emotion_type: EmotionType,
        grade_level: int,
        preferences: Dict[str, List[str]],
    ) -> Optional[Dict[str, Any]]:
        """Find a suitable cached activity."""
        preferred_types = preferences.get('preferred_activities', [])
        avoid_types = preferences.get('avoid_activities', [])

        # Build query
        query = """
        SELECT *
        FROM refresh_activities
        WHERE target_emotion = $1
          AND is_active = TRUE
          AND (min_grade_level IS NULL OR min_grade_level <= $2)
          AND (max_grade_level IS NULL OR max_grade_level >= $2)
        """
        params = [emotion_type.value, grade_level]

        if avoid_types:
            query += f" AND activity_type NOT IN ({','.join('$' + str(i+3) for i in range(len(avoid_types)))})"
            params.extend(avoid_types)

        if preferred_types:
            query += f" AND activity_type IN ({','.join('$' + str(i+len(params)+1) for i in range(len(preferred_types)))})"
            params.extend(preferred_types)

        query += " ORDER BY avg_effectiveness_score DESC NULLS LAST, usage_count ASC LIMIT 1"

        activity = await conn.fetchrow(query, *params)
        return dict(activity) if activity else None

    def _should_use_cached(self, conn: asyncpg.Connection) -> bool:
        """Decide whether to use cached activity (70%) or generate new (30%)."""
        import random
        return random.random() < 0.7

    async def _save_activity(
        self,
        conn: asyncpg.Connection,
        activity: ActivityContent,
        target_emotion: EmotionType,
        grade_level: int,
    ) -> UUID:
        """Save a newly generated activity to database."""
        activity_id = await conn.fetchval(
            """
            INSERT INTO refresh_activities (
                activity_type,
                target_emotion,
                duration_seconds,
                min_grade_level,
                max_grade_level,
                ai_generated_content
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            """,
            activity.activity_type.value,
            target_emotion.value,
            activity.total_duration,
            max(1, grade_level - 2),  # Min grade
            min(12, grade_level + 2),  # Max grade
            activity.dict(),
        )

        return activity_id

    async def _create_session(
        self,
        conn: asyncpg.Connection,
        student_id: UUID,
        activity_id: UUID,
        emotion_type: EmotionType,
        emotion_score: int,
    ) -> UUID:
        """Create a new refresh session."""
        session_id = await conn.fetchval(
            """
            INSERT INTO student_refresh_sessions (
                student_id,
                activity_id,
                pre_emotion_type,
                pre_emotion_score
            )
            VALUES ($1, $2, $3, $4)
            RETURNING id
            """,
            student_id,
            activity_id,
            emotion_type.value,
            emotion_score,
        )

        return session_id

    async def _update_activity_stats(
        self,
        conn: asyncpg.Connection,
        activity_id: UUID,
        improvement: float,
        rating: int,
    ) -> None:
        """Update activity usage statistics."""
        await conn.execute(
            """
            UPDATE refresh_activities
            SET
                usage_count = usage_count + 1,
                avg_effectiveness_score = COALESCE(
                    (avg_effectiveness_score * usage_count + $2) / (usage_count + 1),
                    $2
                ),
                positive_rating_count = positive_rating_count + CASE WHEN $3 = 1 THEN 1 ELSE 0 END,
                negative_rating_count = negative_rating_count + CASE WHEN $3 = -1 THEN 1 ELSE 0 END
            WHERE id = $1
            """,
            activity_id,
            improvement,
            rating,
        )

    async def _check_badges(
        self,
        conn: asyncpg.Connection,
        student_id: UUID,
        improvement: float,
    ) -> List[str]:
        """Check if student earned any badges."""
        badges = []

        # Check if first refresh session
        session_count = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM student_refresh_sessions
            WHERE student_id = $1 AND completed = TRUE
            """,
            student_id,
        )

        if session_count == 1:
            badges.append("first_refresh")

        # Check for stress buster (improvement >= 3)
        if improvement >= 3:
            badges.append("stress_buster")

        # Check for consistency (5 sessions in last 7 days)
        recent_sessions = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM student_refresh_sessions
            WHERE student_id = $1
              AND completed = TRUE
              AND session_timestamp >= NOW() - INTERVAL '7 days'
            """,
            student_id,
        )

        if recent_sessions >= 5:
            badges.append("consistency_champion")

        return badges

    def _parse_activity_content(self, data: Dict[str, Any]) -> ActivityContent:
        """Parse activity content from JSON data."""
        steps = [
            ActivityStep(**step)
            for step in data.get('steps', [])
        ]

        return ActivityContent(
            title=data['title'],
            description=data['description'],
            activity_type=ActivityType(data['activity_type']),
            steps=steps,
            total_duration=data.get('total_duration', 60),
            background_music=data.get('background_music'),
            visual_guide=data.get('visual_guide'),
            expected_outcome=data['expected_outcome'],
            encouragement=data['encouragement'],
        )

    def _get_default_activity(self, emotion_type: EmotionType) -> ActivityContent:
        """Get a default fallback activity."""
        # Simple breathing exercise as fallback
        return ActivityContent(
            title="차분한 호흡",
            description="깊게 숨을 쉬며 마음을 진정시켜요",
            activity_type=ActivityType.BREATHING,
            steps=[
                ActivityStep(
                    time_seconds=0,
                    instruction="편안하게 앉아 눈을 감으세요",
                    duration_seconds=10,
                    visual_cue="relax"
                ),
                ActivityStep(
                    time_seconds=10,
                    instruction="천천히 깊게 숨을 들이마세요",
                    duration_seconds=15,
                    visual_cue="inhale"
                ),
                ActivityStep(
                    time_seconds=25,
                    instruction="잠시 숨을 참으세요",
                    duration_seconds=10,
                    visual_cue="hold"
                ),
                ActivityStep(
                    time_seconds=35,
                    instruction="천천히 숨을 내쉬세요",
                    duration_seconds=15,
                    visual_cue="exhale"
                ),
                ActivityStep(
                    time_seconds=50,
                    instruction="눈을 뜨고 기분을 느껴보세요",
                    duration_seconds=10,
                    visual_cue="relax"
                ),
            ],
            total_duration=60,
            expected_outcome="마음이 차분해질 거예요",
            encouragement="잘했어요! 🌟",
        )
