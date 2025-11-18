"""
Behavior Analyzer

This module processes raw Moodle interaction data to extract behavioral patterns
and performance metrics for impairment detection.

Key functions:
- Session reconstruction (grouping interactions into sessions)
- Performance metrics calculation (accuracy, response time, etc.)
- Behavioral pattern detection (rapid clicking, hesitation, etc.)
- Baseline calculation and comparison
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import statistics
import logging

from src.detectors.impairment_detector import PerformanceMetrics, BehavioralPatterns, StudentBaseline

logger = logging.getLogger(__name__)


@dataclass
class Interaction:
    """Represents a single student interaction."""
    timestamp: datetime
    interaction_type: str
    response_time_ms: Optional[int] = None
    is_correct: Optional[bool] = None
    context_id: Optional[int] = None
    metadata: Optional[Dict] = None


class BehaviorAnalyzer:
    """
    Analyzes student behavior patterns from interaction data.

    Processes raw interaction data to extract meaningful metrics
    and patterns for impairment detection.
    """

    # Configuration
    SESSION_TIMEOUT_MINUTES = 15  # Inactivity period to end session
    RAPID_CLICK_THRESHOLD_MS = 5000  # < 5 sec = rapid click
    HESITATION_THRESHOLD_MS = 60000  # > 60 sec = hesitation
    NAVIGATION_EVENT_TYPES = ['page_view', 'navigation', 'back', 'forward']

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize behavior analyzer.

        Args:
            config: Optional configuration overrides
        """
        self.config = config or {}
        self._apply_config()
        logger.info("BehaviorAnalyzer initialized")

    def _apply_config(self):
        """Apply configuration overrides."""
        if 'session_timeout' in self.config:
            self.SESSION_TIMEOUT_MINUTES = self.config['session_timeout']
        if 'rapid_click_threshold' in self.config:
            self.RAPID_CLICK_THRESHOLD_MS = self.config['rapid_click_threshold']

    def calculate_performance_metrics(
        self,
        interactions: List[Interaction]
    ) -> PerformanceMetrics:
        """
        Calculate performance metrics from interactions.

        Args:
            interactions: List of student interactions

        Returns:
            PerformanceMetrics object
        """
        if not interactions:
            return PerformanceMetrics()

        # Filter to quiz/assessment interactions only
        quiz_interactions = [
            i for i in interactions
            if i.interaction_type == 'quiz_answer' and i.is_correct is not None
        ]

        if not quiz_interactions:
            return PerformanceMetrics(total_interactions=len(interactions))

        # Calculate basic counts
        total = len(quiz_interactions)
        correct = sum(1 for i in quiz_interactions if i.is_correct)
        incorrect = total - correct

        # Calculate accuracy
        accuracy = correct / total if total > 0 else None

        # Calculate response times
        response_times = [i.response_time_ms for i in quiz_interactions if i.response_time_ms is not None]
        avg_response_time = None
        std_response_time = None

        if response_times:
            avg_response_time = int(statistics.mean(response_times))
            if len(response_times) > 1:
                std_response_time = statistics.stdev(response_times)

        # Detect careless errors
        careless_errors = self._detect_careless_errors(quiz_interactions)
        careless_error_rate = careless_errors / incorrect if incorrect > 0 else 0.0

        metrics = PerformanceMetrics(
            accuracy_rate=accuracy,
            avg_response_time_ms=avg_response_time,
            std_response_time_ms=std_response_time,
            careless_error_rate=careless_error_rate,
            total_interactions=len(interactions),
            correct_answers=correct,
            incorrect_answers=incorrect,
            careless_errors=careless_errors
        )

        logger.debug(f"Calculated metrics: accuracy={accuracy:.2f if accuracy else 0}, avg_response_time={avg_response_time}ms")
        return metrics

    def analyze_behavioral_patterns(
        self,
        interactions: List[Interaction],
        session_start: datetime,
        session_end: Optional[datetime] = None
    ) -> BehavioralPatterns:
        """
        Analyze behavioral patterns from interactions.

        Args:
            interactions: List of student interactions
            session_start: Session start time
            session_end: Session end time (None for ongoing session)

        Returns:
            BehavioralPatterns object
        """
        if not interactions:
            return BehavioralPatterns()

        # Calculate session duration
        end_time = session_end or datetime.utcnow()
        duration_minutes = (end_time - session_start).total_seconds() / 60

        # Detect rapid clicks
        rapid_clicks = sum(
            1 for i in interactions
            if i.response_time_ms is not None and i.response_time_ms < self.RAPID_CLICK_THRESHOLD_MS
        )

        # Detect hesitation events
        hesitation_events = sum(
            1 for i in interactions
            if i.response_time_ms is not None and i.response_time_ms > self.HESITATION_THRESHOLD_MS
        )

        # Detect navigation confusion
        navigation_confusion = sum(
            1 for i in interactions
            if i.interaction_type in self.NAVIGATION_EVENT_TYPES
        )

        # Calculate interaction rate
        interaction_rate = len(interactions) / duration_minutes if duration_minutes > 0 else 0

        patterns = BehavioralPatterns(
            rapid_clicks=rapid_clicks,
            hesitation_events=hesitation_events,
            navigation_confusion=navigation_confusion,
            session_duration_minutes=duration_minutes,
            interaction_rate_per_minute=interaction_rate
        )

        logger.debug(f"Behavioral patterns: rapid_clicks={rapid_clicks}, hesitation={hesitation_events}, duration={duration_minutes:.1f}min")
        return patterns

    def calculate_baseline(
        self,
        historical_interactions: List[Interaction],
        min_sample_size: int = 20
    ) -> Optional[StudentBaseline]:
        """
        Calculate baseline performance from historical data.

        Args:
            historical_interactions: Historical interaction data
            min_sample_size: Minimum interactions needed for baseline

        Returns:
            StudentBaseline or None if insufficient data
        """
        # Filter quiz interactions
        quiz_interactions = [
            i for i in historical_interactions
            if i.interaction_type == 'quiz_answer' and i.is_correct is not None
        ]

        if len(quiz_interactions) < min_sample_size:
            logger.warning(f"Insufficient data for baseline: {len(quiz_interactions)} < {min_sample_size}")
            return None

        # Calculate accuracy metrics
        accuracies = []
        window_size = 10  # Calculate accuracy per 10 questions

        for i in range(0, len(quiz_interactions), window_size):
            window = quiz_interactions[i:i + window_size]
            if len(window) >= 5:  # Need at least 5 questions
                accuracy = sum(1 for q in window if q.is_correct) / len(window)
                accuracies.append(accuracy)

        avg_accuracy = statistics.mean(accuracies) if accuracies else 0.80
        std_accuracy = statistics.stdev(accuracies) if len(accuracies) > 1 else 0.10

        # Calculate response time metrics
        response_times = [i.response_time_ms for i in quiz_interactions if i.response_time_ms is not None]

        avg_response_time = int(statistics.mean(response_times)) if response_times else 12000
        std_response_time = int(statistics.stdev(response_times)) if len(response_times) > 1 else 5000

        # Calculate careless error rate
        incorrect = [i for i in quiz_interactions if not i.is_correct]
        careless_errors = self._detect_careless_errors(quiz_interactions)
        careless_error_rate = careless_errors / len(incorrect) if incorrect else 0.15

        baseline = StudentBaseline(
            avg_accuracy=avg_accuracy,
            std_accuracy=std_accuracy,
            avg_response_time_ms=avg_response_time,
            std_response_time_ms=std_response_time,
            careless_error_rate=careless_error_rate,
            sample_size=len(quiz_interactions)
        )

        logger.info(f"Calculated baseline from {len(quiz_interactions)} interactions: accuracy={avg_accuracy:.2f}, response_time={avg_response_time}ms")
        return baseline

    def _detect_careless_errors(self, interactions: List[Interaction]) -> int:
        """
        Detect careless errors (vs. conceptual errors).

        Heuristics for careless errors:
        1. Answered very quickly (< 5 seconds)
        2. Pattern of getting similar questions right before/after
        3. Answer changed at last moment

        Args:
            interactions: List of interactions

        Returns:
            Count of detected careless errors
        """
        careless_count = 0

        incorrect = [i for i in interactions if i.is_correct is False]

        for i, error_interaction in enumerate(incorrect):
            # Heuristic 1: Very quick response
            if error_interaction.response_time_ms and error_interaction.response_time_ms < self.RAPID_CLICK_THRESHOLD_MS:
                careless_count += 1
                continue

            # Heuristic 2: Similar questions answered correctly before/after
            # (This would require question similarity analysis - simplified here)
            # For MVP, we use response time as primary indicator

        return careless_count

    def reconstruct_sessions(
        self,
        interactions: List[Interaction],
        timeout_minutes: Optional[int] = None
    ) -> List[Tuple[datetime, datetime, List[Interaction]]]:
        """
        Reconstruct logical sessions from interaction timeline.

        A session ends when there's inactivity > timeout_minutes.

        Args:
            interactions: List of interactions (must be sorted by timestamp)
            timeout_minutes: Inactivity timeout (defaults to SESSION_TIMEOUT_MINUTES)

        Returns:
            List of (session_start, session_end, session_interactions) tuples
        """
        if not interactions:
            return []

        timeout = timedelta(minutes=timeout_minutes or self.SESSION_TIMEOUT_MINUTES)

        # Sort by timestamp
        sorted_interactions = sorted(interactions, key=lambda x: x.timestamp)

        sessions = []
        current_session = [sorted_interactions[0]]
        session_start = sorted_interactions[0].timestamp

        for i in range(1, len(sorted_interactions)):
            prev_time = sorted_interactions[i - 1].timestamp
            curr_time = sorted_interactions[i].timestamp

            # Check if new session should start
            if curr_time - prev_time > timeout:
                # End current session
                session_end = sorted_interactions[i - 1].timestamp
                sessions.append((session_start, session_end, current_session))

                # Start new session
                current_session = [sorted_interactions[i]]
                session_start = curr_time
            else:
                # Continue current session
                current_session.append(sorted_interactions[i])

        # Add final session
        if current_session:
            session_end = sorted_interactions[-1].timestamp
            sessions.append((session_start, session_end, current_session))

        logger.info(f"Reconstructed {len(sessions)} sessions from {len(interactions)} interactions")
        return sessions

    def compare_to_baseline(
        self,
        current_metrics: PerformanceMetrics,
        baseline: StudentBaseline
    ) -> Dict[str, any]:
        """
        Compare current metrics to baseline.

        Args:
            current_metrics: Current performance metrics
            baseline: Student's baseline

        Returns:
            Dictionary with comparison results
        """
        comparison = {
            'accuracy_decline': 0.0,
            'accuracy_decline_sd': 0.0,
            'response_time_factor': 1.0,
            'response_time_deviation_sd': 0.0,
            'careless_error_increase': 0.0,
            'is_degraded': False
        }

        # Accuracy comparison
        if current_metrics.accuracy_rate is not None:
            comparison['accuracy_decline'] = baseline.avg_accuracy - current_metrics.accuracy_rate
            if baseline.std_accuracy > 0:
                comparison['accuracy_decline_sd'] = comparison['accuracy_decline'] / baseline.std_accuracy

        # Response time comparison
        if current_metrics.avg_response_time_ms is not None:
            comparison['response_time_factor'] = current_metrics.avg_response_time_ms / baseline.avg_response_time_ms
            if baseline.std_response_time_ms > 0:
                deviation = current_metrics.avg_response_time_ms - baseline.avg_response_time_ms
                comparison['response_time_deviation_sd'] = deviation / baseline.std_response_time_ms

        # Careless error comparison
        if current_metrics.careless_error_rate is not None:
            comparison['careless_error_increase'] = current_metrics.careless_error_rate - baseline.careless_error_rate

        # Overall degradation check (any metric significantly worse)
        comparison['is_degraded'] = (
            comparison['accuracy_decline'] > 0.15 or  # 15% accuracy drop
            comparison['response_time_factor'] > 1.5 or  # 1.5x slower
            comparison['careless_error_increase'] > 0.20  # 20% more careless errors
        )

        return comparison


# Example usage
if __name__ == "__main__":
    from datetime import datetime, timedelta
    import random

    # Generate sample interactions
    now = datetime.now()
    sample_interactions = []

    for i in range(30):
        interaction = Interaction(
            timestamp=now + timedelta(minutes=i * 2),
            interaction_type='quiz_answer',
            response_time_ms=random.randint(8000, 25000),
            is_correct=random.random() > 0.25,
            context_id=i
        )
        sample_interactions.append(interaction)

    # Analyze
    analyzer = BehaviorAnalyzer()

    # Calculate metrics
    metrics = analyzer.calculate_performance_metrics(sample_interactions)
    print(f"Performance Metrics:")
    print(f"  Accuracy: {metrics.accuracy_rate:.2%}" if metrics.accuracy_rate else "  Accuracy: N/A")
    print(f"  Avg Response Time: {metrics.avg_response_time_ms}ms" if metrics.avg_response_time_ms else "  Avg Response Time: N/A")
    print(f"  Total Interactions: {metrics.total_interactions}")

    # Analyze behavioral patterns
    patterns = analyzer.analyze_behavioral_patterns(
        sample_interactions,
        session_start=now,
        session_end=now + timedelta(hours=1)
    )
    print(f"\nBehavioral Patterns:")
    print(f"  Session Duration: {patterns.session_duration_minutes:.1f} min")
    print(f"  Rapid Clicks: {patterns.rapid_clicks}")
    print(f"  Hesitation Events: {patterns.hesitation_events}")

    # Calculate baseline
    baseline = analyzer.calculate_baseline(sample_interactions)
    if baseline:
        print(f"\nBaseline (from {baseline.sample_size} interactions):")
        print(f"  Avg Accuracy: {baseline.avg_accuracy:.2%}")
        print(f"  Avg Response Time: {baseline.avg_response_time_ms}ms")
