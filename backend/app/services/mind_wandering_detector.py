"""
Mind Wandering Detection Service
Analyzes behavior patterns to detect when students lose focus
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc
import logging

from app.models.behavior import BehaviorEvent, MindWanderingEvent, LearningSession
from app.core.config import settings

logger = logging.getLogger(__name__)


class MindWanderingDetector:
    """Detects mind wandering from behavior patterns"""

    def __init__(self, db: Session):
        self.db = db
        self.inactivity_threshold = settings.INACTIVITY_THRESHOLD_SECONDS
        self.mouse_stillness_threshold = settings.MOUSE_STILLNESS_THRESHOLD_SECONDS
        self.confidence_threshold = settings.MIND_WANDERING_CONFIDENCE_THRESHOLD

    def analyze_recent_behavior(
        self,
        student_id: str,
        session_id: str,
        lookback_seconds: int = 60
    ) -> Optional[Dict[str, Any]]:
        """
        Analyze recent behavior to detect mind wandering

        Args:
            student_id: UUID of the student
            session_id: UUID of the learning session
            lookback_seconds: How far back to analyze (default 60 seconds)

        Returns:
            Detection result dict if mind wandering detected, None otherwise
        """
        cutoff_time = datetime.utcnow() - timedelta(seconds=lookback_seconds)

        # Fetch recent events
        recent_events = self.db.query(BehaviorEvent).filter(
            BehaviorEvent.student_id == student_id,
            BehaviorEvent.session_id == session_id,
            BehaviorEvent.timestamp >= cutoff_time
        ).order_by(BehaviorEvent.timestamp.asc()).all()

        if not recent_events:
            logger.debug(f"No recent events for student {student_id}")
            return None

        # Calculate detection factors
        factors = self._calculate_factors(recent_events)

        # Calculate confidence score
        confidence = self._calculate_confidence(factors)

        logger.info(
            f"Mind wandering analysis for student {student_id}: "
            f"confidence={confidence:.2f}, factors={factors}"
        )

        if confidence >= self.confidence_threshold:
            return {
                "detected": True,
                "confidence": confidence,
                "factors": factors,
                "duration": factors.get("inactivity_duration", 0),
                "timestamp": datetime.utcnow()
            }

        return None

    def _calculate_factors(self, events: List[BehaviorEvent]) -> Dict[str, Any]:
        """Calculate various factors that contribute to mind wandering detection"""
        factors = {
            "inactivity_duration": 0,
            "focus_losses": 0,
            "mouse_stillness_duration": 0,
            "rapid_clicks": 0,
            "event_count": len(events),
        }

        if not events:
            return factors

        # Check for focus losses (blur events)
        focus_losses = sum(1 for e in events if e.event_type == "blur")
        factors["focus_losses"] = focus_losses

        # Check for long gaps between events (inactivity)
        max_gap = 0
        for i in range(1, len(events)):
            gap = (events[i].timestamp - events[i-1].timestamp).total_seconds()
            max_gap = max(max_gap, gap)
        factors["inactivity_duration"] = max_gap

        # Check for mouse stillness (same position for extended period)
        mouse_positions = [(e.mouse_x, e.mouse_y) for e in events if e.mouse_x is not None]
        if len(mouse_positions) > 1:
            stillness_duration = self._calculate_mouse_stillness(events, mouse_positions)
            factors["mouse_stillness_duration"] = stillness_duration

        # Check for rapid, random clicking (sign of frustration/disengagement)
        click_events = [e for e in events if e.event_type == "click"]
        if len(click_events) > settings.RAPID_CLICK_THRESHOLD:
            # Calculate click rate
            time_span = (events[-1].timestamp - events[0].timestamp).total_seconds()
            if time_span > 0:
                click_rate = len(click_events) / time_span
                if click_rate > 0.5:  # More than 1 click per 2 seconds
                    factors["rapid_clicks"] = len(click_events)

        return factors

    def _calculate_mouse_stillness(
        self,
        events: List[BehaviorEvent],
        positions: List[tuple]
    ) -> float:
        """Calculate how long the mouse stayed still"""
        if len(positions) < 2:
            return 0

        stillness_threshold_pixels = 50  # Movement less than 50px is considered "still"
        current_stillness = 0
        max_stillness = 0
        last_timestamp = events[0].timestamp

        for i, event in enumerate(events[1:], 1):
            if event.mouse_x is None or event.mouse_y is None:
                continue

            prev_event = events[i-1]
            if prev_event.mouse_x is None or prev_event.mouse_y is None:
                continue

            # Calculate distance moved
            dx = event.mouse_x - prev_event.mouse_x
            dy = event.mouse_y - prev_event.mouse_y
            distance = (dx**2 + dy**2) ** 0.5

            time_diff = (event.timestamp - prev_event.timestamp).total_seconds()

            if distance < stillness_threshold_pixels:
                current_stillness += time_diff
                max_stillness = max(max_stillness, current_stillness)
            else:
                current_stillness = 0

        return max_stillness

    def _calculate_confidence(self, factors: Dict[str, Any]) -> float:
        """
        Calculate confidence score for mind wandering detection

        Weights different factors to produce a 0-1 confidence score
        """
        score = 0.0

        # Inactivity factor (normalized)
        if factors["inactivity_duration"] > 0:
            inactivity_score = min(
                factors["inactivity_duration"] / self.inactivity_threshold,
                1.0
            )
            score += inactivity_score * settings.INACTIVITY_WEIGHT

        # Focus loss factor
        if factors["focus_losses"] > 0:
            focus_loss_score = min(factors["focus_losses"] / 3.0, 1.0)
            score += focus_loss_score * settings.FOCUS_LOSS_WEIGHT

        # Mouse stillness factor
        if factors["mouse_stillness_duration"] > 0:
            stillness_score = min(
                factors["mouse_stillness_duration"] / self.mouse_stillness_threshold,
                1.0
            )
            score += stillness_score * settings.MOUSE_STILLNESS_WEIGHT

        # Rapid click factor (sign of frustration)
        if factors["rapid_clicks"] > 0:
            rapid_click_score = min(
                factors["rapid_clicks"] / (settings.RAPID_CLICK_THRESHOLD * 2),
                1.0
            )
            score += rapid_click_score * settings.RAPID_CLICK_WEIGHT

        # Normalize to 0-1 range
        total_weight = (
            settings.INACTIVITY_WEIGHT +
            settings.FOCUS_LOSS_WEIGHT +
            settings.MOUSE_STILLNESS_WEIGHT +
            settings.RAPID_CLICK_WEIGHT
        )
        normalized_score = score / total_weight

        return min(normalized_score, 1.0)

    def record_detection(
        self,
        student_id: str,
        module_id: str,
        session_id: str,
        detection_result: Dict[str, Any],
        problem_id: Optional[str] = None
    ) -> MindWanderingEvent:
        """Record a mind wandering detection event"""
        event = MindWanderingEvent(
            student_id=student_id,
            module_id=module_id,
            session_id=session_id,
            detected_at=detection_result["timestamp"],
            duration_seconds=detection_result["duration"],
            confidence_score=detection_result["confidence"],
            behavior_pattern=detection_result["factors"],
            contributing_factors=list(detection_result["factors"].keys()),
            problem_id=problem_id
        )

        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        logger.info(f"Recorded mind wandering event: {event.id}")

        # Update session statistics
        self._update_session_stats(session_id)

        return event

    def _update_session_stats(self, session_id: str):
        """Update learning session statistics"""
        session = self.db.query(LearningSession).filter(
            LearningSession.id == session_id
        ).first()

        if not session:
            return

        # Count mind wandering events in this session
        mw_count = self.db.query(MindWanderingEvent).filter(
            MindWanderingEvent.session_id == session_id
        ).count()

        # Sum total duration
        mw_events = self.db.query(MindWanderingEvent).filter(
            MindWanderingEvent.session_id == session_id
        ).all()

        total_mw_duration = sum(e.duration_seconds for e in mw_events if e.duration_seconds)

        session.mind_wandering_count = mw_count
        session.total_mind_wandering_duration = total_mw_duration

        # Calculate engagement score (0-100)
        if session.duration_seconds and session.duration_seconds > 0:
            active_ratio = 1 - (total_mw_duration / session.duration_seconds)
            session.engagement_score = max(0, min(100, active_ratio * 100))

        self.db.commit()

    def get_student_wandering_history(
        self,
        student_id: str,
        module_id: Optional[str] = None,
        limit: int = 20
    ) -> List[MindWanderingEvent]:
        """Get mind wandering history for a student"""
        query = self.db.query(MindWanderingEvent).filter(
            MindWanderingEvent.student_id == student_id
        )

        if module_id:
            query = query.filter(MindWanderingEvent.module_id == module_id)

        events = query.order_by(
            desc(MindWanderingEvent.detected_at)
        ).limit(limit).all()

        return events
