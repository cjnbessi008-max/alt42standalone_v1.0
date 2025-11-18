"""Student progress tracking service."""
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    PracticeSession,
    Problem,
    SolutionStrategy,
    StrategyMastery,
    StudentAttempt,
)

logger = logging.getLogger(__name__)


class ProgressTracker:
    """Service for tracking and analyzing student progress."""

    def __init__(self, db: AsyncSession):
        """Initialize progress tracker.

        Args:
            db: Database session
        """
        self.db = db

    async def record_attempt(
        self,
        user_id: UUID,
        problem_id: UUID,
        strategy_id: Optional[UUID],
        student_answer: str,
        is_correct: bool,
        time_spent_seconds: int,
        hints_used: int = 0,
        confidence_level: Optional[int] = None,
    ) -> UUID:
        """Record a student's problem attempt.

        Args:
            user_id: Student user ID
            problem_id: Problem ID
            strategy_id: Strategy ID used (optional)
            student_answer: Student's answer
            is_correct: Whether answer is correct
            time_spent_seconds: Time spent on problem
            hints_used: Number of hints used
            confidence_level: Student's confidence (1-5)

        Returns:
            Attempt ID
        """
        # Get attempt number
        result = await self.db.scalar(
            select(func.count(StudentAttempt.id)).where(
                StudentAttempt.user_id == user_id,
                StudentAttempt.problem_id == problem_id,
                StudentAttempt.strategy_id == strategy_id,
            )
        )
        attempt_number = (result or 0) + 1

        # Create attempt record
        attempt = StudentAttempt(
            user_id=user_id,
            problem_id=problem_id,
            strategy_id=strategy_id,
            attempt_number=attempt_number,
            student_answer=student_answer,
            is_correct=is_correct,
            time_spent_seconds=time_spent_seconds,
            hints_used=hints_used,
            confidence_level=confidence_level,
        )

        self.db.add(attempt)
        await self.db.commit()
        await self.db.refresh(attempt)

        logger.info(
            f"Recorded attempt for user {user_id}, problem {problem_id}: "
            f"correct={is_correct}, attempt #{attempt_number}"
        )

        return attempt.id

    async def get_student_statistics(
        self, user_id: UUID, days: int = 30
    ) -> dict[str, Any]:
        """Get comprehensive statistics for a student.

        Args:
            user_id: Student user ID
            days: Number of days to look back (default: 30)

        Returns:
            Dictionary with student statistics
        """
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

        # Total attempts
        total_attempts = await self.db.scalar(
            select(func.count(StudentAttempt.id)).where(
                StudentAttempt.user_id == user_id,
                StudentAttempt.attempted_at >= cutoff_date,
            )
        )

        # Correct attempts
        correct_attempts = await self.db.scalar(
            select(func.count(StudentAttempt.id)).where(
                StudentAttempt.user_id == user_id,
                StudentAttempt.is_correct == True,
                StudentAttempt.attempted_at >= cutoff_date,
            )
        )

        # Unique problems attempted
        unique_problems = await self.db.scalar(
            select(func.count(func.distinct(StudentAttempt.problem_id))).where(
                StudentAttempt.user_id == user_id,
                StudentAttempt.attempted_at >= cutoff_date,
            )
        )

        # Unique strategies used
        unique_strategies = await self.db.scalar(
            select(func.count(func.distinct(StudentAttempt.strategy_id))).where(
                StudentAttempt.user_id == user_id,
                StudentAttempt.strategy_id.isnot(None),
                StudentAttempt.attempted_at >= cutoff_date,
            )
        )

        # Average time per problem
        avg_time = await self.db.scalar(
            select(func.avg(StudentAttempt.time_spent_seconds)).where(
                StudentAttempt.user_id == user_id,
                StudentAttempt.attempted_at >= cutoff_date,
            )
        )

        # Practice sessions
        sessions_result = await self.db.scalars(
            select(PracticeSession).where(
                PracticeSession.user_id == user_id,
                PracticeSession.started_at >= cutoff_date,
            )
        )
        sessions = sessions_result.all()

        total_sessions = len(sessions)
        total_practice_time = sum(
            (s.duration_minutes or 0) for s in sessions if s.ended_at
        )

        # Strategy mastery breakdown
        mastery_result = await self.db.scalars(
            select(StrategyMastery).where(StrategyMastery.user_id == user_id)
        )
        mastery_list = mastery_result.all()

        strategy_breakdown = [
            {
                "strategy_type": sm.strategy_type,
                "topic": sm.topic,
                "mastery_level": sm.mastery_level,
                "success_rate": float(sm.success_rate) if sm.success_rate else 0,
                "attempts": sm.attempts_count,
            }
            for sm in mastery_list
        ]

        return {
            "period_days": days,
            "total_attempts": total_attempts or 0,
            "correct_attempts": correct_attempts or 0,
            "success_rate": (
                (correct_attempts / total_attempts * 100) if total_attempts else 0
            ),
            "unique_problems": unique_problems or 0,
            "unique_strategies": unique_strategies or 0,
            "average_time_seconds": int(avg_time) if avg_time else 0,
            "total_sessions": total_sessions,
            "total_practice_time_minutes": total_practice_time,
            "strategy_breakdown": strategy_breakdown,
        }

    async def get_problem_attempts(
        self, user_id: UUID, problem_id: UUID
    ) -> list[dict[str, Any]]:
        """Get all attempts for a specific problem.

        Args:
            user_id: Student user ID
            problem_id: Problem ID

        Returns:
            List of attempt dictionaries
        """
        result = await self.db.scalars(
            select(StudentAttempt)
            .where(
                StudentAttempt.user_id == user_id,
                StudentAttempt.problem_id == problem_id,
            )
            .order_by(StudentAttempt.attempted_at)
        )

        attempts = result.all()

        return [
            {
                "attempt_id": str(a.id),
                "attempt_number": a.attempt_number,
                "strategy_id": str(a.strategy_id) if a.strategy_id else None,
                "is_correct": a.is_correct,
                "time_spent_seconds": a.time_spent_seconds,
                "hints_used": a.hints_used,
                "confidence_level": a.confidence_level,
                "attempted_at": a.attempted_at.isoformat(),
            }
            for a in attempts
        ]

    async def start_practice_session(
        self, user_id: UUID, session_type: str = "free_practice"
    ) -> UUID:
        """Start a new practice session.

        Args:
            user_id: Student user ID
            session_type: Type of session (guided|free_practice|challenge|review)

        Returns:
            Session ID
        """
        session = PracticeSession(
            user_id=user_id,
            session_type=session_type,
        )

        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)

        logger.info(f"Started {session_type} session for user {user_id}")
        return session.id

    async def end_practice_session(
        self,
        session_id: UUID,
        total_problems: int,
        problems_correct: int,
        strategies_explored: int,
    ) -> None:
        """End a practice session and record statistics.

        Args:
            session_id: Session ID
            total_problems: Total problems attempted
            problems_correct: Number of correct solutions
            strategies_explored: Number of different strategies used
        """
        session = await self.db.get(PracticeSession, session_id)
        if not session:
            logger.warning(f"Session {session_id} not found")
            return

        session.ended_at = datetime.now(timezone.utc)
        session.total_problems = total_problems
        session.problems_correct = problems_correct
        session.strategies_explored = strategies_explored

        await self.db.commit()

        logger.info(
            f"Ended session {session_id}: {problems_correct}/{total_problems} correct, "
            f"{strategies_explored} strategies explored"
        )

    async def get_learning_insights(self, user_id: UUID) -> dict[str, Any]:
        """Generate AI-powered learning insights for a student.

        Args:
            user_id: Student user ID

        Returns:
            Dictionary with insights and recommendations
        """
        stats = await self.get_student_statistics(user_id, days=30)

        insights = []

        # Insight: Success rate
        success_rate = stats["success_rate"]
        if success_rate >= 80:
            insights.append({
                "type": "achievement",
                "message": f"Excellent work! You're solving {success_rate:.0f}% of problems correctly.",
                "icon": "🎉",
            })
        elif success_rate >= 60:
            insights.append({
                "type": "progress",
                "message": f"Good progress! You're at {success_rate:.0f}% success rate.",
                "icon": "👍",
            })
        else:
            insights.append({
                "type": "encouragement",
                "message": "Keep practicing! Every problem helps you improve.",
                "icon": "💪",
            })

        # Insight: Strategy diversity
        unique_strategies = stats["unique_strategies"]
        if unique_strategies < 3:
            insights.append({
                "type": "suggestion",
                "message": "Try exploring different solving strategies to become a more flexible problem solver!",
                "icon": "🔍",
            })
        elif unique_strategies >= 5:
            insights.append({
                "type": "achievement",
                "message": f"Great! You've mastered {unique_strategies} different solving strategies.",
                "icon": "⭐",
            })

        # Insight: Practice consistency
        total_sessions = stats["total_sessions"]
        if total_sessions >= 10:
            insights.append({
                "type": "achievement",
                "message": f"Impressive dedication! You've completed {total_sessions} practice sessions.",
                "icon": "🔥",
            })
        elif total_sessions < 3:
            insights.append({
                "type": "suggestion",
                "message": "Regular practice helps! Try to practice a few times a week.",
                "icon": "📅",
            })

        # Insight: Strategy mastery
        strategy_breakdown = stats["strategy_breakdown"]
        if strategy_breakdown:
            expert_strategies = [
                s for s in strategy_breakdown if s["mastery_level"] == "expert"
            ]
            if expert_strategies:
                insights.append({
                    "type": "achievement",
                    "message": f"You're an expert in {', '.join(s['strategy_type'] for s in expert_strategies)}!",
                    "icon": "🏆",
                })

            developing_strategies = [
                s for s in strategy_breakdown if s["mastery_level"] in ["novice", "developing"]
            ]
            if developing_strategies:
                insights.append({
                    "type": "focus_area",
                    "message": f"Focus on improving: {', '.join(s['strategy_type'] for s in developing_strategies[:2])}",
                    "icon": "🎯",
                })

        return {
            "insights": insights,
            "statistics": stats,
        }

    async def get_recent_activity(
        self, user_id: UUID, limit: int = 10
    ) -> list[dict[str, Any]]:
        """Get recent practice activity for a student.

        Args:
            user_id: Student user ID
            limit: Maximum number of activities to return

        Returns:
            List of recent activity dictionaries
        """
        result = await self.db.scalars(
            select(StudentAttempt)
            .where(StudentAttempt.user_id == user_id)
            .order_by(StudentAttempt.attempted_at.desc())
            .limit(limit)
        )

        attempts = result.all()

        activities = []
        for attempt in attempts:
            # Get problem info
            problem = await self.db.get(Problem, attempt.problem_id)

            # Get strategy info if available
            strategy = None
            if attempt.strategy_id:
                strategy = await self.db.get(SolutionStrategy, attempt.strategy_id)

            activities.append({
                "attempt_id": str(attempt.id),
                "problem_type": problem.problem_type if problem else "unknown",
                "problem_text": problem.original_text[:100] + "..." if problem and len(problem.original_text) > 100 else (problem.original_text if problem else ""),
                "strategy_name": strategy.strategy_name if strategy else "Original approach",
                "is_correct": attempt.is_correct,
                "time_spent_seconds": attempt.time_spent_seconds,
                "attempted_at": attempt.attempted_at.isoformat(),
            })

        return activities
