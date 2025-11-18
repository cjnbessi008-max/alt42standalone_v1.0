"""
Performance Analysis Service

Analyzes student performance and updates performance metrics
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, Integer
from typing import Dict, List
from datetime import datetime, timedelta
import logging

from ..models import (
    Student,
    ProblemType,
    StudentAttempt,
    PerformanceMetric
)

logger = logging.getLogger(__name__)


class PerformanceAnalyzer:
    """
    Analyzes and aggregates student performance metrics
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def update_metrics_for_attempt(
        self,
        student_id: str,
        problem_type_id: str,
        attempt: StudentAttempt
    ) -> PerformanceMetric:
        """
        Update performance metrics after a new attempt

        Args:
            student_id: Student UUID
            problem_type_id: Problem type UUID
            attempt: The student attempt that was just made

        Returns:
            Updated PerformanceMetric
        """
        # Get or create performance metric
        query = select(PerformanceMetric).where(
            and_(
                PerformanceMetric.student_id == student_id,
                PerformanceMetric.problem_type_id == problem_type_id
            )
        )

        result = await self.db.execute(query)
        metric = result.scalar_one_or_none()

        if not metric:
            metric = PerformanceMetric(
                student_id=student_id,
                problem_type_id=problem_type_id,
                total_attempts=0,
                correct_attempts=0,
                first_attempt_at=attempt.submitted_at
            )
            self.db.add(metric)

        # Update metrics
        metric.total_attempts += 1
        if attempt.is_correct:
            metric.correct_attempts += 1

        metric.total_hints_used += attempt.hints_used
        if attempt.gave_up:
            metric.total_gave_up += 1

        metric.last_attempt_at = attempt.submitted_at

        # Update time statistics
        time_spent = attempt.time_spent_seconds
        if metric.avg_solve_time_seconds is None:
            metric.avg_solve_time_seconds = time_spent
            metric.min_solve_time_seconds = time_spent
            metric.max_solve_time_seconds = time_spent
        else:
            # Running average
            total_time = metric.avg_solve_time_seconds * (metric.total_attempts - 1) + time_spent
            metric.avg_solve_time_seconds = int(total_time / metric.total_attempts)
            metric.min_solve_time_seconds = min(metric.min_solve_time_seconds or time_spent, time_spent)
            metric.max_solve_time_seconds = max(metric.max_solve_time_seconds or time_spent, time_spent)

        # Calculate mastery level (0-100)
        metric.mastery_level = self._calculate_mastery_level(metric)

        # Determine trend
        metric.trend = await self._calculate_trend(student_id, problem_type_id)

        await self.db.commit()
        await self.db.refresh(metric)

        logger.info(f"Updated metrics for student {student_id}, type {problem_type_id}")

        return metric

    def _calculate_mastery_level(self, metric: PerformanceMetric) -> int:
        """
        Calculate mastery level (0-100) based on performance

        Factors:
        - Accuracy rate (40%)
        - Consistency (30%)
        - Speed (20%)
        - Independence (10% - fewer hints used)
        """
        if metric.total_attempts == 0:
            return 0

        # Accuracy component (0-40)
        accuracy_rate = (metric.correct_attempts / metric.total_attempts) * 100
        accuracy_component = min(40, accuracy_rate * 0.4)

        # Consistency component (0-30)
        # Based on recent performance vs overall
        consistency_component = 30 if accuracy_rate > 80 else accuracy_rate * 0.3

        # Speed component (0-20)
        # Compare to min time (faster = better mastery)
        if metric.min_solve_time_seconds and metric.avg_solve_time_seconds:
            speed_ratio = metric.min_solve_time_seconds / metric.avg_solve_time_seconds
            speed_component = min(20, speed_ratio * 20)
        else:
            speed_component = 10  # Default

        # Independence component (0-10)
        # Fewer hints = more independence
        avg_hints = metric.total_hints_used / metric.total_attempts
        independence_component = max(0, 10 - avg_hints * 2)

        mastery = int(accuracy_component + consistency_component + speed_component + independence_component)
        return min(100, max(0, mastery))

    async def _calculate_trend(
        self,
        student_id: str,
        problem_type_id: str,
        window_size: int = 10
    ) -> str:
        """
        Calculate performance trend: 'improving', 'stable', 'declining', or 'unknown'

        Compares recent performance to earlier performance
        """
        # Get recent attempts
        query = (
            select(StudentAttempt)
            .where(
                and_(
                    StudentAttempt.student_id == student_id,
                    StudentAttempt.problem_type_id == problem_type_id
                )
            )
            .order_by(StudentAttempt.submitted_at.desc())
            .limit(window_size * 2)
        )

        result = await self.db.execute(query)
        attempts = result.scalars().all()

        if len(attempts) < window_size:
            return 'unknown'

        # Split into recent and earlier
        recent = attempts[:window_size]
        earlier = attempts[window_size:window_size * 2]

        # Calculate accuracy for each group
        recent_accuracy = sum(1 for a in recent if a.is_correct) / len(recent) * 100
        earlier_accuracy = sum(1 for a in earlier if a.is_correct) / len(earlier) * 100 if earlier else recent_accuracy

        # Determine trend
        diff = recent_accuracy - earlier_accuracy

        if diff > 10:
            return 'improving'
        elif diff < -10:
            return 'declining'
        else:
            return 'stable'

    async def get_student_performance_summary(
        self,
        student_id: str
    ) -> Dict:
        """
        Get comprehensive performance summary for a student

        Returns:
            Dictionary with overall statistics and per-type breakdown
        """
        # Overall stats
        total_attempts_query = select(func.count(StudentAttempt.id)).where(
            StudentAttempt.student_id == student_id
        )
        total_result = await self.db.execute(total_attempts_query)
        total_attempts = total_result.scalar() or 0

        correct_attempts_query = select(func.count(StudentAttempt.id)).where(
            and_(
                StudentAttempt.student_id == student_id,
                StudentAttempt.is_correct == True
            )
        )
        correct_result = await self.db.execute(correct_attempts_query)
        correct_attempts = correct_result.scalar() or 0

        overall_accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 0

        # Per-type metrics
        metrics_query = select(PerformanceMetric).where(
            PerformanceMetric.student_id == student_id
        )
        metrics_result = await self.db.execute(metrics_query)
        metrics = metrics_result.scalars().all()

        # Get problem type details
        type_performance = []
        for metric in metrics:
            type_query = select(ProblemType).where(ProblemType.id == metric.problem_type_id)
            type_result = await self.db.execute(type_query)
            problem_type = type_result.scalar_one_or_none()

            if problem_type:
                type_performance.append({
                    "problem_type_id": str(metric.problem_type_id),
                    "problem_type_name": problem_type.name,
                    "category": problem_type.category,
                    "total_attempts": metric.total_attempts,
                    "correct_attempts": metric.correct_attempts,
                    "accuracy_rate": metric.accuracy_rate,
                    "mastery_level": metric.mastery_level,
                    "trend": metric.trend,
                    "avg_solve_time": metric.avg_solve_time_seconds
                })

        return {
            "student_id": student_id,
            "overall": {
                "total_attempts": total_attempts,
                "correct_attempts": correct_attempts,
                "accuracy_rate": round(overall_accuracy, 2)
            },
            "by_problem_type": type_performance,
            "strongest_types": sorted(
                type_performance,
                key=lambda x: x["mastery_level"],
                reverse=True
            )[:3],
            "weakest_types": sorted(
                type_performance,
                key=lambda x: x["mastery_level"]
            )[:3]
        }

    async def get_realtime_performance(
        self,
        student_id: str,
        minutes: int = 30
    ) -> Dict:
        """
        Get real-time performance data for recent activity

        Args:
            student_id: Student UUID
            minutes: Look back this many minutes

        Returns:
            Recent performance data
        """
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)

        query = (
            select(StudentAttempt)
            .where(
                and_(
                    StudentAttempt.student_id == student_id,
                    StudentAttempt.submitted_at >= cutoff
                )
            )
            .order_by(StudentAttempt.submitted_at.desc())
        )

        result = await self.db.execute(query)
        recent_attempts = result.scalars().all()

        if not recent_attempts:
            return {
                "student_id": student_id,
                "period_minutes": minutes,
                "activity": "No recent activity"
            }

        total = len(recent_attempts)
        correct = sum(1 for a in recent_attempts if a.is_correct)
        avg_time = sum(a.time_spent_seconds for a in recent_attempts) / total

        return {
            "student_id": student_id,
            "period_minutes": minutes,
            "activity": "Active",
            "recent_attempts": total,
            "recent_correct": correct,
            "recent_accuracy": round(correct / total * 100, 2),
            "avg_time_seconds": int(avg_time),
            "attempts": [
                {
                    "problem_id": str(a.problem_id),
                    "is_correct": a.is_correct,
                    "time_spent": a.time_spent_seconds,
                    "submitted_at": a.submitted_at.isoformat()
                }
                for a in recent_attempts[:10]  # Last 10 attempts
            ]
        }
