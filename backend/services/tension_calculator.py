"""
Tension Curve Calculation Service
Implements algorithms for calculating tension scores and learning curve analysis
"""

import math
from typing import List, Tuple, Optional
from datetime import datetime, timedelta
from statistics import mean, stdev

from backend.models.student_progress import (
    TensionCalculationParams,
    LearningPhase,
    AccuracyTrend,
    TensionHistoryPoint,
    DifficultyPoint
)


class TensionCalculator:
    """Service for calculating tension scores and learning analytics"""

    @staticmethod
    def calculate_tension_score(params: TensionCalculationParams) -> float:
        """
        Calculate tension score based on multiple factors

        Tension score represents cognitive load and learning difficulty:
        - 0-30: Low tension (comfortable learning)
        - 30-60: Moderate tension (optimal challenge)
        - 60-100: High tension (struggling, needs intervention)

        Args:
            params: TensionCalculationParams with metrics and weights

        Returns:
            float: Tension score (0-100)
        """
        # 1. Accuracy factor: Lower accuracy = higher tension (inverted)
        accuracy_factor = 100 - params.accuracy_rate

        # 2. Difficulty factor: Higher difficulty = higher potential tension
        difficulty_factor = (params.difficulty_level / 10) * 30

        # 3. Consistency factor: More consecutive incorrect = higher tension
        # Cap at 30 points maximum
        consistency_factor = min(params.consecutive_incorrect * 5, 30)

        # 4. Time factor: Taking much longer than expected = higher tension
        if params.average_time_ratio > 1.5:
            time_factor = 20
        elif params.average_time_ratio > 1.2:
            time_factor = 10
        else:
            time_factor = 0

        # Combine factors using weighted average
        tension_score = (
            accuracy_factor * params.accuracy_weight +
            difficulty_factor * params.difficulty_weight +
            consistency_factor * params.consistency_weight +
            time_factor * params.time_weight
        )

        # Clamp to 0-100 range
        tension_score = max(0, min(100, tension_score))

        return round(tension_score, 2)

    @staticmethod
    def determine_learning_phase(
        accuracy_rate: float,
        total_attempts: int,
        tension_score: float
    ) -> LearningPhase:
        """
        Determine the current learning phase based on performance metrics

        Phases:
        - EARLY: Just started (<5 attempts)
        - MASTERY: High accuracy, low tension
        - STRUGGLING: Low accuracy, high tension
        - PLATEAU: Moderate accuracy, many attempts, not improving
        - GROWTH: Active learning progress

        Args:
            accuracy_rate: Current accuracy percentage (0-100)
            total_attempts: Total number of attempts
            tension_score: Current tension score (0-100)

        Returns:
            LearningPhase: Current phase
        """
        if total_attempts < 5:
            return LearningPhase.EARLY

        if accuracy_rate >= 85 and tension_score < 30:
            return LearningPhase.MASTERY

        if accuracy_rate < 50 and tension_score > 60:
            return LearningPhase.STRUGGLING

        if 50 <= accuracy_rate <= 70 and total_attempts > 20:
            return LearningPhase.PLATEAU

        return LearningPhase.GROWTH

    @staticmethod
    def calculate_trend(
        values: List[float],
        window_size: int = 5
    ) -> AccuracyTrend:
        """
        Calculate trend direction based on recent values

        Args:
            values: List of values (e.g., accuracy rates over time)
            window_size: Number of recent values to consider

        Returns:
            AccuracyTrend: Trend direction
        """
        if len(values) < 2:
            return AccuracyTrend.STABLE

        # Use recent window
        recent_values = values[-window_size:]

        if len(recent_values) < 2:
            return AccuracyTrend.STABLE

        # Simple linear regression slope
        x = list(range(len(recent_values)))
        y = recent_values

        n = len(x)
        x_mean = mean(x)
        y_mean = mean(y)

        # Calculate slope
        numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return AccuracyTrend.STABLE

        slope = numerator / denominator

        # Determine trend based on slope
        # Thresholds can be adjusted based on domain
        if slope > 2:  # Improving significantly
            return AccuracyTrend.IMPROVING
        elif slope < -2:  # Declining significantly
            return AccuracyTrend.DECLINING
        else:
            return AccuracyTrend.STABLE

    @staticmethod
    def calculate_tension_volatility(
        tension_history: List[TensionHistoryPoint]
    ) -> float:
        """
        Calculate tension score volatility (standard deviation)

        High volatility indicates inconsistent performance

        Args:
            tension_history: List of historical tension points

        Returns:
            float: Standard deviation of tension scores
        """
        if len(tension_history) < 2:
            return 0.0

        tension_scores = [point.tension_score for point in tension_history]
        return round(stdev(tension_scores), 2)

    @staticmethod
    def predict_next_tension(
        tension_history: List[TensionHistoryPoint],
        prediction_window: int = 5
    ) -> Optional[float]:
        """
        Predict next tension score using simple linear extrapolation

        Args:
            tension_history: List of historical tension points
            prediction_window: Number of recent points to use for prediction

        Returns:
            float: Predicted tension score, or None if insufficient data
        """
        if len(tension_history) < 3:
            return None

        # Use recent window
        recent_points = tension_history[-prediction_window:]

        # Extract tension scores
        y = [point.tension_score for point in recent_points]
        x = list(range(len(y)))

        # Simple linear regression
        n = len(x)
        x_mean = mean(x)
        y_mean = mean(y)

        numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return y_mean

        slope = numerator / denominator
        intercept = y_mean - slope * x_mean

        # Predict next value
        next_x = len(y)
        predicted = slope * next_x + intercept

        # Clamp to valid range
        predicted = max(0, min(100, predicted))

        return round(predicted, 2)

    @staticmethod
    def recommend_action(
        tension_score: float,
        learning_phase: LearningPhase,
        accuracy_trend: AccuracyTrend,
        consecutive_incorrect: int
    ) -> str:
        """
        Recommend pedagogical action based on student state

        Args:
            tension_score: Current tension score
            learning_phase: Current learning phase
            accuracy_trend: Recent accuracy trend
            consecutive_incorrect: Number of consecutive incorrect answers

        Returns:
            str: Recommended action
        """
        # High tension / struggling
        if tension_score > 70 or learning_phase == LearningPhase.STRUGGLING:
            if consecutive_incorrect >= 3:
                return "provide_detailed_hint"
            return "reduce_difficulty"

        # Declining performance
        if accuracy_trend == AccuracyTrend.DECLINING:
            if tension_score > 50:
                return "review_previous_concepts"
            return "provide_hint"

        # Plateau - not making progress
        if learning_phase == LearningPhase.PLATEAU:
            return "introduce_variety"

        # Mastery - ready for challenge
        if learning_phase == LearningPhase.MASTERY:
            return "increase_difficulty"

        # Improving or stable - continue
        if accuracy_trend == AccuracyTrend.IMPROVING:
            return "continue"

        # Default
        return "monitor"

    @staticmethod
    def estimate_completion_time(
        current_progress_rate: float,
        average_time_per_problem: int,
        remaining_problems: int
    ) -> int:
        """
        Estimate time to completion in hours

        Args:
            current_progress_rate: Problems completed per hour
            average_time_per_problem: Average time in seconds
            remaining_problems: Number of problems remaining

        Returns:
            int: Estimated hours to completion
        """
        if current_progress_rate <= 0 or average_time_per_problem <= 0:
            return 0

        # Calculate time in seconds
        estimated_seconds = remaining_problems * average_time_per_problem

        # Convert to hours and round up
        estimated_hours = math.ceil(estimated_seconds / 3600)

        return estimated_hours

    @staticmethod
    def calculate_difficulty_adjustment(
        current_difficulty: int,
        accuracy_rate: float,
        tension_score: float,
        learning_phase: LearningPhase
    ) -> int:
        """
        Calculate recommended difficulty level adjustment

        Args:
            current_difficulty: Current difficulty level (1-10)
            accuracy_rate: Current accuracy rate (0-100)
            tension_score: Current tension score (0-100)
            learning_phase: Current learning phase

        Returns:
            int: Recommended difficulty level (1-10)
        """
        new_difficulty = current_difficulty

        # Reduce difficulty if struggling
        if learning_phase == LearningPhase.STRUGGLING or tension_score > 70:
            new_difficulty = max(1, current_difficulty - 2)

        # Increase difficulty if mastered
        elif learning_phase == LearningPhase.MASTERY and accuracy_rate >= 90:
            new_difficulty = min(10, current_difficulty + 1)

        # Slight increase if doing well but not mastered
        elif accuracy_rate >= 80 and tension_score < 40:
            new_difficulty = min(10, current_difficulty + 1)

        # Slight decrease if accuracy is low
        elif accuracy_rate < 60:
            new_difficulty = max(1, current_difficulty - 1)

        return new_difficulty

    @staticmethod
    def analyze_performance_pattern(
        difficulty_trajectory: List[DifficultyPoint]
    ) -> dict:
        """
        Analyze learning patterns from difficulty trajectory

        Args:
            difficulty_trajectory: List of difficulty-accuracy pairs

        Returns:
            dict: Analysis results with insights
        """
        if not difficulty_trajectory:
            return {
                "pattern": "insufficient_data",
                "insights": []
            }

        # Calculate correlation between difficulty and accuracy
        difficulties = [point.difficulty for point in difficulty_trajectory]
        accuracies = [point.accuracy for point in difficulty_trajectory]

        if len(difficulties) < 2:
            return {
                "pattern": "early_stage",
                "insights": ["Not enough data for pattern analysis"]
            }

        # Simple correlation calculation
        n = len(difficulties)
        diff_mean = mean(difficulties)
        acc_mean = mean(accuracies)

        numerator = sum((difficulties[i] - diff_mean) * (accuracies[i] - acc_mean)
                       for i in range(n))
        diff_variance = sum((d - diff_mean) ** 2 for d in difficulties)
        acc_variance = sum((a - acc_mean) ** 2 for a in accuracies)

        if diff_variance == 0 or acc_variance == 0:
            correlation = 0
        else:
            correlation = numerator / math.sqrt(diff_variance * acc_variance)

        # Interpret correlation
        insights = []
        if correlation < -0.5:
            pattern = "difficulty_sensitive"
            insights.append("Performance decreases significantly with difficulty")
            insights.append("Consider more gradual difficulty progression")
        elif correlation < -0.2:
            pattern = "normal_learning"
            insights.append("Normal learning pattern with expected difficulty response")
        elif abs(correlation) <= 0.2:
            pattern = "difficulty_independent"
            insights.append("Performance is relatively stable across difficulty levels")
            insights.append("Student may be ready for more challenge")
        else:
            pattern = "unusual_pattern"
            insights.append("Unusual pattern - performance improves with difficulty")
            insights.append("Consider reviewing easier content for gaps")

        return {
            "pattern": pattern,
            "correlation": round(correlation, 3),
            "insights": insights,
            "average_difficulty": round(mean(difficulties), 2),
            "average_accuracy": round(mean(accuracies), 2),
            "difficulty_range": (min(difficulties), max(difficulties))
        }
