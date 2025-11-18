"""
Fatigue Detection Calculator

Multi-factor analysis system for detecting student learning fatigue.
Analyzes 7 key metrics with weighted scoring to produce fatigue level.
"""

import logging
from datetime import datetime, time
from typing import Dict, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


class FatigueLevel(Enum):
    """Fatigue level classification."""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class CognitiveDomain(Enum):
    """Cognitive domain classification (Bloom's Taxonomy)."""
    REMEMBER = "remember"  # Lowest cognitive load
    UNDERSTAND = "understand"
    APPLY = "apply"
    ANALYZE = "analyze"
    EVALUATE = "evaluate"
    CREATE = "create"  # Highest cognitive load


@dataclass
class FatigueMetrics:
    """Input metrics for fatigue calculation."""
    session_duration_minutes: int
    interaction_count_last_5min: int
    error_rate_last_10min: float  # Percentage (0-100)
    avg_response_time_seconds: int
    minutes_since_last_break: int
    content_difficulty: CognitiveDomain
    time_of_day: time

    # Optional advanced metrics
    mouse_movement_velocity: Optional[float] = None  # Pixels per second
    keyboard_typing_speed: Optional[int] = None  # WPM

    # Baseline comparison (if available)
    baseline_error_rate: Optional[float] = None
    baseline_response_time: Optional[int] = None
    baseline_interaction_rate: Optional[float] = None


@dataclass
class FatigueScore:
    """Fatigue calculation result."""
    timestamp: datetime

    # Component scores (0-100)
    session_duration_score: int
    interaction_frequency_score: int
    error_rate_score: int
    response_time_score: int
    break_pattern_score: int
    content_difficulty_score: int
    time_of_day_score: int

    # Composite score (weighted average, 0-100)
    fatigue_score: int
    fatigue_level: FatigueLevel

    # Deviation from personal baseline (if available)
    deviation_from_baseline: Optional[float] = None

    # Recommendations
    recommended_action: str = ""
    urgency: str = "low"  # low, medium, high, critical


class FatigueCalculator:
    """
    Calculates student fatigue score using multi-factor analysis.

    Weights for each factor:
    - Session Duration: 20%
    - Interaction Frequency: 15%
    - Error Rate Trend: 25%
    - Response Time: 15%
    - Break Patterns: 10%
    - Content Difficulty: 10%
    - Time of Day: 5%
    """

    # Component weights (must sum to 1.0)
    WEIGHTS = {
        'session_duration': 0.20,
        'interaction_frequency': 0.15,
        'error_rate': 0.25,
        'response_time': 0.15,
        'break_pattern': 0.10,
        'content_difficulty': 0.10,
        'time_of_day': 0.05
    }

    # Thresholds for fatigue levels
    FATIGUE_THRESHOLDS = {
        'low': (0, 30),
        'moderate': (31, 60),
        'high': (61, 80),
        'critical': (81, 100)
    }

    # Cognitive difficulty weights (Bloom's Taxonomy)
    DIFFICULTY_WEIGHTS = {
        CognitiveDomain.REMEMBER: 0.3,
        CognitiveDomain.UNDERSTAND: 0.4,
        CognitiveDomain.APPLY: 0.6,
        CognitiveDomain.ANALYZE: 0.8,
        CognitiveDomain.EVALUATE: 0.9,
        CognitiveDomain.CREATE: 1.0
    }

    # Circadian rhythm fatigue multipliers by hour
    TIME_OF_DAY_MULTIPLIERS = {
        # Morning (6-12): Low fatigue
        6: 0.3, 7: 0.2, 8: 0.2, 9: 0.3, 10: 0.4, 11: 0.5, 12: 0.6,
        # Afternoon (13-17): High fatigue (post-lunch dip)
        13: 0.8, 14: 1.0, 15: 0.9, 16: 0.7, 17: 0.6,
        # Evening (18-23): Increasing fatigue
        18: 0.7, 19: 0.8, 20: 0.9, 21: 1.0, 22: 1.0, 23: 1.0,
        # Late night/early morning (0-5): Critical fatigue
        0: 1.0, 1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 0.9
    }

    def __init__(self, use_baseline: bool = True):
        """
        Initialize FatigueCalculator.

        Args:
            use_baseline: Whether to incorporate personal baseline comparison
        """
        self.use_baseline = use_baseline

    def calculate_fatigue(self, metrics: FatigueMetrics) -> FatigueScore:
        """
        Calculate comprehensive fatigue score.

        Args:
            metrics: Input metrics for fatigue calculation

        Returns:
            FatigueScore with detailed breakdown
        """
        # Calculate individual component scores
        duration_score = self._calculate_session_duration_score(
            metrics.session_duration_minutes
        )

        interaction_score = self._calculate_interaction_frequency_score(
            metrics.interaction_count_last_5min,
            metrics.baseline_interaction_rate
        )

        error_score = self._calculate_error_rate_score(
            metrics.error_rate_last_10min,
            metrics.baseline_error_rate
        )

        response_score = self._calculate_response_time_score(
            metrics.avg_response_time_seconds,
            metrics.baseline_response_time
        )

        break_score = self._calculate_break_pattern_score(
            metrics.minutes_since_last_break
        )

        difficulty_score = self._calculate_content_difficulty_score(
            metrics.content_difficulty
        )

        time_score = self._calculate_time_of_day_score(
            metrics.time_of_day
        )

        # Calculate weighted composite score
        composite_score = (
            duration_score * self.WEIGHTS['session_duration'] +
            interaction_score * self.WEIGHTS['interaction_frequency'] +
            error_score * self.WEIGHTS['error_rate'] +
            response_score * self.WEIGHTS['response_time'] +
            break_score * self.WEIGHTS['break_pattern'] +
            difficulty_score * self.WEIGHTS['content_difficulty'] +
            time_score * self.WEIGHTS['time_of_day']
        )

        # Clamp to 0-100 range
        composite_score = max(0, min(100, int(composite_score)))

        # Determine fatigue level
        fatigue_level = self._classify_fatigue_level(composite_score)

        # Calculate baseline deviation if available
        baseline_deviation = self._calculate_baseline_deviation(
            metrics, composite_score
        )

        # Generate recommendations
        action, urgency = self._generate_recommendations(
            composite_score, fatigue_level
        )

        result = FatigueScore(
            timestamp=datetime.utcnow(),
            session_duration_score=duration_score,
            interaction_frequency_score=interaction_score,
            error_rate_score=error_score,
            response_time_score=response_score,
            break_pattern_score=break_score,
            content_difficulty_score=difficulty_score,
            time_of_day_score=time_score,
            fatigue_score=composite_score,
            fatigue_level=fatigue_level,
            deviation_from_baseline=baseline_deviation,
            recommended_action=action,
            urgency=urgency
        )

        logger.info(
            f"Calculated fatigue: {composite_score}/100 ({fatigue_level.value}) - "
            f"Action: {action}"
        )

        return result

    def _calculate_session_duration_score(self, duration_minutes: int) -> int:
        """
        Calculate score based on continuous session duration.

        Scoring logic:
        - 0-30 min: Low fatigue (0-20 points)
        - 30-60 min: Moderate fatigue (20-50 points)
        - 60-90 min: High fatigue (50-80 points)
        - 90+ min: Critical fatigue (80-100 points)
        """
        if duration_minutes < 30:
            # Linear from 0 to 20
            return int(duration_minutes / 30 * 20)
        elif duration_minutes < 60:
            # Linear from 20 to 50
            return int(20 + (duration_minutes - 30) / 30 * 30)
        elif duration_minutes < 90:
            # Linear from 50 to 80
            return int(50 + (duration_minutes - 60) / 30 * 30)
        else:
            # Linear from 80 to 100, capped at 100
            return min(100, int(80 + (duration_minutes - 90) / 30 * 20))

    def _calculate_interaction_frequency_score(
        self,
        interactions_last_5min: int,
        baseline: Optional[float] = None
    ) -> int:
        """
        Calculate score based on interaction frequency.

        Lower interaction rate suggests declining engagement and fatigue.
        Expected baseline: 15 interactions per 5 minutes (3 per minute)
        """
        if baseline is None:
            baseline = 15.0  # Default expected interaction rate

        # Calculate percentage of baseline
        if baseline > 0:
            percentage = (interactions_last_5min / baseline) * 100
        else:
            percentage = 100

        # Inverse scoring: lower interaction = higher fatigue
        if percentage >= 80:
            # Good engagement: 0-20 points
            return int(20 - (percentage - 80) / 20 * 20)
        elif percentage >= 60:
            # Moderate engagement: 20-40 points
            return int(20 + (80 - percentage) / 20 * 20)
        elif percentage >= 40:
            # Low engagement: 40-70 points
            return int(40 + (60 - percentage) / 20 * 30)
        else:
            # Very low engagement: 70-100 points
            return int(70 + (40 - percentage) / 40 * 30)

    def _calculate_error_rate_score(
        self,
        error_rate: float,
        baseline: Optional[float] = None
    ) -> int:
        """
        Calculate score based on recent error rate.

        Higher error rate strongly indicates cognitive fatigue.
        This has the highest weight (25%).
        """
        if baseline is not None and baseline > 0:
            # Calculate increase from baseline
            increase_ratio = error_rate / baseline

            if increase_ratio < 1.1:
                # Less than 10% increase: Normal (0-15 points)
                return int((increase_ratio - 1.0) / 0.1 * 15)
            elif increase_ratio < 1.3:
                # 10-30% increase: Concerning (15-40 points)
                return int(15 + (increase_ratio - 1.1) / 0.2 * 25)
            elif increase_ratio < 1.5:
                # 30-50% increase: High fatigue (40-70 points)
                return int(40 + (increase_ratio - 1.3) / 0.2 * 30)
            else:
                # 50%+ increase: Critical (70-100 points)
                return min(100, int(70 + (increase_ratio - 1.5) / 0.5 * 30))
        else:
            # No baseline: use absolute error rate
            if error_rate < 10:
                return int(error_rate / 10 * 20)
            elif error_rate < 25:
                return int(20 + (error_rate - 10) / 15 * 30)
            elif error_rate < 40:
                return int(50 + (error_rate - 25) / 15 * 30)
            else:
                return min(100, int(80 + (error_rate - 40) / 30 * 20))

    def _calculate_response_time_score(
        self,
        response_time_seconds: int,
        baseline: Optional[int] = None
    ) -> int:
        """
        Calculate score based on average response time.

        Slower responses indicate mental fatigue or lack of focus.
        """
        if baseline is not None and baseline > 0:
            # Calculate ratio to baseline
            ratio = response_time_seconds / baseline

            if ratio < 1.2:
                # Within 20% of baseline: Normal (0-20 points)
                return int((ratio - 1.0) / 0.2 * 20)
            elif ratio < 1.5:
                # 20-50% slower: Moderate fatigue (20-50 points)
                return int(20 + (ratio - 1.2) / 0.3 * 30)
            elif ratio < 2.0:
                # 50-100% slower: High fatigue (50-80 points)
                return int(50 + (ratio - 1.5) / 0.5 * 30)
            else:
                # 100%+ slower: Critical (80-100 points)
                return min(100, int(80 + (ratio - 2.0) / 1.0 * 20))
        else:
            # No baseline: use absolute values
            # Typical response time: 10-30 seconds
            if response_time_seconds < 30:
                return 0
            elif response_time_seconds < 60:
                return int((response_time_seconds - 30) / 30 * 40)
            elif response_time_seconds < 120:
                return int(40 + (response_time_seconds - 60) / 60 * 40)
            else:
                return min(100, int(80 + (response_time_seconds - 120) / 120 * 20))

    def _calculate_break_pattern_score(
        self,
        minutes_since_last_break: int
    ) -> int:
        """
        Calculate score based on time since last break.

        Recommended break frequency: every 45-60 minutes.
        """
        if minutes_since_last_break < 30:
            # Recent break: 0 points
            return 0
        elif minutes_since_last_break < 45:
            # Approaching break time: 0-30 points
            return int((minutes_since_last_break - 30) / 15 * 30)
        elif minutes_since_last_break < 60:
            # Break recommended: 30-60 points
            return int(30 + (minutes_since_last_break - 45) / 15 * 30)
        elif minutes_since_last_break < 90:
            # Break overdue: 60-85 points
            return int(60 + (minutes_since_last_break - 60) / 30 * 25)
        else:
            # Break critical: 85-100 points
            return min(100, int(85 + (minutes_since_last_break - 90) / 60 * 15))

    def _calculate_content_difficulty_score(
        self,
        difficulty: CognitiveDomain
    ) -> int:
        """
        Calculate score based on content difficulty (Bloom's Taxonomy).

        Higher-order thinking (analyze, evaluate, create) causes more fatigue.
        """
        difficulty_weight = self.DIFFICULTY_WEIGHTS[difficulty]

        # Convert weight (0.0-1.0) to score (0-100)
        # Higher difficulty = higher fatigue potential
        return int(difficulty_weight * 100)

    def _calculate_time_of_day_score(self, time_of_day: time) -> int:
        """
        Calculate score based on circadian rhythm.

        Natural fatigue patterns:
        - Morning (6-12): Low fatigue
        - Early afternoon (13-15): High fatigue (post-lunch dip)
        - Late afternoon (16-18): Moderate fatigue
        - Evening (19-23): Increasing fatigue
        - Night (0-5): Critical fatigue
        """
        hour = time_of_day.hour
        multiplier = self.TIME_OF_DAY_MULTIPLIERS.get(hour, 0.5)

        # Convert multiplier to score
        return int(multiplier * 100)

    def _classify_fatigue_level(self, score: int) -> FatigueLevel:
        """Classify fatigue level based on score."""
        for level, (min_score, max_score) in self.FATIGUE_THRESHOLDS.items():
            if min_score <= score <= max_score:
                return FatigueLevel(level)

        # Fallback
        return FatigueLevel.CRITICAL if score > 80 else FatigueLevel.LOW

    def _calculate_baseline_deviation(
        self,
        metrics: FatigueMetrics,
        current_score: int
    ) -> Optional[float]:
        """
        Calculate deviation from personal baseline.

        Returns:
            Percentage deviation (positive = worse than baseline)
        """
        if not self.use_baseline:
            return None

        # This would typically compare against stored baseline
        # For now, return None (to be implemented with database integration)
        return None

    def _generate_recommendations(
        self,
        score: int,
        level: FatigueLevel
    ) -> Tuple[str, str]:
        """
        Generate action recommendations based on fatigue level.

        Returns:
            Tuple of (action description, urgency level)
        """
        if level == FatigueLevel.LOW:
            return "Continue learning. Take a short break in 15-20 minutes.", "low"

        elif level == FatigueLevel.MODERATE:
            return (
                "Consider taking a 5-10 minute break. "
                "Stretch, hydrate, and rest your eyes.",
                "medium"
            )

        elif level == FatigueLevel.HIGH:
            return (
                "Take a 15-20 minute break immediately. "
                "Switch to a different activity or subject.",
                "high"
            )

        else:  # CRITICAL
            return (
                "Stop studying immediately. Take a 30+ minute break. "
                "Consider physical activity, eating, or resting.",
                "critical"
            )


def get_cognitive_domain_from_activity_type(activity_type: str) -> CognitiveDomain:
    """
    Map Moodle activity type to cognitive domain.

    Args:
        activity_type: Moodle activity type (quiz, assignment, etc.)

    Returns:
        Estimated cognitive domain
    """
    mapping = {
        'quiz_multiple_choice': CognitiveDomain.REMEMBER,
        'quiz_true_false': CognitiveDomain.REMEMBER,
        'resource_view': CognitiveDomain.UNDERSTAND,
        'forum_view': CognitiveDomain.UNDERSTAND,
        'quiz_short_answer': CognitiveDomain.APPLY,
        'assignment_text': CognitiveDomain.APPLY,
        'quiz_essay': CognitiveDomain.ANALYZE,
        'assignment_essay': CognitiveDomain.ANALYZE,
        'project': CognitiveDomain.CREATE,
        'assignment_project': CognitiveDomain.CREATE,
    }

    return mapping.get(activity_type, CognitiveDomain.APPLY)  # Default to APPLY
