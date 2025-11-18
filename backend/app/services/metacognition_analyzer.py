"""
Metacognition analysis service
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from ..models import Student, LearningActivity, ProblemAttempt, GrowthInsight
from ..schemas import GrowthInsightResponse, DailyGrowthReport
from .claude_service import ClaudeService
import uuid


class MetacognitionAnalyzer:
    """
    Service for analyzing metacognitive learning patterns
    """

    def __init__(self, db: Session):
        self.db = db
        self.claude_service = ClaudeService()

    async def generate_daily_insights(
        self,
        student_id: str,
        target_date: Optional[datetime] = None
    ) -> DailyGrowthReport:
        """
        Generate daily metacognitive growth insights for a student

        Args:
            student_id: Student ID
            target_date: Date to analyze (defaults to today)

        Returns:
            Daily growth report with insights
        """
        if target_date is None:
            target_date = datetime.utcnow()

        # Get student data
        student = self.db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student {student_id} not found")

        # Get recent activity history
        activity_history = self._get_activity_history(student_id, days=7)

        # Get today's activities
        today_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        today_activities = self.db.query(LearningActivity).filter(
            LearningActivity.student_id == student_id,
            LearningActivity.session_start >= today_start,
            LearningActivity.session_start < today_end
        ).all()

        # Prepare data for Claude analysis
        student_data = {
            "name": student.name,
            "grade_level": student.grade_level,
            "student_id": student_id
        }

        # Analyze with Claude
        analysis_result = await self.claude_service.analyze_learning_pattern(
            student_data,
            activity_history
        )

        # Save insights to database
        insights = []
        for insight_data in analysis_result.get("insights", []):
            insight = self._create_growth_insight(
                student_id,
                target_date,
                insight_data
            )
            insights.append(insight)

        # Calculate overall improvement
        overall_improvement = self._calculate_overall_improvement(activity_history)

        # Build daily report
        report = DailyGrowthReport(
            student_id=student_id,
            report_date=target_date,
            insights=[GrowthInsightResponse.from_orm(i) for i in insights],
            summary=analysis_result.get("summary", ""),
            overall_improvement=overall_improvement,
            key_achievements=analysis_result.get("key_achievements", []),
            recommendations=analysis_result.get("recommendations", [])
        )

        return report

    def _get_activity_history(self, student_id: str, days: int = 7) -> List[Dict[str, Any]]:
        """
        Get formatted activity history for a student

        Args:
            student_id: Student ID
            days: Number of days to look back

        Returns:
            List of activity dictionaries
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        activities = self.db.query(LearningActivity).filter(
            LearningActivity.student_id == student_id,
            LearningActivity.session_start >= cutoff_date
        ).order_by(LearningActivity.session_start.desc()).all()

        history = []
        for activity in activities:
            # Get problem attempts for this activity
            attempts = self.db.query(ProblemAttempt).filter(
                ProblemAttempt.activity_id == activity.id
            ).all()

            activity_data = {
                "date": activity.session_start.isoformat(),
                "topic": activity.topic,
                "duration_minutes": activity.duration_minutes,
                "total_problems": activity.total_problems,
                "correct_answers": activity.correct_answers,
                "incorrect_answers": activity.incorrect_answers,
                "accuracy": (activity.correct_answers / activity.total_problems * 100)
                if activity.total_problems > 0 else 0,
                "hints_used": activity.hints_used,
                "self_confidence_before": activity.self_confidence_before,
                "self_confidence_after": activity.self_confidence_after,
                "problem_attempts": [
                    {
                        "problem_id": attempt.problem_id,
                        "difficulty": attempt.difficulty_level,
                        "time_spent": attempt.time_spent_seconds,
                        "is_correct": attempt.is_correct,
                        "hints_requested": attempt.hints_requested,
                        "attempt_number": attempt.attempt_number,
                        "gave_up": attempt.gave_up
                    }
                    for attempt in attempts
                ]
            }
            history.append(activity_data)

        return history

    def _create_growth_insight(
        self,
        student_id: str,
        insight_date: datetime,
        insight_data: Dict[str, Any]
    ) -> GrowthInsight:
        """
        Create and save a growth insight to the database

        Args:
            student_id: Student ID
            insight_date: Date of the insight
            insight_data: Insight data from Claude

        Returns:
            Created GrowthInsight object
        """
        insight = GrowthInsight(
            id=str(uuid.uuid4()),
            student_id=student_id,
            insight_date=insight_date,
            period_type="daily",
            dimension=insight_data.get("dimension", "unknown"),
            title=insight_data.get("title", ""),
            description=insight_data.get("description", ""),
            recommendation=insight_data.get("recommendation"),
            improvement_percentage=insight_data.get("improvement_percentage"),
            confidence_score=insight_data.get("confidence_score"),
            evidence_data=insight_data.get("evidence_data"),
            ai_model=self.claude_service.model,
            ai_prompt_version="1.0"
        )

        self.db.add(insight)
        self.db.commit()
        self.db.refresh(insight)

        return insight

    def _calculate_overall_improvement(self, activity_history: List[Dict[str, Any]]) -> float:
        """
        Calculate overall improvement percentage

        Args:
            activity_history: List of activity data

        Returns:
            Overall improvement percentage
        """
        if len(activity_history) < 2:
            return 0.0

        # Compare recent activities to older ones
        recent = activity_history[:len(activity_history)//2]
        older = activity_history[len(activity_history)//2:]

        recent_avg_accuracy = sum(a.get("accuracy", 0) for a in recent) / len(recent) if recent else 0
        older_avg_accuracy = sum(a.get("accuracy", 0) for a in older) / len(older) if older else 0

        if older_avg_accuracy == 0:
            return 0.0

        improvement = ((recent_avg_accuracy - older_avg_accuracy) / older_avg_accuracy) * 100
        return round(improvement, 2)

    def get_student_insights(
        self,
        student_id: str,
        days: int = 7
    ) -> List[GrowthInsightResponse]:
        """
        Get recent growth insights for a student

        Args:
            student_id: Student ID
            days: Number of days to look back

        Returns:
            List of growth insights
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        insights = self.db.query(GrowthInsight).filter(
            GrowthInsight.student_id == student_id,
            GrowthInsight.insight_date >= cutoff_date
        ).order_by(GrowthInsight.insight_date.desc()).all()

        return [GrowthInsightResponse.from_orm(i) for i in insights]
