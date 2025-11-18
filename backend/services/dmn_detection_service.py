"""
DMN Detection Service
Analyzes student cognitive activity patterns to detect Default Mode Network activation
and cognitive fatigue levels
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from uuid import UUID
from dataclasses import dataclass
from collections import deque
import statistics
import math
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class ActivityEvent:
    """Represents a student activity event"""
    event_id: str
    student_id: UUID
    session_id: UUID
    event_type: str
    timestamp: datetime
    response_time_ms: Optional[int] = None
    is_correct: Optional[bool] = None
    idle_duration_seconds: Optional[int] = None
    content_position: Optional[float] = None
    interaction_quality: Optional[float] = None
    window_focus_status: Optional[bool] = None


@dataclass
class DMNScore:
    """DMN activation score with component breakdown"""
    dmn_score: float  # Composite score 0-1
    fatigue_level: str  # active, mild, moderate, high, critical
    components: Dict[str, float]  # Individual component scores
    recommendation_triggered: bool
    algorithm_version: str = "1.0"


@dataclass
class SessionContext:
    """Context information about the current learning session"""
    session_id: UUID
    student_id: UUID
    started_at: datetime
    duration_minutes: float
    total_interactions: int
    recent_activities: List[ActivityEvent]
    avg_response_time_ms: Optional[float] = None
    error_rate: Optional[float] = None
    idle_time_total_seconds: int = 0
    last_break: Optional[datetime] = None


# =============================================================================
# DMN Detection Algorithm Configuration
# =============================================================================

class DMNDetectionConfig:
    """Configuration for DMN detection algorithm"""

    # Component weights (must sum to 1.0)
    WEIGHT_INTERACTION_SLOWDOWN = 0.25
    WEIGHT_ERROR_RATE = 0.30
    WEIGHT_STUDY_DURATION = 0.20
    WEIGHT_ENGAGEMENT = 0.15
    WEIGHT_IDLE_TIME = 0.10

    # Thresholds for fatigue levels
    THRESHOLD_MILD = 0.40
    THRESHOLD_MODERATE = 0.65
    THRESHOLD_HIGH = 0.85

    # Time windows for analysis
    RECENT_ACTIVITY_WINDOW_MINUTES = 5
    BASELINE_WINDOW_MINUTES = 15

    # Behavioral thresholds
    OPTIMAL_RESPONSE_TIME_MS = 2000
    MAX_RESPONSE_TIME_MS = 10000
    IDLE_THRESHOLD_SECONDS = 30
    FOCUS_LOSS_PENALTY = 0.15

    # Study duration factors
    OPTIMAL_SESSION_DURATION_MINUTES = 25
    FATIGUE_ONSET_MINUTES = 40
    MAX_SESSION_DURATION_MINUTES = 90

    # Engagement metrics
    MIN_INTERACTIONS_PER_MINUTE = 2
    IDEAL_INTERACTIONS_PER_MINUTE = 6


# =============================================================================
# DMN Detection Service
# =============================================================================

class DMNDetectionService:
    """
    Service for detecting DMN activation and cognitive fatigue
    """

    def __init__(self, config: Optional[DMNDetectionConfig] = None):
        self.config = config or DMNDetectionConfig()
        self.activity_buffer: Dict[UUID, deque] = {}  # Buffer recent activities per session
        logger.info("DMN Detection Service initialized")

    def analyze_activity(
        self,
        activity: ActivityEvent,
        session_context: SessionContext,
        student_sensitivity: float = 1.0
    ) -> DMNScore:
        """
        Analyze a single activity event and calculate DMN score

        Args:
            activity: The activity event to analyze
            session_context: Current session context with historical data
            student_sensitivity: Personalized sensitivity multiplier (0.5-2.0)

        Returns:
            DMNScore object with composite score and components
        """
        logger.debug(f"Analyzing activity for session {session_context.session_id}")

        # Update activity buffer
        self._update_activity_buffer(activity, session_context.session_id)

        # Calculate component scores
        interaction_score = self._calculate_interaction_slowdown_score(
            activity, session_context
        )
        error_score = self._calculate_error_rate_score(session_context)
        duration_score = self._calculate_study_duration_score(session_context)
        engagement_score = self._calculate_engagement_score(session_context)
        idle_score = self._calculate_idle_time_score(session_context)

        # Calculate composite DMN score
        dmn_score = (
            self.config.WEIGHT_INTERACTION_SLOWDOWN * interaction_score +
            self.config.WEIGHT_ERROR_RATE * error_score +
            self.config.WEIGHT_STUDY_DURATION * duration_score +
            self.config.WEIGHT_ENGAGEMENT * engagement_score +
            self.config.WEIGHT_IDLE_TIME * idle_score
        )

        # Apply student sensitivity
        dmn_score = min(1.0, dmn_score * student_sensitivity)

        # Determine fatigue level
        fatigue_level = self._determine_fatigue_level(dmn_score)

        # Check if recommendation should be triggered
        recommendation_triggered = dmn_score >= self.config.THRESHOLD_MODERATE

        components = {
            "interaction_slowdown": round(interaction_score, 3),
            "error_rate": round(error_score, 3),
            "study_duration": round(duration_score, 3),
            "engagement": round(engagement_score, 3),
            "idle_time": round(idle_score, 3)
        }

        logger.info(
            f"DMN Score calculated: {dmn_score:.3f} "
            f"(fatigue: {fatigue_level}, recommend: {recommendation_triggered})"
        )

        return DMNScore(
            dmn_score=round(dmn_score, 3),
            fatigue_level=fatigue_level,
            components=components,
            recommendation_triggered=recommendation_triggered,
            algorithm_version=self.config.__class__.__name__
        )

    def _update_activity_buffer(self, activity: ActivityEvent, session_id: UUID):
        """Maintain a buffer of recent activities for pattern analysis"""
        if session_id not in self.activity_buffer:
            self.activity_buffer[session_id] = deque(maxlen=50)

        self.activity_buffer[session_id].append(activity)

    def _calculate_interaction_slowdown_score(
        self,
        activity: ActivityEvent,
        session_context: SessionContext
    ) -> float:
        """
        Calculate score based on interaction slowdown patterns

        Returns 0.0 (fast, responsive) to 1.0 (very slow, unresponsive)
        """
        if not session_context.recent_activities:
            return 0.0

        # Get recent response times
        recent_response_times = [
            a.response_time_ms for a in session_context.recent_activities[-10:]
            if a.response_time_ms is not None and a.response_time_ms > 0
        ]

        if not recent_response_times:
            return 0.0

        # Calculate average recent response time
        avg_recent_time = statistics.mean(recent_response_times)

        # Get baseline response times (earlier in session)
        baseline_activities = [
            a for a in session_context.recent_activities[:-10]
            if a.response_time_ms is not None and a.response_time_ms > 0
        ]

        if baseline_activities:
            baseline_time = statistics.mean([a.response_time_ms for a in baseline_activities])
            # Calculate slowdown ratio
            slowdown_ratio = avg_recent_time / baseline_time if baseline_time > 0 else 1.0
        else:
            # Compare to optimal response time
            slowdown_ratio = avg_recent_time / self.config.OPTIMAL_RESPONSE_TIME_MS

        # Normalize to 0-1 scale
        # 1.0 ratio = 0.0 score (no slowdown)
        # 2.0 ratio = 0.5 score (2x slower)
        # 3.0+ ratio = 1.0 score (very slow)
        score = min(1.0, max(0.0, (slowdown_ratio - 1.0) / 2.0))

        # Check for variance (inconsistent response times indicate distraction)
        if len(recent_response_times) >= 5:
            variance_penalty = min(0.2, statistics.stdev(recent_response_times) / 5000)
            score = min(1.0, score + variance_penalty)

        return score

    def _calculate_error_rate_score(self, session_context: SessionContext) -> float:
        """
        Calculate score based on recent error rate

        Returns 0.0 (high accuracy) to 1.0 (high error rate)
        """
        recent_activities = session_context.recent_activities[-20:]
        activities_with_correctness = [
            a for a in recent_activities
            if a.is_correct is not None
        ]

        if not activities_with_correctness:
            return 0.0

        # Calculate recent error rate
        errors = sum(1 for a in activities_with_correctness if not a.is_correct)
        recent_error_rate = errors / len(activities_with_correctness)

        # Compare to session average if available
        if session_context.error_rate is not None:
            # Increasing error rate indicates fatigue
            error_increase = recent_error_rate - session_context.error_rate
            score = min(1.0, max(0.0, recent_error_rate + (error_increase * 2)))
        else:
            score = recent_error_rate

        return score

    def _calculate_study_duration_score(self, session_context: SessionContext) -> float:
        """
        Calculate score based on study session duration

        Returns 0.0 (fresh) to 1.0 (fatigued from long duration)
        """
        duration = session_context.duration_minutes

        if duration <= self.config.OPTIMAL_SESSION_DURATION_MINUTES:
            # Optimal duration, low fatigue
            return 0.0

        elif duration <= self.config.FATIGUE_ONSET_MINUTES:
            # Gradual increase in fatigue
            return (duration - self.config.OPTIMAL_SESSION_DURATION_MINUTES) / \
                   (self.config.FATIGUE_ONSET_MINUTES - self.config.OPTIMAL_SESSION_DURATION_MINUTES) * 0.5

        elif duration <= self.config.MAX_SESSION_DURATION_MINUTES:
            # Significant fatigue
            progress = (duration - self.config.FATIGUE_ONSET_MINUTES) / \
                      (self.config.MAX_SESSION_DURATION_MINUTES - self.config.FATIGUE_ONSET_MINUTES)
            return 0.5 + (progress * 0.5)

        else:
            # Critical fatigue for very long sessions
            return 1.0

    def _calculate_engagement_score(self, session_context: SessionContext) -> float:
        """
        Calculate score based on engagement indicators

        Returns 0.0 (highly engaged) to 1.0 (disengaged)
        """
        if session_context.duration_minutes == 0:
            return 0.0

        # Calculate interaction rate
        interactions_per_minute = session_context.total_interactions / session_context.duration_minutes

        # Score based on interaction rate
        if interactions_per_minute >= self.config.IDEAL_INTERACTIONS_PER_MINUTE:
            interaction_score = 0.0
        elif interactions_per_minute >= self.config.MIN_INTERACTIONS_PER_MINUTE:
            interaction_score = 0.3
        else:
            interaction_score = 0.7

        # Check recent interaction quality
        recent_activities = session_context.recent_activities[-10:]
        if recent_activities:
            quality_scores = [
                a.interaction_quality for a in recent_activities
                if a.interaction_quality is not None
            ]

            if quality_scores:
                avg_quality = statistics.mean(quality_scores)
                quality_score = 1.0 - avg_quality  # Invert (low quality = high disengagement)
            else:
                quality_score = 0.0
        else:
            quality_score = 0.0

        # Check for focus loss patterns
        focus_loss_count = sum(
            1 for a in recent_activities
            if a.event_type == "focus_loss" or
               (a.window_focus_status is not None and not a.window_focus_status)
        )

        focus_loss_score = min(1.0, focus_loss_count * self.config.FOCUS_LOSS_PENALTY)

        # Combine scores
        engagement_score = (interaction_score * 0.4 + quality_score * 0.4 + focus_loss_score * 0.2)

        return min(1.0, engagement_score)

    def _calculate_idle_time_score(self, session_context: SessionContext) -> float:
        """
        Calculate score based on idle time patterns

        Returns 0.0 (active) to 1.0 (frequently idle)
        """
        if session_context.duration_minutes == 0:
            return 0.0

        # Calculate idle time ratio
        total_seconds = session_context.duration_minutes * 60
        idle_ratio = session_context.idle_time_total_seconds / total_seconds

        # Recent idle events
        recent_idle_events = [
            a for a in session_context.recent_activities[-10:]
            if a.event_type == "idle" and a.idle_duration_seconds is not None
        ]

        recent_idle_count = len(recent_idle_events)
        recent_idle_score = min(1.0, recent_idle_count * 0.15)

        # Combine overall idle ratio with recent idle frequency
        idle_score = (idle_ratio * 0.6 + recent_idle_score * 0.4)

        return min(1.0, idle_score)

    def _determine_fatigue_level(self, dmn_score: float) -> str:
        """Determine fatigue level from DMN score"""
        if dmn_score >= self.config.THRESHOLD_HIGH:
            return "high"
        elif dmn_score >= self.config.THRESHOLD_MODERATE:
            return "moderate"
        elif dmn_score >= self.config.THRESHOLD_MILD:
            return "mild"
        else:
            return "active"

    def predict_fatigue_trajectory(
        self,
        session_context: SessionContext
    ) -> Dict[str, any]:
        """
        Predict when the student is likely to reach fatigue threshold

        Returns prediction with estimated time to fatigue
        """
        if len(session_context.recent_activities) < 10:
            return {
                "prediction_available": False,
                "reason": "Insufficient data"
            }

        # Get DMN scores over time (would typically come from database)
        # For now, calculate based on recent activities

        # Simple linear projection
        # In production, use more sophisticated time-series analysis

        duration = session_context.duration_minutes

        # Estimate time to moderate fatigue threshold
        if duration >= self.config.OPTIMAL_SESSION_DURATION_MINUTES:
            estimated_time_to_fatigue = max(
                0,
                self.config.FATIGUE_ONSET_MINUTES - duration
            )
        else:
            estimated_time_to_fatigue = self.config.OPTIMAL_SESSION_DURATION_MINUTES - duration

        return {
            "prediction_available": True,
            "estimated_minutes_to_fatigue": round(estimated_time_to_fatigue, 1),
            "confidence": 0.7,  # Placeholder
            "suggested_break_in_minutes": max(5, round(estimated_time_to_fatigue * 0.8, 0))
        }


# =============================================================================
# Pattern Detection Utilities
# =============================================================================

class CognitivePatternDetector:
    """Detect specific cognitive state patterns from activity streams"""

    @staticmethod
    def detect_mind_wandering(activities: List[ActivityEvent]) -> bool:
        """
        Detect mind wandering patterns:
        - Rapid, unfocused clicking
        - Navigation without engagement
        - Repetitive actions without progress
        """
        if len(activities) < 5:
            return False

        recent = activities[-10:]

        # Check for rapid, low-quality interactions
        rapid_interactions = sum(
            1 for a in recent
            if a.interaction_quality is not None and
               a.interaction_quality < 0.3 and
               a.response_time_ms is not None and
               a.response_time_ms < 1000
        )

        return rapid_interactions >= 5

    @staticmethod
    def detect_frustration(activities: List[ActivityEvent]) -> bool:
        """
        Detect frustration patterns:
        - Repeated errors on similar tasks
        - Increased response time with errors
        - Rapid retries
        """
        if len(activities) < 5:
            return False

        recent = activities[-10:]
        error_activities = [a for a in recent if a.is_correct is not None]

        if len(error_activities) < 3:
            return False

        # High error rate
        error_rate = sum(1 for a in error_activities if not a.is_correct) / len(error_activities)

        # Rapid retries after errors
        rapid_retries = 0
        for i in range(1, len(recent)):
            if (recent[i].event_type == "submit" and
                recent[i-1].event_type == "submit" and
                (recent[i].timestamp - recent[i-1].timestamp).total_seconds() < 5):
                rapid_retries += 1

        return error_rate > 0.6 and rapid_retries >= 2

    @staticmethod
    def detect_zone_of_flow(activities: List[ActivityEvent]) -> bool:
        """
        Detect flow state:
        - Consistent interaction pace
        - High accuracy
        - Sustained focus
        """
        if len(activities) < 10:
            return False

        recent = activities[-15:]

        # Check response time consistency
        response_times = [
            a.response_time_ms for a in recent
            if a.response_time_ms is not None and a.response_time_ms > 0
        ]

        if len(response_times) < 5:
            return False

        # Low variance in response times
        cv = statistics.stdev(response_times) / statistics.mean(response_times)

        # High accuracy
        correct_activities = [a for a in recent if a.is_correct is not None]
        accuracy = sum(1 for a in correct_activities if a.is_correct) / len(correct_activities) if correct_activities else 0

        # No focus loss
        focus_losses = sum(1 for a in recent if a.event_type == "focus_loss")

        return cv < 0.5 and accuracy > 0.8 and focus_losses == 0


# =============================================================================
# Utility Functions
# =============================================================================

def calculate_time_of_day_factor(current_time: datetime) -> float:
    """
    Calculate fatigue factor based on time of day

    Returns multiplier (0.8-1.2):
    - Morning: 0.9 (lower fatigue)
    - Afternoon: 1.2 (higher fatigue, post-lunch dip)
    - Evening: 1.0 (moderate)
    """
    hour = current_time.hour

    if 6 <= hour < 12:  # Morning
        return 0.9
    elif 12 <= hour < 15:  # Early afternoon (post-lunch dip)
        return 1.2
    elif 15 <= hour < 18:  # Late afternoon
        return 1.1
    elif 18 <= hour < 22:  # Evening
        return 1.0
    else:  # Late night
        return 1.3


def calculate_break_effectiveness(
    dmn_score_before: float,
    dmn_score_after: float,
    break_duration_minutes: int
) -> float:
    """
    Calculate how effective a break was in reducing fatigue

    Returns effectiveness score 0.0-1.0
    """
    dmn_reduction = dmn_score_before - dmn_score_after

    if dmn_reduction <= 0:
        return 0.0

    # Ideal reduction is proportional to break duration
    ideal_reduction = min(0.5, break_duration_minutes * 0.05)

    effectiveness = min(1.0, dmn_reduction / ideal_reduction)

    return effectiveness


if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.DEBUG)

    service = DMNDetectionService()

    # Simulate activity
    activity = ActivityEvent(
        event_id="evt_123",
        student_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
        session_id=UUID("660e8400-e29b-41d4-a716-446655440001"),
        event_type="submit",
        timestamp=datetime.utcnow(),
        response_time_ms=3500,
        is_correct=False
    )

    session = SessionContext(
        session_id=UUID("660e8400-e29b-41d4-a716-446655440001"),
        student_id=UUID("550e8400-e29b-41d4-a716-446655440000"),
        started_at=datetime.utcnow() - timedelta(minutes=35),
        duration_minutes=35.0,
        total_interactions=45,
        recent_activities=[activity],
        error_rate=0.25
    )

    dmn_score = service.analyze_activity(activity, session)
    print(f"DMN Score: {dmn_score.dmn_score}")
    print(f"Fatigue Level: {dmn_score.fatigue_level}")
    print(f"Components: {dmn_score.components}")
    print(f"Recommend Break: {dmn_score.recommendation_triggered}")
