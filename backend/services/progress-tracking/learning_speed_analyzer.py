"""
Learning Speed Analyzer
Monitors student learning speed and detects slowdowns
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
import statistics


class SpeedTrend(Enum):
    """Learning speed trend categories"""
    INCREASING = "increasing"
    STABLE = "stable"
    DECREASING = "decreasing"
    UNKNOWN = "unknown"


class MessageTrigger(Enum):
    """Reasons for triggering mental care messages"""
    SPEED_DECREASE_MINOR = "speed_decrease_20%"
    SPEED_DECREASE_MODERATE = "speed_decrease_40%"
    SPEED_DECREASE_MAJOR = "speed_decrease_60%"
    CONSECUTIVE_ERRORS = "consecutive_errors"
    LONG_SESSION = "long_session"
    LOW_ACCURACY = "low_accuracy"
    STUCK_ON_PROBLEM = "stuck_on_problem"


@dataclass
class StudentAttempt:
    """Individual problem attempt data"""
    student_id: str
    module_id: str
    problem_id: str
    is_correct: bool
    time_spent_seconds: int
    attempted_at: datetime
    hints_used: int = 0
    attempts_count: int = 1


@dataclass
class LearningSpeedMetric:
    """Aggregated learning speed metrics for a time window"""
    student_id: str
    module_id: str
    time_window_start: datetime
    time_window_end: datetime
    problems_completed: int
    average_time_per_problem: float
    accuracy_rate: float
    speed_score: float  # problems per hour
    speed_trend: SpeedTrend


class LearningSpeedAnalyzer:
    """Analyzes student learning speed and detects patterns"""

    # Configuration thresholds
    TIME_WINDOW_MINUTES = 30  # Analyze speed every 30 minutes
    MIN_PROBLEMS_FOR_ANALYSIS = 3  # Minimum problems needed for reliable analysis
    SPEED_DECREASE_THRESHOLDS = {
        MessageTrigger.SPEED_DECREASE_MINOR: 0.20,  # 20% decrease
        MessageTrigger.SPEED_DECREASE_MODERATE: 0.40,  # 40% decrease
        MessageTrigger.SPEED_DECREASE_MAJOR: 0.60,  # 60% decrease
    }
    LONG_SESSION_MINUTES = 90  # Session longer than 90 minutes
    LOW_ACCURACY_THRESHOLD = 0.50  # Below 50% accuracy
    STUCK_TIME_THRESHOLD_MINUTES = 15  # Stuck on one problem > 15 min
    CONSECUTIVE_ERRORS_THRESHOLD = 4  # 4+ errors in a row

    def __init__(self):
        self.current_metrics: Dict[Tuple[str, str], List[StudentAttempt]] = {}

    def add_attempt(self, attempt: StudentAttempt) -> None:
        """Add a new student attempt to the analyzer"""
        key = (attempt.student_id, attempt.module_id)
        if key not in self.current_metrics:
            self.current_metrics[key] = []
        self.current_metrics[key].append(attempt)

    def calculate_speed_metrics(
        self,
        student_id: str,
        module_id: str,
        time_window_start: datetime,
        time_window_end: datetime,
        attempts: List[StudentAttempt]
    ) -> Optional[LearningSpeedMetric]:
        """Calculate learning speed metrics for a time window"""
        if len(attempts) < self.MIN_PROBLEMS_FOR_ANALYSIS:
            return None

        # Filter attempts within time window
        window_attempts = [
            a for a in attempts
            if time_window_start <= a.attempted_at <= time_window_end
        ]

        if len(window_attempts) < self.MIN_PROBLEMS_FOR_ANALYSIS:
            return None

        # Calculate metrics
        problems_completed = len(window_attempts)
        total_time_seconds = sum(a.time_spent_seconds for a in window_attempts)
        average_time_per_problem = total_time_seconds / problems_completed

        correct_count = sum(1 for a in window_attempts if a.is_correct)
        accuracy_rate = correct_count / problems_completed

        # Calculate speed score (problems per hour)
        window_hours = (time_window_end - time_window_start).total_seconds() / 3600
        speed_score = problems_completed / window_hours if window_hours > 0 else 0

        return LearningSpeedMetric(
            student_id=student_id,
            module_id=module_id,
            time_window_start=time_window_start,
            time_window_end=time_window_end,
            problems_completed=problems_completed,
            average_time_per_problem=average_time_per_problem,
            accuracy_rate=accuracy_rate,
            speed_score=speed_score,
            speed_trend=SpeedTrend.UNKNOWN
        )

    def detect_speed_trend(
        self,
        current_metric: LearningSpeedMetric,
        previous_metric: Optional[LearningSpeedMetric]
    ) -> SpeedTrend:
        """Detect if learning speed is increasing, stable, or decreasing"""
        if previous_metric is None:
            return SpeedTrend.UNKNOWN

        speed_change_ratio = (
            (current_metric.speed_score - previous_metric.speed_score)
            / previous_metric.speed_score
            if previous_metric.speed_score > 0
            else 0
        )

        if speed_change_ratio > 0.15:  # 15% increase
            return SpeedTrend.INCREASING
        elif speed_change_ratio < -0.15:  # 15% decrease
            return SpeedTrend.DECREASING
        else:
            return SpeedTrend.STABLE

    def detect_slowdown_triggers(
        self,
        student_id: str,
        module_id: str,
        recent_attempts: List[StudentAttempt],
        current_metric: LearningSpeedMetric,
        previous_metric: Optional[LearningSpeedMetric]
    ) -> List[MessageTrigger]:
        """Detect conditions that should trigger mental care messages"""
        triggers = []

        # Check for speed decrease
        if previous_metric and previous_metric.speed_score > 0:
            speed_decrease_ratio = (
                (previous_metric.speed_score - current_metric.speed_score)
                / previous_metric.speed_score
            )

            if speed_decrease_ratio >= self.SPEED_DECREASE_THRESHOLDS[MessageTrigger.SPEED_DECREASE_MAJOR]:
                triggers.append(MessageTrigger.SPEED_DECREASE_MAJOR)
            elif speed_decrease_ratio >= self.SPEED_DECREASE_THRESHOLDS[MessageTrigger.SPEED_DECREASE_MODERATE]:
                triggers.append(MessageTrigger.SPEED_DECREASE_MODERATE)
            elif speed_decrease_ratio >= self.SPEED_DECREASE_THRESHOLDS[MessageTrigger.SPEED_DECREASE_MINOR]:
                triggers.append(MessageTrigger.SPEED_DECREASE_MINOR)

        # Check for consecutive errors
        if len(recent_attempts) >= self.CONSECUTIVE_ERRORS_THRESHOLD:
            recent_errors = [
                not a.is_correct for a in recent_attempts[-self.CONSECUTIVE_ERRORS_THRESHOLD:]
            ]
            if all(recent_errors):
                triggers.append(MessageTrigger.CONSECUTIVE_ERRORS)

        # Check for low accuracy
        if current_metric.accuracy_rate < self.LOW_ACCURACY_THRESHOLD:
            triggers.append(MessageTrigger.LOW_ACCURACY)

        # Check for stuck on problem (last attempt took too long)
        if recent_attempts:
            last_attempt = recent_attempts[-1]
            if last_attempt.time_spent_seconds > (self.STUCK_TIME_THRESHOLD_MINUTES * 60):
                triggers.append(MessageTrigger.STUCK_ON_PROBLEM)

        # Check for long session
        if recent_attempts:
            session_duration = (
                recent_attempts[-1].attempted_at - recent_attempts[0].attempted_at
            ).total_seconds() / 60
            if session_duration > self.LONG_SESSION_MINUTES:
                triggers.append(MessageTrigger.LONG_SESSION)

        return triggers

    def analyze_student_progress(
        self,
        student_id: str,
        module_id: str,
        attempts: List[StudentAttempt],
        previous_metrics: List[LearningSpeedMetric]
    ) -> Tuple[Optional[LearningSpeedMetric], List[MessageTrigger]]:
        """
        Analyze student progress and return current metrics and any triggers

        Returns:
            Tuple of (current_metric, message_triggers)
        """
        if not attempts:
            return None, []

        # Define current time window
        now = datetime.now()
        window_start = now - timedelta(minutes=self.TIME_WINDOW_MINUTES)
        window_end = now

        # Calculate current metrics
        current_metric = self.calculate_speed_metrics(
            student_id, module_id, window_start, window_end, attempts
        )

        if current_metric is None:
            return None, []

        # Get previous metric for comparison
        previous_metric = previous_metrics[-1] if previous_metrics else None

        # Detect speed trend
        current_metric.speed_trend = self.detect_speed_trend(
            current_metric, previous_metric
        )

        # Detect triggers for mental care messages
        triggers = self.detect_slowdown_triggers(
            student_id, module_id, attempts, current_metric, previous_metric
        )

        return current_metric, triggers

    def get_recommendations(self, triggers: List[MessageTrigger]) -> Dict[str, any]:
        """Get recommendations based on detected triggers"""
        recommendations = {
            'should_send_message': len(triggers) > 0,
            'triggers': [t.value for t in triggers],
            'severity': 'low',
            'actions': []
        }

        # Determine severity
        if MessageTrigger.SPEED_DECREASE_MAJOR in triggers:
            recommendations['severity'] = 'high'
            recommendations['actions'].append('suggest_break')
            recommendations['actions'].append('offer_help')
        elif MessageTrigger.SPEED_DECREASE_MODERATE in triggers or MessageTrigger.CONSECUTIVE_ERRORS in triggers:
            recommendations['severity'] = 'medium'
            recommendations['actions'].append('encourage')
            recommendations['actions'].append('suggest_strategy')
        elif triggers:
            recommendations['severity'] = 'low'
            recommendations['actions'].append('encourage')

        # Long session always suggests break
        if MessageTrigger.LONG_SESSION in triggers:
            recommendations['actions'].append('suggest_break')

        # Stuck on problem suggests hints
        if MessageTrigger.STUCK_ON_PROBLEM in triggers:
            recommendations['actions'].append('offer_hint')

        return recommendations


# Example usage
if __name__ == "__main__":
    analyzer = LearningSpeedAnalyzer()

    # Simulate student attempts
    now = datetime.now()
    attempts = [
        StudentAttempt("student1", "module1", "p1", True, 120, now - timedelta(minutes=25)),
        StudentAttempt("student1", "module1", "p2", True, 150, now - timedelta(minutes=20)),
        StudentAttempt("student1", "module1", "p3", False, 300, now - timedelta(minutes=15)),
        StudentAttempt("student1", "module1", "p4", False, 400, now - timedelta(minutes=10)),
        StudentAttempt("student1", "module1", "p5", False, 500, now - timedelta(minutes=5)),
    ]

    current_metric, triggers = analyzer.analyze_student_progress(
        "student1", "module1", attempts, []
    )

    if current_metric:
        print(f"Speed Score: {current_metric.speed_score:.2f} problems/hour")
        print(f"Accuracy: {current_metric.accuracy_rate:.1%}")
        print(f"Trend: {current_metric.speed_trend.value}")

    if triggers:
        print(f"Triggers: {[t.value for t in triggers]}")
        recommendations = analyzer.get_recommendations(triggers)
        print(f"Recommendations: {recommendations}")
