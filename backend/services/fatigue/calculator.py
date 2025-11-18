"""
Fatigue Score Calculation Engine

This module implements the core fatigue prediction algorithm that analyzes
student learning behavior and calculates fatigue scores in real-time.
"""

from dataclasses import dataclass
from datetime import datetime, time
from typing import List, Optional, Tuple
import math


@dataclass
class FatigueInput:
    """Input data for fatigue calculation"""
    session_duration_minutes: float
    complexity_level: int  # 1-5
    error_rate: float  # 0-1
    actual_pace: float  # problems per minute
    expected_pace: float  # baseline problems per minute
    time_of_day: int  # 0-23 hour
    interaction_count: int  # interactions per minute
    previous_fatigue_score: float = 0.0


@dataclass
class FatigueResult:
    """Result of fatigue calculation"""
    fatigue_score: float  # 0-100
    fatigue_level: int  # 1-5
    base_fatigue: float
    complexity_load: float
    error_impact: float
    pace_pressure: float
    circadian_modifier: float
    trend: str  # 'increasing', 'stable', 'decreasing'
    recommendation: Optional[str] = None


class FatigueCalculator:
    """
    Calculates fatigue scores based on multiple factors including session duration,
    task complexity, error rates, and circadian rhythms.
    """

    # Weight coefficients for fatigue components
    WEIGHTS = {
        'base_fatigue': 0.40,
        'complexity_load': 0.25,
        'error_impact': 0.20,
        'pace_pressure': 0.15,
    }

    # Fatigue level thresholds
    THRESHOLDS = {
        1: (0, 30),      # Fresh
        2: (31, 50),     # Mild fatigue
        3: (51, 70),     # Moderate fatigue
        4: (71, 85),     # High fatigue
        5: (86, 100),    # Exhaustion
    }

    # Circadian rhythm modifiers (hour -> multiplier)
    CIRCADIAN_MODIFIERS = {
        # Early morning (low alertness)
        6: 1.15, 7: 1.10, 8: 1.05,
        # Peak morning (high alertness)
        9: 0.95, 10: 0.90, 11: 0.92,
        # Post-lunch dip
        12: 1.00, 13: 1.10, 14: 1.15,
        # Afternoon recovery
        15: 1.05, 16: 1.00, 17: 1.05,
        # Evening decline
        18: 1.10, 19: 1.15, 20: 1.20,
        # Night (very low alertness)
        21: 1.25, 22: 1.30, 23: 1.35,
    }

    def __init__(self, custom_weights: Optional[dict] = None):
        """
        Initialize calculator with optional custom weights.

        Args:
            custom_weights: Dictionary of custom weight coefficients
        """
        if custom_weights:
            self.WEIGHTS.update(custom_weights)

    def calculate(self, input_data: FatigueInput) -> FatigueResult:
        """
        Calculate fatigue score based on multiple factors.

        Args:
            input_data: Input parameters for fatigue calculation

        Returns:
            FatigueResult with detailed breakdown
        """
        # Calculate individual components
        base_fatigue = self._calculate_base_fatigue(input_data.session_duration_minutes)
        complexity_load = self._calculate_complexity_load(input_data.complexity_level)
        error_impact = self._calculate_error_impact(input_data.error_rate)
        pace_pressure = self._calculate_pace_pressure(
            input_data.actual_pace,
            input_data.expected_pace
        )

        # Weighted sum of components
        raw_score = (
            base_fatigue * self.WEIGHTS['base_fatigue'] +
            complexity_load * self.WEIGHTS['complexity_load'] +
            error_impact * self.WEIGHTS['error_impact'] +
            pace_pressure * self.WEIGHTS['pace_pressure']
        )

        # Apply circadian rhythm modifier
        circadian_modifier = self._get_circadian_modifier(input_data.time_of_day)
        adjusted_score = raw_score * circadian_modifier

        # Apply interaction rate modifier (low interaction = higher fatigue)
        interaction_modifier = self._calculate_interaction_modifier(
            input_data.interaction_count
        )
        final_score = adjusted_score * interaction_modifier

        # Clamp to 0-100 range
        final_score = max(0.0, min(100.0, final_score))

        # Determine fatigue level
        fatigue_level = self._determine_fatigue_level(final_score)

        # Determine trend
        trend = self._determine_trend(final_score, input_data.previous_fatigue_score)

        # Generate recommendation if needed
        recommendation = self._generate_recommendation(final_score, fatigue_level, trend)

        return FatigueResult(
            fatigue_score=round(final_score, 2),
            fatigue_level=fatigue_level,
            base_fatigue=round(base_fatigue, 2),
            complexity_load=round(complexity_load, 2),
            error_impact=round(error_impact, 2),
            pace_pressure=round(pace_pressure, 2),
            circadian_modifier=round(circadian_modifier, 3),
            trend=trend,
            recommendation=recommendation
        )

    def _calculate_base_fatigue(self, duration_minutes: float) -> float:
        """
        Calculate base fatigue from session duration.
        Uses logarithmic curve to model diminishing returns.

        Args:
            duration_minutes: Total session duration

        Returns:
            Base fatigue score (0-100)
        """
        if duration_minutes <= 0:
            return 0.0

        # Logarithmic fatigue accumulation
        # At 20 min: ~55, at 40 min: ~75, at 60 min: ~87
        score = 35 * math.log(duration_minutes + 1, 2)

        return min(100.0, score)

    def _calculate_complexity_load(self, complexity_level: int) -> float:
        """
        Calculate cognitive load from task complexity.

        Args:
            complexity_level: Task difficulty (1-5)

        Returns:
            Complexity load score (0-100)
        """
        # Linear scaling: level 1 = 20, level 5 = 100
        return (complexity_level / 5.0) * 100

    def _calculate_error_impact(self, error_rate: float) -> float:
        """
        Calculate fatigue impact from error rate.
        Higher error rate indicates cognitive strain.

        Args:
            error_rate: Proportion of errors (0-1)

        Returns:
            Error impact score (0-100)
        """
        # Exponential curve: errors compound fatigue
        return (error_rate ** 0.7) * 100

    def _calculate_pace_pressure(self, actual_pace: float, expected_pace: float) -> float:
        """
        Calculate pressure from working faster than expected pace.

        Args:
            actual_pace: Current problems per minute
            expected_pace: Baseline expected pace

        Returns:
            Pace pressure score (0-100)
        """
        if expected_pace <= 0:
            return 0.0

        pace_ratio = actual_pace / expected_pace

        if pace_ratio <= 1.0:
            # Working at or below expected pace = no pressure
            return 0.0
        else:
            # Working faster = pressure builds
            # At 2x pace: 50 points, at 3x pace: 75 points
            pressure = max(0, (pace_ratio - 1.0)) * 50
            return min(100.0, pressure)

    def _get_circadian_modifier(self, hour: int) -> float:
        """
        Get circadian rhythm modifier for time of day.

        Args:
            hour: Hour of day (0-23)

        Returns:
            Multiplier for fatigue score
        """
        return self.CIRCADIAN_MODIFIERS.get(hour, 1.0)

    def _calculate_interaction_modifier(self, interactions_per_minute: int) -> float:
        """
        Calculate modifier based on interaction rate.
        Low interaction suggests zoning out or struggle.

        Args:
            interactions_per_minute: UI interactions per minute

        Returns:
            Multiplier for fatigue score (>1 increases fatigue)
        """
        if interactions_per_minute >= 5:
            # Normal engagement
            return 1.0
        elif interactions_per_minute >= 2:
            # Slight decrease in engagement
            return 1.05
        elif interactions_per_minute >= 1:
            # Low engagement
            return 1.15
        else:
            # Very low engagement (zoning out)
            return 1.25

    def _determine_fatigue_level(self, score: float) -> int:
        """
        Convert fatigue score to categorical level (1-5).

        Args:
            score: Fatigue score (0-100)

        Returns:
            Fatigue level (1-5)
        """
        for level, (min_score, max_score) in self.THRESHOLDS.items():
            if min_score <= score <= max_score:
                return level
        return 5  # Default to highest if out of range

    def _determine_trend(self, current_score: float, previous_score: float) -> str:
        """
        Determine fatigue trend based on score change.

        Args:
            current_score: Current fatigue score
            previous_score: Previous fatigue score

        Returns:
            Trend string: 'increasing', 'stable', or 'decreasing'
        """
        delta = current_score - previous_score

        if delta > 5:
            return 'increasing'
        elif delta < -5:
            return 'decreasing'
        else:
            return 'stable'

    def _generate_recommendation(
        self,
        score: float,
        level: int,
        trend: str
    ) -> Optional[str]:
        """
        Generate actionable recommendation based on fatigue state.

        Args:
            score: Current fatigue score
            level: Current fatigue level
            trend: Fatigue trend

        Returns:
            Recommendation string or None
        """
        if level == 5 or score >= 85:
            return "Take a 30-minute break immediately. You need rest!"

        if level == 4 or (score >= 70 and trend == 'increasing'):
            return "Time for a 15-minute break. Stretch and hydrate."

        if level == 3 or (score >= 50 and trend == 'increasing'):
            return "Consider a 5-minute break soon. You're doing great!"

        if level == 2 and score >= 45:
            return "Quick tip: Try the 20-20-20 rule for your eyes."

        return None

    def calculate_recovery_time(
        self,
        current_fatigue: float,
        target_fatigue: float,
        base_recovery_rate: float = 1.5
    ) -> int:
        """
        Estimate time needed to recover to target fatigue level.

        Args:
            current_fatigue: Current fatigue score
            target_fatigue: Desired fatigue score
            base_recovery_rate: Points recovered per minute

        Returns:
            Estimated minutes to reach target
        """
        if current_fatigue <= target_fatigue:
            return 0

        fatigue_to_recover = current_fatigue - target_fatigue
        minutes_needed = math.ceil(fatigue_to_recover / base_recovery_rate)

        return minutes_needed

    def recommend_break_duration(self, fatigue_score: float) -> Tuple[str, int]:
        """
        Recommend break type and duration based on fatigue score.

        Args:
            fatigue_score: Current fatigue score

        Returns:
            Tuple of (break_type, duration_minutes)
        """
        if fatigue_score >= 85:
            return ('long', 30)
        elif fatigue_score >= 70:
            return ('medium', 15)
        elif fatigue_score >= 50:
            return ('short', 10)
        elif fatigue_score >= 35:
            return ('micro', 5)
        else:
            return ('micro', 3)


class PersonalizedFatigueCalculator(FatigueCalculator):
    """
    Extended calculator that adapts to individual student patterns.
    """

    def __init__(
        self,
        student_fatigue_rate: float = 1.0,
        student_recovery_rate: float = 1.5,
        optimal_session_duration: int = 45,
        custom_weights: Optional[dict] = None
    ):
        """
        Initialize with personalized parameters.

        Args:
            student_fatigue_rate: Student's fatigue accumulation rate (multiplier)
            student_recovery_rate: Student's recovery rate (points per minute)
            optimal_session_duration: Student's optimal session length
            custom_weights: Custom weight coefficients
        """
        super().__init__(custom_weights)
        self.student_fatigue_rate = student_fatigue_rate
        self.student_recovery_rate = student_recovery_rate
        self.optimal_session_duration = optimal_session_duration

    def calculate(self, input_data: FatigueInput) -> FatigueResult:
        """
        Calculate fatigue with personalization.

        Args:
            input_data: Input parameters

        Returns:
            Personalized FatigueResult
        """
        # Get base calculation
        result = super().calculate(input_data)

        # Apply personalization multiplier
        personalized_score = result.fatigue_score * self.student_fatigue_rate

        # Adjust based on deviation from optimal duration
        if input_data.session_duration_minutes > self.optimal_session_duration:
            overtime_ratio = input_data.session_duration_minutes / self.optimal_session_duration
            personalized_score *= (1 + (overtime_ratio - 1) * 0.3)

        # Clamp and update
        personalized_score = max(0.0, min(100.0, personalized_score))

        return FatigueResult(
            fatigue_score=round(personalized_score, 2),
            fatigue_level=self._determine_fatigue_level(personalized_score),
            base_fatigue=result.base_fatigue,
            complexity_load=result.complexity_load,
            error_impact=result.error_impact,
            pace_pressure=result.pace_pressure,
            circadian_modifier=result.circadian_modifier,
            trend=self._determine_trend(personalized_score, input_data.previous_fatigue_score),
            recommendation=self._generate_recommendation(
                personalized_score,
                self._determine_fatigue_level(personalized_score),
                result.trend
            )
        )

    def calculate_recovery_time(
        self,
        current_fatigue: float,
        target_fatigue: float,
        base_recovery_rate: Optional[float] = None
    ) -> int:
        """
        Calculate recovery time using personalized recovery rate.
        """
        recovery_rate = base_recovery_rate or self.student_recovery_rate
        return super().calculate_recovery_time(current_fatigue, target_fatigue, recovery_rate)
