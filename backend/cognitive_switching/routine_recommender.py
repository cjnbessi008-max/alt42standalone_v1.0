"""
Cognitive Switching Routine Recommender

Recommends personalized break activities and cognitive switching routines
based on fatigue level, learning context, and student preferences.
"""

import logging
from typing import Dict, List, Optional
from dataclasses import dataclass
import asyncpg

from backend.fatigue_detection.fatigue_calculator import FatigueLevel, CognitiveDomain

logger = logging.getLogger(__name__)


@dataclass
class RoutineRecommendation:
    """Recommended routine with context."""
    routine_id: str
    name: str
    name_ko: Optional[str]
    description: str
    routine_type: str  # light, medium, deep
    duration_minutes: int
    activities: List[Dict]
    match_score: float  # 0-1, how well it matches current situation
    reason: str  # Why this routine was recommended


class RoutineRecommender:
    """
    Recommends cognitive switching routines based on fatigue state.

    Uses:
    - Current fatigue level
    - Source cognitive domain
    - Student preferences and history
    - Routine effectiveness data
    """

    def __init__(self, db_pool: asyncpg.Pool):
        """
        Initialize RoutineRecommender.

        Args:
            db_pool: PostgreSQL connection pool
        """
        self.db_pool = db_pool

    async def recommend_routine(
        self,
        student_id: str,
        session_id: str,
        fatigue_score: int,
        fatigue_level: FatigueLevel,
        current_domain: CognitiveDomain
    ) -> Optional[RoutineRecommendation]:
        """
        Recommend best routine for current situation.

        Args:
            student_id: Student UUID
            session_id: Session UUID
            fatigue_score: Current fatigue score (0-100)
            fatigue_level: Fatigue level classification
            current_domain: Current cognitive domain

        Returns:
            RoutineRecommendation or None
        """
        # Get candidate routines based on fatigue level
        candidates = await self._get_candidate_routines(
            fatigue_score, fatigue_level
        )

        if not candidates:
            logger.warning(f"No routine candidates found for fatigue level {fatigue_level.value}")
            return None

        # Get student preferences and history
        preferences = await self._get_student_preferences(student_id)
        history = await self._get_student_routine_history(student_id, limit=20)

        # Score each candidate
        scored_routines = []
        for routine in candidates:
            score = await self._calculate_match_score(
                routine, current_domain, preferences, history
            )

            scored_routines.append((routine, score))

        # Sort by score (descending)
        scored_routines.sort(key=lambda x: x[1], reverse=True)

        # Select best match
        best_routine, best_score = scored_routines[0]

        # Generate recommendation reason
        reason = self._generate_recommendation_reason(
            best_routine, fatigue_level, current_domain
        )

        recommendation = RoutineRecommendation(
            routine_id=best_routine['id'],
            name=best_routine['name'],
            name_ko=best_routine.get('name_ko'),
            description=best_routine['description'],
            routine_type=best_routine['routine_type'],
            duration_minutes=best_routine['duration_minutes'],
            activities=best_routine['activities'],
            match_score=best_score,
            reason=reason
        )

        logger.info(
            f"Recommended routine '{best_routine['name']}' "
            f"(score: {best_score:.2f}) for student {student_id}"
        )

        return recommendation

    async def _get_candidate_routines(
        self,
        fatigue_score: int,
        fatigue_level: FatigueLevel
    ) -> List[Dict]:
        """
        Get candidate routines matching fatigue level.

        Args:
            fatigue_score: Fatigue score (0-100)
            fatigue_level: Fatigue level classification

        Returns:
            List of routine dictionaries
        """
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT
                    id, name, name_ko, description, description_ko,
                    routine_type, duration_minutes,
                    source_domain, target_domain, is_domain_switch,
                    activities,
                    times_recommended, times_completed, completion_rate,
                    avg_fatigue_reduction, avg_effectiveness_score
                FROM cognitive_switching_routines
                WHERE is_active = true
                  AND min_fatigue_score <= $1
                  AND max_fatigue_score >= $1
                ORDER BY avg_effectiveness_score DESC NULLS LAST
            """, fatigue_score)

            return [dict(row) for row in rows]

    async def _get_student_preferences(self, student_id: str) -> Dict:
        """
        Get student's routine preferences.

        Returns:
            Dictionary with preference data
        """
        async with self.db_pool.acquire() as conn:
            # Get preferred activities from student profile
            row = await conn.fetchrow("""
                SELECT preferred_break_activities
                FROM students
                WHERE id = $1
            """, student_id)

            if row and row['preferred_break_activities']:
                return {
                    'preferred_activities': row['preferred_break_activities'],
                    'has_preferences': True
                }

            return {
                'preferred_activities': [],
                'has_preferences': False
            }

    async def _get_student_routine_history(
        self,
        student_id: str,
        limit: int = 20
    ) -> List[Dict]:
        """
        Get student's recent routine history for pattern analysis.

        Args:
            student_id: Student UUID
            limit: Number of recent records

        Returns:
            List of routine history records
        """
        async with self.db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT
                    routine_id,
                    completion_status,
                    fatigue_score_change,
                    was_helpful,
                    helpfulness_score,
                    recommended_at
                FROM student_routine_history
                WHERE student_id = $1
                ORDER BY recommended_at DESC
                LIMIT $2
            """, student_id, limit)

            return [dict(row) for row in rows]

    async def _calculate_match_score(
        self,
        routine: Dict,
        current_domain: CognitiveDomain,
        preferences: Dict,
        history: List[Dict]
    ) -> float:
        """
        Calculate match score for a routine.

        Factors:
        - Domain switching effectiveness (30%)
        - Student preferences (25%)
        - Historical effectiveness (25%)
        - Completion rate (20%)

        Returns:
            Score between 0.0 and 1.0
        """
        scores = []

        # 1. Domain switching effectiveness (30%)
        domain_score = self._score_domain_match(routine, current_domain)
        scores.append(domain_score * 0.30)

        # 2. Student preferences (25%)
        preference_score = self._score_preferences(routine, preferences)
        scores.append(preference_score * 0.25)

        # 3. Historical effectiveness (25%)
        effectiveness_score = self._score_historical_effectiveness(routine, history)
        scores.append(effectiveness_score * 0.25)

        # 4. Completion rate (20%)
        completion_score = routine['completion_rate'] / 100 if routine['completion_rate'] else 0.5
        scores.append(completion_score * 0.20)

        total_score = sum(scores)

        return min(1.0, max(0.0, total_score))

    def _score_domain_match(
        self,
        routine: Dict,
        current_domain: CognitiveDomain
    ) -> float:
        """
        Score how well routine switches cognitive domains.

        Returns:
            Score between 0.0 and 1.0
        """
        if not routine['is_domain_switch']:
            return 0.5  # Neutral score for non-domain-switching activities

        source = routine.get('source_domain', '').lower()
        target = routine.get('target_domain', '').lower()
        current = current_domain.value.lower()

        # Define domain opposites
        domain_pairs = {
            'verbal': 'spatial',
            'logical': 'creative',
            'analytical': 'interpersonal',
            'mathematical': 'kinesthetic',
        }

        # Check if source matches current domain
        source_match = source in current or current in source

        # Check if target is opposite domain
        opposite_domain = domain_pairs.get(current, '').lower()
        target_is_opposite = target in opposite_domain or opposite_domain in target

        if source_match and target_is_opposite:
            return 1.0  # Perfect domain switch
        elif source_match:
            return 0.7  # Good source match
        elif target_is_opposite:
            return 0.6  # Good target
        else:
            return 0.4  # Suboptimal

    def _score_preferences(self, routine: Dict, preferences: Dict) -> float:
        """
        Score based on student preferences.

        Returns:
            Score between 0.0 and 1.0
        """
        if not preferences.get('has_preferences'):
            return 0.5  # Neutral if no preferences

        preferred_activities = preferences['preferred_activities']
        routine_activities = routine['activities']

        # Count matching activity types
        routine_types = {act.get('type') for act in routine_activities}
        matches = len(routine_types.intersection(preferred_activities))

        if matches > 0:
            return min(1.0, 0.5 + (matches * 0.25))  # Boost for matches

        return 0.3  # Lower score if no matches

    def _score_historical_effectiveness(
        self,
        routine: Dict,
        history: List[Dict]
    ) -> float:
        """
        Score based on student's history with this routine.

        Returns:
            Score between 0.0 and 1.0
        """
        routine_id = routine['id']

        # Filter history for this specific routine
        routine_history = [h for h in history if h['routine_id'] == routine_id]

        if not routine_history:
            # No history; use global effectiveness
            if routine['avg_effectiveness_score']:
                return routine['avg_effectiveness_score'] / 5.0  # Normalize to 0-1
            return 0.5  # Neutral

        # Calculate personal effectiveness
        completed = [h for h in routine_history if h['completion_status'] == 'completed']

        if not completed:
            return 0.2  # Low score if never completed

        # Average fatigue reduction
        avg_reduction = sum(
            h['fatigue_score_change'] for h in completed if h['fatigue_score_change']
        ) / len(completed)

        # Average helpfulness
        helpful_ratings = [h['helpfulness_score'] for h in completed if h['helpfulness_score']]
        avg_helpfulness = sum(helpful_ratings) / len(helpful_ratings) if helpful_ratings else 3

        # Combine metrics
        reduction_score = min(1.0, max(0.0, avg_reduction / 30))  # 30-point reduction = perfect
        helpfulness_score = avg_helpfulness / 5.0  # Normalize to 0-1

        return (reduction_score * 0.6) + (helpfulness_score * 0.4)

    def _generate_recommendation_reason(
        self,
        routine: Dict,
        fatigue_level: FatigueLevel,
        current_domain: CognitiveDomain
    ) -> str:
        """
        Generate human-readable reason for recommendation.

        Args:
            routine: Selected routine
            fatigue_level: Current fatigue level
            current_domain: Current cognitive domain

        Returns:
            Explanation string
        """
        reasons = []

        # Fatigue level reason
        if fatigue_level == FatigueLevel.CRITICAL:
            reasons.append("Your fatigue level is critical")
        elif fatigue_level == FatigueLevel.HIGH:
            reasons.append("You're experiencing high fatigue")
        elif fatigue_level == FatigueLevel.MODERATE:
            reasons.append("Your focus is declining")

        # Routine type reason
        if routine['routine_type'] == 'deep':
            reasons.append("a substantial break is recommended")
        elif routine['routine_type'] == 'medium':
            reasons.append("a moderate break will help refresh you")
        else:
            reasons.append("a quick break can restore your focus")

        # Domain switching reason
        if routine['is_domain_switch']:
            reasons.append(
                f"switching from {current_domain.value} to "
                f"{routine.get('target_domain', 'different')} activities will help"
            )

        # Combine reasons
        return f"{reasons[0]}, and {' '.join(reasons[1:])}."

    async def get_routine_details(self, routine_id: str) -> Optional[Dict]:
        """
        Get detailed routine information.

        Args:
            routine_id: Routine UUID

        Returns:
            Routine dictionary or None
        """
        async with self.db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT
                    id, name, name_ko, description, description_ko,
                    routine_type, duration_minutes,
                    source_domain, target_domain, is_domain_switch,
                    activities,
                    times_recommended, times_completed, completion_rate,
                    avg_fatigue_reduction, avg_effectiveness_score
                FROM cognitive_switching_routines
                WHERE id = $1 AND is_active = true
            """, routine_id)

            return dict(row) if row else None

    async def get_all_routines(
        self,
        routine_type: Optional[str] = None
    ) -> List[Dict]:
        """
        Get all active routines, optionally filtered by type.

        Args:
            routine_type: Filter by type (light, medium, deep)

        Returns:
            List of routine dictionaries
        """
        async with self.db_pool.acquire() as conn:
            if routine_type:
                rows = await conn.fetch("""
                    SELECT
                        id, name, name_ko, description, description_ko,
                        routine_type, duration_minutes,
                        activities, completion_rate, avg_effectiveness_score
                    FROM cognitive_switching_routines
                    WHERE is_active = true AND routine_type = $1
                    ORDER BY avg_effectiveness_score DESC NULLS LAST
                """, routine_type)
            else:
                rows = await conn.fetch("""
                    SELECT
                        id, name, name_ko, description, description_ko,
                        routine_type, duration_minutes,
                        activities, completion_rate, avg_effectiveness_score
                    FROM cognitive_switching_routines
                    WHERE is_active = true
                    ORDER BY routine_type, avg_effectiveness_score DESC NULLS LAST
                """)

            return [dict(row) for row in rows]
