"""Recommendation engine for optimal learning time suggestions."""
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np

from ..models.focus_session import FocusSession
from ..models.time_recommendation import TimeRecommendation
from ..config import settings


class RecommendationEngine:
    """Engine for generating optimal time recommendations based on focus analysis."""

    # Day names for human-readable output
    DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    @staticmethod
    def analyze_time_patterns(user_id: int, db: Session, days: int = 30) -> Dict[str, Any]:
        """
        Analyze user's focus patterns by time of day and day of week.

        Args:
            user_id: User ID
            db: Database session
            days: Number of days to analyze

        Returns:
            Dictionary with time pattern analysis
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get sessions with focus scores
        sessions = db.query(FocusSession).filter(
            FocusSession.user_id == user_id,
            FocusSession.created_at >= cutoff_date,
            FocusSession.average_focus_score.isnot(None)
        ).all()

        if len(sessions) < settings.MIN_DATA_POINTS_FOR_RECOMMENDATION:
            return {
                "sufficient_data": False,
                "session_count": len(sessions),
                "required_sessions": settings.MIN_DATA_POINTS_FOR_RECOMMENDATION
            }

        # Group by hour of day
        hourly_scores = {}
        for hour in range(24):
            hour_sessions = [s for s in sessions if s.hour_of_day == hour]
            if hour_sessions:
                scores = [s.average_focus_score for s in hour_sessions]
                hourly_scores[hour] = {
                    "average_score": np.mean(scores),
                    "std_dev": np.std(scores),
                    "session_count": len(hour_sessions),
                    "max_score": max(scores),
                    "min_score": min(scores)
                }

        # Group by day of week
        daily_scores = {}
        for day in range(7):
            day_sessions = [s for s in sessions if s.day_of_week == day]
            if day_sessions:
                scores = [s.average_focus_score for s in day_sessions]
                daily_scores[day] = {
                    "day_name": RecommendationEngine.DAY_NAMES[day],
                    "average_score": np.mean(scores),
                    "std_dev": np.std(scores),
                    "session_count": len(day_sessions),
                    "max_score": max(scores),
                    "min_score": min(scores)
                }

        # Combined hour + day analysis
        time_slot_scores = {}
        for day in range(7):
            for hour in range(24):
                slot_sessions = [
                    s for s in sessions
                    if s.day_of_week == day and s.hour_of_day == hour
                ]
                if slot_sessions:
                    scores = [s.average_focus_score for s in slot_sessions]
                    key = f"{day}_{hour}"
                    time_slot_scores[key] = {
                        "day": day,
                        "hour": hour,
                        "average_score": np.mean(scores),
                        "session_count": len(slot_sessions)
                    }

        return {
            "sufficient_data": True,
            "session_count": len(sessions),
            "hourly_patterns": hourly_scores,
            "daily_patterns": daily_scores,
            "time_slot_patterns": time_slot_scores,
            "analysis_period_days": days
        }

    @staticmethod
    def calculate_confidence(session_count: int, score_std_dev: float) -> float:
        """
        Calculate confidence score for a recommendation.

        Args:
            session_count: Number of sessions in the time slot
            score_std_dev: Standard deviation of focus scores

        Returns:
            Confidence score (0-100)
        """
        # More sessions = higher confidence (up to 50 points)
        session_confidence = min(50, session_count * 5)

        # Lower std dev = higher confidence (up to 50 points)
        # Assume std dev of 20 or more is very uncertain
        consistency_confidence = max(0, 50 - (score_std_dev * 2.5))

        return min(100, session_confidence + consistency_confidence)

    @staticmethod
    def generate_recommendations(
        user_id: int,
        db: Session,
        top_n: int = 5,
        min_focus_score: float = None
    ) -> List[TimeRecommendation]:
        """
        Generate optimal time recommendations for a user.

        Args:
            user_id: User ID
            db: Database session
            top_n: Number of recommendations to generate
            min_focus_score: Minimum focus score to consider

        Returns:
            List of TimeRecommendation objects
        """
        if min_focus_score is None:
            min_focus_score = settings.FOCUS_SCORE_THRESHOLD

        # Analyze patterns
        patterns = RecommendationEngine.analyze_time_patterns(user_id, db)

        if not patterns.get("sufficient_data"):
            return []

        # Get time slot patterns and sort by average score
        time_slots = patterns["time_slot_patterns"]
        sorted_slots = sorted(
            time_slots.items(),
            key=lambda x: (x[1]["average_score"], x[1]["session_count"]),
            reverse=True
        )

        # Filter by minimum score and session count
        filtered_slots = [
            (key, data) for key, data in sorted_slots
            if data["average_score"] >= min_focus_score and data["session_count"] >= 2
        ]

        # Generate recommendations
        recommendations = []
        valid_until = datetime.utcnow() + timedelta(days=14)  # Valid for 2 weeks

        for i, (key, data) in enumerate(filtered_slots[:top_n]):
            # Calculate confidence based on session count and consistency
            # For simplicity, assume std dev from hourly patterns
            hour_data = patterns["hourly_patterns"].get(data["hour"], {})
            std_dev = hour_data.get("std_dev", 15)  # Default if not found
            confidence = RecommendationEngine.calculate_confidence(
                data["session_count"],
                std_dev
            )

            # Create recommendation
            recommendation = TimeRecommendation(
                user_id=user_id,
                recommended_day_of_week=data["day"],
                recommended_hour=data["hour"],
                recommended_duration_minutes=settings.OPTIMAL_SESSION_DURATION_MINUTES,
                confidence_score=confidence,
                average_focus_score=data["average_score"],
                sample_size=data["session_count"],
                analysis_data={
                    "rank": i + 1,
                    "day_name": RecommendationEngine.DAY_NAMES[data["day"]],
                    "hour_display": f"{data['hour']:02d}:00",
                    "patterns": patterns
                },
                generated_at=datetime.utcnow(),
                valid_until=valid_until,
                is_active=1
            )

            recommendations.append(recommendation)

        # Deactivate old recommendations
        db.query(TimeRecommendation).filter(
            TimeRecommendation.user_id == user_id,
            TimeRecommendation.is_active == 1
        ).update({"is_active": 0})

        # Save new recommendations
        for rec in recommendations:
            db.add(rec)

        db.commit()

        # Refresh to get IDs
        for rec in recommendations:
            db.refresh(rec)

        return recommendations

    @staticmethod
    def get_optimal_days(user_id: int, db: Session) -> List[str]:
        """
        Get list of optimal days for learning.

        Args:
            user_id: User ID
            db: Database session

        Returns:
            List of day names
        """
        patterns = RecommendationEngine.analyze_time_patterns(user_id, db)

        if not patterns.get("sufficient_data"):
            return []

        daily_patterns = patterns["daily_patterns"]
        sorted_days = sorted(
            daily_patterns.items(),
            key=lambda x: x[1]["average_score"],
            reverse=True
        )

        # Return top 3 days
        return [data["day_name"] for day, data in sorted_days[:3]]

    @staticmethod
    def get_optimal_hours(user_id: int, db: Session) -> List[int]:
        """
        Get list of optimal hours for learning.

        Args:
            user_id: User ID
            db: Database session

        Returns:
            List of hours (0-23)
        """
        patterns = RecommendationEngine.analyze_time_patterns(user_id, db)

        if not patterns.get("sufficient_data"):
            return []

        hourly_patterns = patterns["hourly_patterns"]
        sorted_hours = sorted(
            hourly_patterns.items(),
            key=lambda x: x[1]["average_score"],
            reverse=True
        )

        # Return top 4 hours
        return [int(hour) for hour, data in sorted_hours[:4]]

    @staticmethod
    def get_recommendation_summary(user_id: int, db: Session) -> Dict[str, Any]:
        """
        Get summary of recommendations for a user.

        Args:
            user_id: User ID
            db: Database session

        Returns:
            Dictionary with recommendation summary
        """
        # Get active recommendations
        recommendations = db.query(TimeRecommendation).filter(
            TimeRecommendation.user_id == user_id,
            TimeRecommendation.is_active == 1
        ).order_by(TimeRecommendation.confidence_score.desc()).all()

        if not recommendations:
            return {
                "user_id": user_id,
                "total_recommendations": 0,
                "has_recommendations": False
            }

        # Calculate statistics
        avg_confidence = np.mean([r.confidence_score for r in recommendations])
        optimal_days = RecommendationEngine.get_optimal_days(user_id, db)
        optimal_hours = RecommendationEngine.get_optimal_hours(user_id, db)

        return {
            "user_id": user_id,
            "total_recommendations": len(recommendations),
            "has_recommendations": True,
            "top_recommendations": recommendations[:5],
            "optimal_days": optimal_days,
            "optimal_hours": optimal_hours,
            "average_confidence": round(avg_confidence, 2)
        }
