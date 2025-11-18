"""Focus analysis service for calculating focus metrics."""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
import numpy as np

from ..models.focus_session import FocusSession
from ..models.focus_metrics import FocusMetrics


class FocusAnalyzer:
    """Service for analyzing focus patterns and calculating focus scores."""

    # Constants for focus scoring
    IDEAL_INTERACTION_INTERVAL = 10  # seconds
    MAX_IDLE_TIME = 60  # seconds before considering unfocused
    CONTEXT_SWITCH_PENALTY = 5  # points deducted per context switch

    @staticmethod
    def calculate_focus_score(
        active_time: int,
        idle_time: int,
        interaction_count: int,
        context_switches: int,
        total_duration: int
    ) -> float:
        """
        Calculate overall focus score for a session.

        Args:
            active_time: Time actively engaged (seconds)
            idle_time: Time idle (seconds)
            interaction_count: Number of interactions
            context_switches: Number of context switches
            total_duration: Total session duration (seconds)

        Returns:
            Focus score (0-100)
        """
        if total_duration == 0:
            return 0.0

        # Component 1: Activity ratio (40% weight)
        activity_ratio = (active_time / total_duration) * 40

        # Component 2: Interaction consistency (30% weight)
        if interaction_count > 0:
            avg_time_per_interaction = active_time / interaction_count
            # Ideal is around 10 seconds per interaction
            consistency_score = max(0, 30 - abs(avg_time_per_interaction - FocusAnalyzer.IDEAL_INTERACTION_INTERVAL))
        else:
            consistency_score = 0

        # Component 3: Idle penalty (20% weight)
        idle_ratio = idle_time / total_duration
        idle_score = max(0, 20 * (1 - idle_ratio))

        # Component 4: Context switch penalty (10% weight)
        max_acceptable_switches = total_duration / 300  # 1 switch per 5 minutes is acceptable
        switch_penalty = min(10, context_switches * FocusAnalyzer.CONTEXT_SWITCH_PENALTY)
        context_score = max(0, 10 - switch_penalty)

        # Calculate total score
        total_score = activity_ratio + consistency_score + idle_score + context_score
        return min(100.0, max(0.0, total_score))

    @staticmethod
    def calculate_engagement_score(metrics: List[FocusMetrics]) -> float:
        """
        Calculate engagement score based on detailed metrics.

        Args:
            metrics: List of focus metrics for a session

        Returns:
            Engagement score (0-100)
        """
        if not metrics:
            return 0.0

        # Analyze event types
        event_types = [m.event_type for m in metrics]
        unique_events = len(set(event_types))
        total_events = len(event_types)

        # Diversity of interactions (more diverse = more engaged)
        diversity_score = min(30, unique_events * 5)

        # Frequency of interactions
        if len(metrics) >= 2:
            time_span = (metrics[-1].recorded_at - metrics[0].recorded_at).total_seconds()
            if time_span > 0:
                frequency = (total_events / time_span) * 60  # events per minute
                frequency_score = min(40, frequency * 10)
            else:
                frequency_score = 0
        else:
            frequency_score = 0

        # Focus consistency (based on time between events)
        time_gaps = []
        for i in range(1, len(metrics)):
            gap = (metrics[i].recorded_at - metrics[i-1].recorded_at).total_seconds()
            time_gaps.append(gap)

        if time_gaps:
            # Lower standard deviation = more consistent = better engagement
            std_dev = np.std(time_gaps)
            consistency_score = max(0, 30 - (std_dev / 2))
        else:
            consistency_score = 0

        total_score = diversity_score + frequency_score + consistency_score
        return min(100.0, max(0.0, total_score))

    @staticmethod
    def analyze_session(session_id: int, db: Session) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of a focus session.

        Args:
            session_id: ID of the session to analyze
            db: Database session

        Returns:
            Dictionary with analysis results
        """
        session = db.query(FocusSession).filter(FocusSession.id == session_id).first()
        if not session:
            raise ValueError(f"Session {session_id} not found")

        # Get all metrics for this session
        metrics = db.query(FocusMetrics).filter(
            FocusMetrics.session_id == session_id
        ).order_by(FocusMetrics.recorded_at).all()

        # Calculate duration if not already calculated
        if session.session_end and not session.total_duration_seconds:
            session.calculate_duration()

        # Calculate scores
        focus_score = FocusAnalyzer.calculate_focus_score(
            active_time=session.active_time_seconds,
            idle_time=session.idle_time_seconds,
            interaction_count=session.interaction_count,
            context_switches=session.context_switches,
            total_duration=session.total_duration_seconds or 1
        )

        engagement_score = FocusAnalyzer.calculate_engagement_score(metrics)

        # Update session with calculated scores
        session.average_focus_score = focus_score
        session.engagement_score = engagement_score
        db.commit()

        return {
            "session_id": session_id,
            "focus_score": focus_score,
            "engagement_score": engagement_score,
            "total_duration": session.total_duration_seconds,
            "active_time": session.active_time_seconds,
            "idle_time": session.idle_time_seconds,
            "interaction_count": session.interaction_count,
            "context_switches": session.context_switches,
            "metrics_count": len(metrics)
        }

    @staticmethod
    def get_user_focus_trends(user_id: int, db: Session, days: int = 30) -> Dict[str, Any]:
        """
        Get focus trends for a user over a specified period.

        Args:
            user_id: User ID
            db: Database session
            days: Number of days to analyze

        Returns:
            Dictionary with trend data
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        sessions = db.query(FocusSession).filter(
            FocusSession.user_id == user_id,
            FocusSession.created_at >= cutoff_date
        ).all()

        if not sessions:
            return {
                "user_id": user_id,
                "total_sessions": 0,
                "average_focus_score": 0,
                "average_engagement_score": 0,
                "trend": "insufficient_data"
            }

        focus_scores = [s.average_focus_score for s in sessions if s.average_focus_score is not None]
        engagement_scores = [s.engagement_score for s in sessions if s.engagement_score is not None]

        # Calculate trend (improving, declining, stable)
        if len(focus_scores) >= 5:
            recent = np.mean(focus_scores[-5:])
            older = np.mean(focus_scores[:5])
            if recent > older + 10:
                trend = "improving"
            elif recent < older - 10:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "insufficient_data"

        return {
            "user_id": user_id,
            "total_sessions": len(sessions),
            "average_focus_score": np.mean(focus_scores) if focus_scores else 0,
            "average_engagement_score": np.mean(engagement_scores) if engagement_scores else 0,
            "max_focus_score": max(focus_scores) if focus_scores else 0,
            "min_focus_score": min(focus_scores) if focus_scores else 0,
            "trend": trend,
            "analysis_period_days": days
        }
