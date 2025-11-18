"""Recommendation engine for suggesting alternative problem-solving strategies."""
import logging
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Problem,
    Recommendation,
    SolutionStrategy,
    StrategyMastery,
    StudentAttempt,
    User,
)

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Engine for generating personalized strategy recommendations."""

    def __init__(self, db: AsyncSession):
        """Initialize recommendation engine.

        Args:
            db: Database session
        """
        self.db = db

    async def get_student_profile(self, user_id: UUID) -> dict[str, Any]:
        """Get student's learning profile and statistics.

        Args:
            user_id: Student user ID

        Returns:
            Dictionary with student profile data
        """
        # Get user
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")

        # Get attempt statistics
        total_attempts = await self.db.scalar(
            select(func.count(StudentAttempt.id)).where(
                StudentAttempt.user_id == user_id
            )
        )

        correct_attempts = await self.db.scalar(
            select(func.count(StudentAttempt.id)).where(
                StudentAttempt.user_id == user_id,
                StudentAttempt.is_correct == True,
            )
        )

        # Get strategy mastery
        strategy_mastery = await self.db.scalars(
            select(StrategyMastery).where(StrategyMastery.user_id == user_id)
        )
        mastery_list = strategy_mastery.all()

        # Calculate diversity score (how many different strategies used)
        unique_strategies = await self.db.scalar(
            select(func.count(func.distinct(StudentAttempt.strategy_id))).where(
                StudentAttempt.user_id == user_id,
                StudentAttempt.strategy_id.isnot(None),
            )
        )

        return {
            "user_id": str(user_id),
            "username": user.username,
            "learning_profile": user.learning_profile or {},
            "total_attempts": total_attempts or 0,
            "correct_attempts": correct_attempts or 0,
            "success_rate": (
                (correct_attempts / total_attempts * 100)
                if total_attempts
                else 0
            ),
            "unique_strategies_used": unique_strategies or 0,
            "strategy_mastery": [
                {
                    "strategy_type": sm.strategy_type,
                    "topic": sm.topic,
                    "mastery_level": sm.mastery_level,
                    "success_rate": float(sm.success_rate) if sm.success_rate else 0,
                    "attempts_count": sm.attempts_count,
                }
                for sm in mastery_list
            ],
        }

    async def identify_weak_strategies(
        self, user_id: UUID, topic: Optional[str] = None
    ) -> list[str]:
        """Identify strategies the student needs to practice.

        Args:
            user_id: Student user ID
            topic: Optional topic to filter by

        Returns:
            List of strategy types to focus on
        """
        query = select(StrategyMastery).where(StrategyMastery.user_id == user_id)

        if topic:
            query = query.where(StrategyMastery.topic == topic)

        result = await self.db.scalars(query)
        mastery_list = result.all()

        # Find strategies with low success rate or low attempt count
        weak_strategies = []
        for sm in mastery_list:
            if sm.attempts_count < 3:
                # Not enough practice
                weak_strategies.append(sm.strategy_type)
            elif sm.success_rate < 60:
                # Low success rate
                weak_strategies.append(sm.strategy_type)

        # Also identify strategy types that haven't been tried at all
        # Get all available strategy types
        all_strategy_types_result = await self.db.scalars(
            select(func.distinct(SolutionStrategy.strategy_type))
        )
        all_strategy_types = all_strategy_types_result.all()

        tried_types = {sm.strategy_type for sm in mastery_list}
        untried_types = set(all_strategy_types) - tried_types

        weak_strategies.extend(untried_types)

        return list(set(weak_strategies))  # Remove duplicates

    async def generate_recommendations(
        self,
        user_id: UUID,
        problem_id: UUID,
        max_recommendations: int = 3,
    ) -> list[dict[str, Any]]:
        """Generate personalized strategy recommendations for a problem.

        Args:
            user_id: Student user ID
            problem_id: Problem ID
            max_recommendations: Maximum number of recommendations

        Returns:
            List of recommendation dictionaries
        """
        # Get student profile
        profile = await self.get_student_profile(user_id)

        # Get problem details
        problem = await self.db.get(Problem, problem_id)
        if not problem:
            raise ValueError(f"Problem {problem_id} not found")

        # Get all available strategies for this problem
        strategies_result = await self.db.scalars(
            select(SolutionStrategy)
            .where(SolutionStrategy.problem_id == problem_id)
            .order_by(SolutionStrategy.created_at)
        )
        strategies = strategies_result.all()

        if not strategies:
            logger.warning(f"No strategies available for problem {problem_id}")
            return []

        # Get strategies the student has already attempted
        attempted_strategies_result = await self.db.scalars(
            select(StudentAttempt.strategy_id).where(
                StudentAttempt.user_id == user_id,
                StudentAttempt.problem_id == problem_id,
                StudentAttempt.strategy_id.isnot(None),
            )
        )
        attempted_strategy_ids = {
            str(sid) for sid in attempted_strategies_result.all()
        }

        # Identify weak strategies
        weak_strategies = await self.identify_weak_strategies(
            user_id, topic=problem.topic
        )

        # Score each strategy
        scored_strategies = []
        for strategy in strategies:
            if str(strategy.id) in attempted_strategy_ids:
                continue  # Skip already attempted strategies

            score = 0
            reason_parts = []

            # Priority 1: Addresses weak areas (high weight)
            if strategy.strategy_type in weak_strategies:
                score += 50
                reason_parts.append(f"practice {strategy.strategy_type} approach")

            # Priority 2: Difficulty level appropriate for student
            student_level_map = {
                "novice": 1,
                "developing": 2,
                "proficient": 3,
                "expert": 4,
            }
            student_level = student_level_map.get(
                profile.get("learning_profile", {}).get("mastery_level", "developing"),
                2,
            )
            adjusted_difficulty = problem.difficulty_level + strategy.difficulty_modifier

            if abs(adjusted_difficulty - student_level) <= 1:
                score += 30
                reason_parts.append("appropriate difficulty")
            elif adjusted_difficulty < student_level:
                score += 10
                reason_parts.append("build confidence")

            # Priority 3: Strategy diversity
            strategies_used = profile.get("unique_strategies_used", 0)
            if strategies_used < 5:
                score += 20
                reason_parts.append("expand problem-solving toolkit")

            # Priority 4: Popular/effective strategies
            # (Could be based on aggregate data - placeholder for now)
            if strategy.strategy_type in ["algebraic", "visual"]:
                score += 10

            scored_strategies.append(
                {
                    "strategy": strategy,
                    "score": score,
                    "reason": (
                        f"This helps you {', '.join(reason_parts)}"
                        if reason_parts
                        else "Try this alternative approach"
                    ),
                }
            )

        # Sort by score and take top N
        scored_strategies.sort(key=lambda x: x["score"], reverse=True)
        top_strategies = scored_strategies[:max_recommendations]

        # Create recommendation records
        recommendations = []
        for idx, item in enumerate(top_strategies, start=1):
            strategy = item["strategy"]

            recommendation = Recommendation(
                user_id=user_id,
                problem_id=problem_id,
                recommended_strategy_id=strategy.id,
                reason=item["reason"],
                priority=idx,
                status="pending",
            )

            self.db.add(recommendation)
            recommendations.append(
                {
                    "recommendation_id": str(recommendation.id),
                    "strategy_id": str(strategy.id),
                    "strategy_name": strategy.strategy_name,
                    "strategy_type": strategy.strategy_type,
                    "description": strategy.description,
                    "reason": item["reason"],
                    "priority": idx,
                    "difficulty_modifier": strategy.difficulty_modifier,
                }
            )

        await self.db.commit()
        logger.info(f"Generated {len(recommendations)} recommendations for user {user_id}")

        return recommendations

    async def update_recommendation_status(
        self,
        recommendation_id: UUID,
        status: str,
    ) -> bool:
        """Update recommendation status.

        Args:
            recommendation_id: Recommendation ID
            status: New status ('accepted', 'skipped', 'completed')

        Returns:
            True if successful
        """
        recommendation = await self.db.get(Recommendation, recommendation_id)
        if not recommendation:
            logger.warning(f"Recommendation {recommendation_id} not found")
            return False

        recommendation.status = status

        if status == "completed":
            from datetime import datetime, timezone

            recommendation.completed_at = datetime.now(timezone.utc)

        await self.db.commit()
        logger.info(f"Updated recommendation {recommendation_id} status to {status}")
        return True

    async def get_pending_recommendations(
        self, user_id: UUID
    ) -> list[dict[str, Any]]:
        """Get pending recommendations for a user.

        Args:
            user_id: Student user ID

        Returns:
            List of pending recommendation dictionaries
        """
        result = await self.db.scalars(
            select(Recommendation)
            .where(
                Recommendation.user_id == user_id,
                Recommendation.status == "pending",
            )
            .order_by(Recommendation.priority)
        )

        recommendations = result.all()

        return [
            {
                "recommendation_id": str(rec.id),
                "problem_id": str(rec.problem_id),
                "strategy_id": str(rec.recommended_strategy_id),
                "reason": rec.reason,
                "priority": rec.priority,
                "created_at": rec.created_at.isoformat(),
            }
            for rec in recommendations
        ]

    async def update_strategy_mastery(
        self,
        user_id: UUID,
        strategy_type: str,
        topic: str,
        is_correct: bool,
    ) -> None:
        """Update student's mastery for a strategy type.

        Args:
            user_id: Student user ID
            strategy_type: Strategy type
            topic: Problem topic
            is_correct: Whether the attempt was correct
        """
        from datetime import datetime, timezone

        # Find or create strategy mastery record
        result = await self.db.scalars(
            select(StrategyMastery).where(
                StrategyMastery.user_id == user_id,
                StrategyMastery.strategy_type == strategy_type,
                StrategyMastery.topic == topic,
            )
        )
        mastery = result.first()

        if not mastery:
            mastery = StrategyMastery(
                user_id=user_id,
                strategy_type=strategy_type,
                topic=topic,
                attempts_count=0,
                success_count=0,
            )
            self.db.add(mastery)

        # Update counts
        mastery.attempts_count += 1
        if is_correct:
            mastery.success_count += 1

        mastery.last_practiced_at = datetime.now(timezone.utc)

        # Update mastery level
        mastery.update_mastery_level()

        await self.db.commit()
        logger.info(
            f"Updated mastery for user {user_id}, strategy {strategy_type}: "
            f"{mastery.success_count}/{mastery.attempts_count} ({mastery.mastery_level})"
        )
