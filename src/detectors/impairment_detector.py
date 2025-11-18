"""
Impairment Detection Engine

This module implements the core algorithm for detecting impaired judgment
in students based on behavioral patterns and performance degradation.

The detector analyzes:
- Performance degradation (accuracy decline, slower responses)
- Behavioral patterns (rapid clicking, hesitation, confusion)
- Session duration (fatigue from extended study)
- Error patterns (careless vs. conceptual errors)
"""

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from decimal import Decimal
import statistics
import logging

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Performance metrics for a student session."""
    accuracy_rate: Optional[float] = None
    avg_response_time_ms: Optional[int] = None
    std_response_time_ms: Optional[float] = None
    careless_error_rate: Optional[float] = None
    total_interactions: int = 0
    correct_answers: int = 0
    incorrect_answers: int = 0
    careless_errors: int = 0


@dataclass
class BehavioralPatterns:
    """Behavioral pattern indicators."""
    rapid_clicks: int = 0  # Answers submitted very quickly
    hesitation_events: int = 0  # Unusually long pauses
    navigation_confusion: int = 0  # Excessive back/forward navigation
    session_duration_minutes: float = 0.0
    interaction_rate_per_minute: float = 0.0


@dataclass
class StudentBaseline:
    """Student's baseline performance metrics."""
    avg_accuracy: float = 0.80
    std_accuracy: float = 0.10
    avg_response_time_ms: int = 12000
    std_response_time_ms: int = 5000
    careless_error_rate: float = 0.15
    sample_size: int = 0


@dataclass
class ImpairmentResult:
    """Result of impairment assessment."""
    impairment_score: float  # 0-100
    confidence: float  # 0-1
    status: str  # optimal, early_warning, moderate, severe
    triggers: List[str] = field(default_factory=list)
    recommendation: str = ""

    # Component scores (for debugging/analysis)
    accuracy_decline_score: float = 0.0
    response_time_score: float = 0.0
    error_pattern_score: float = 0.0
    behavioral_score: float = 0.0


class ImpairmentDetector:
    """
    Detects impaired judgment based on behavioral and performance analysis.

    The detector uses a weighted scoring system:
    - Performance degradation: 30% (accuracy decline)
    - Response time increase: 25%
    - Careless errors: 20%
    - Behavioral patterns: 25%
    """

    # Weights for different indicators
    WEIGHT_ACCURACY = 0.30
    WEIGHT_RESPONSE_TIME = 0.25
    WEIGHT_ERROR_PATTERN = 0.20
    WEIGHT_BEHAVIORAL = 0.25

    # Thresholds for detection
    ACCURACY_DECLINE_THRESHOLD = 0.20  # 20% decline
    RESPONSE_TIME_FACTOR_THRESHOLD = 1.50  # 1.5x slower
    CARELESS_ERROR_THRESHOLD = 0.30  # 30% careless errors
    SESSION_DURATION_WARNING = 90  # minutes
    RAPID_CLICK_THRESHOLD = 5000  # ms (answer submitted in <5 sec)

    # Impairment status thresholds
    STATUS_THRESHOLDS = {
        'severe': 71,
        'moderate': 51,
        'early_warning': 31,
        'optimal': 0
    }

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize impairment detector.

        Args:
            config: Optional configuration overrides
        """
        self.config = config or {}
        self._apply_config()
        logger.info("ImpairmentDetector initialized")

    def _apply_config(self):
        """Apply configuration overrides."""
        if 'thresholds' in self.config:
            t = self.config['thresholds']
            self.ACCURACY_DECLINE_THRESHOLD = t.get('accuracy_decline', self.ACCURACY_DECLINE_THRESHOLD)
            self.RESPONSE_TIME_FACTOR_THRESHOLD = t.get('response_time_increase', self.RESPONSE_TIME_FACTOR_THRESHOLD)
            self.CARELESS_ERROR_THRESHOLD = t.get('careless_error_rate', self.CARELESS_ERROR_THRESHOLD)
            self.SESSION_DURATION_WARNING = t.get('session_duration_warning', self.SESSION_DURATION_WARNING) // 60  # Convert to minutes

    def assess_impairment(
        self,
        current_metrics: PerformanceMetrics,
        baseline: StudentBaseline,
        behavioral_patterns: BehavioralPatterns,
        assessment_window_minutes: int = 30
    ) -> ImpairmentResult:
        """
        Assess student impairment level.

        Args:
            current_metrics: Current performance metrics
            baseline: Student's baseline performance
            behavioral_patterns: Detected behavioral patterns
            assessment_window_minutes: Time window for assessment

        Returns:
            ImpairmentResult with score, status, and recommendations
        """
        # Calculate individual component scores
        accuracy_score = self._calculate_accuracy_decline_score(current_metrics, baseline)
        response_time_score = self._calculate_response_time_score(current_metrics, baseline)
        error_pattern_score = self._calculate_error_pattern_score(current_metrics, baseline)
        behavioral_score = self._calculate_behavioral_score(behavioral_patterns)

        # Calculate weighted total score
        total_score = (
            accuracy_score * self.WEIGHT_ACCURACY +
            response_time_score * self.WEIGHT_RESPONSE_TIME +
            error_pattern_score * self.WEIGHT_ERROR_PATTERN +
            behavioral_score * self.WEIGHT_BEHAVIORAL
        )

        # Clamp to 0-100
        total_score = max(0, min(100, total_score))

        # Calculate confidence based on data quantity
        confidence = self._calculate_confidence(current_metrics, assessment_window_minutes)

        # Determine status
        status = self._get_status(total_score)

        # Collect triggers
        triggers = self._collect_triggers(
            current_metrics, baseline, behavioral_patterns,
            accuracy_score, response_time_score, error_pattern_score, behavioral_score
        )

        # Generate recommendation
        recommendation = self._generate_recommendation(status, triggers, behavioral_patterns)

        result = ImpairmentResult(
            impairment_score=round(total_score, 2),
            confidence=round(confidence, 2),
            status=status,
            triggers=triggers,
            recommendation=recommendation,
            accuracy_decline_score=round(accuracy_score, 2),
            response_time_score=round(response_time_score, 2),
            error_pattern_score=round(error_pattern_score, 2),
            behavioral_score=round(behavioral_score, 2)
        )

        logger.info(f"Impairment assessment: score={result.impairment_score}, status={result.status}, confidence={result.confidence}")
        return result

    def _calculate_accuracy_decline_score(
        self,
        current: PerformanceMetrics,
        baseline: StudentBaseline
    ) -> float:
        """
        Calculate score based on accuracy decline.

        Returns: 0-100 score (0=no decline, 100=severe decline)
        """
        if current.accuracy_rate is None or baseline.avg_accuracy == 0:
            return 0.0

        decline = baseline.avg_accuracy - current.accuracy_rate

        if decline < self.ACCURACY_DECLINE_THRESHOLD:
            return 0.0

        # Scale decline: 20% decline = 50 points, 40% decline = 100 points
        score = (decline / 0.40) * 100
        return min(score, 100.0)

    def _calculate_response_time_score(
        self,
        current: PerformanceMetrics,
        baseline: StudentBaseline
    ) -> float:
        """
        Calculate score based on response time increase.

        Returns: 0-100 score (0=normal, 100=extremely slow)
        """
        if current.avg_response_time_ms is None or baseline.avg_response_time_ms == 0:
            return 0.0

        factor = current.avg_response_time_ms / baseline.avg_response_time_ms

        if factor < self.RESPONSE_TIME_FACTOR_THRESHOLD:
            return 0.0

        # Scale factor: 1.5x = 25 points, 3.0x = 100 points
        score = ((factor - 1.0) / 2.0) * 100
        return min(score, 100.0)

    def _calculate_error_pattern_score(
        self,
        current: PerformanceMetrics,
        baseline: StudentBaseline
    ) -> float:
        """
        Calculate score based on careless error rate increase.

        Returns: 0-100 score (0=normal, 100=high careless errors)
        """
        if current.careless_error_rate is None:
            return 0.0

        if current.careless_error_rate < self.CARELESS_ERROR_THRESHOLD:
            return 0.0

        # Scale careless error rate: 30% = 50 points, 60% = 100 points
        score = (current.careless_error_rate / 0.60) * 100
        return min(score, 100.0)

    def _calculate_behavioral_score(
        self,
        patterns: BehavioralPatterns
    ) -> float:
        """
        Calculate score based on behavioral patterns.

        Returns: 0-100 score (0=normal, 100=highly concerning behavior)
        """
        score = 0.0

        # Rapid clicking (answering too quickly)
        if patterns.rapid_clicks > 3:
            score += min((patterns.rapid_clicks / 10) * 40, 40)

        # Hesitation events
        if patterns.hesitation_events > 2:
            score += min((patterns.hesitation_events / 5) * 30, 30)

        # Navigation confusion
        if patterns.navigation_confusion > 5:
            score += min((patterns.navigation_confusion / 10) * 30, 30)

        # Extended session duration
        if patterns.session_duration_minutes > self.SESSION_DURATION_WARNING:
            excess_minutes = patterns.session_duration_minutes - self.SESSION_DURATION_WARNING
            score += min((excess_minutes / 60) * 40, 40)  # 60 extra minutes = max score

        return min(score, 100.0)

    def _calculate_confidence(
        self,
        metrics: PerformanceMetrics,
        window_minutes: int
    ) -> float:
        """
        Calculate confidence in assessment based on data quantity.

        Returns: 0-1 confidence score
        """
        # Need at least 10 interactions for full confidence
        data_points = metrics.total_interactions
        data_confidence = min(data_points / 10, 1.0)

        # Longer assessment windows increase confidence
        time_confidence = min(window_minutes / 30, 1.0)

        # Combined confidence (weighted average)
        confidence = (data_confidence * 0.7 + time_confidence * 0.3)
        return confidence

    def _get_status(self, score: float) -> str:
        """
        Determine impairment status from score.

        Args:
            score: Impairment score (0-100)

        Returns:
            Status string: optimal, early_warning, moderate, severe
        """
        if score >= self.STATUS_THRESHOLDS['severe']:
            return 'severe'
        elif score >= self.STATUS_THRESHOLDS['moderate']:
            return 'moderate'
        elif score >= self.STATUS_THRESHOLDS['early_warning']:
            return 'early_warning'
        else:
            return 'optimal'

    def _collect_triggers(
        self,
        current: PerformanceMetrics,
        baseline: StudentBaseline,
        patterns: BehavioralPatterns,
        accuracy_score: float,
        response_time_score: float,
        error_score: float,
        behavioral_score: float
    ) -> List[str]:
        """
        Collect specific triggers that contributed to impairment score.

        Returns:
            List of trigger description strings
        """
        triggers = []

        # Accuracy decline
        if accuracy_score > 0 and current.accuracy_rate is not None:
            decline_pct = (baseline.avg_accuracy - current.accuracy_rate) * 100
            triggers.append(f"Accuracy declined by {decline_pct:.1f}%")

        # Response time increase
        if response_time_score > 0 and current.avg_response_time_ms is not None:
            factor = current.avg_response_time_ms / baseline.avg_response_time_ms
            triggers.append(f"Response time {factor:.1f}x slower than baseline")

        # Careless errors
        if error_score > 0 and current.careless_error_rate is not None:
            triggers.append(f"Careless errors: {current.careless_error_rate*100:.1f}% of total")

        # Behavioral patterns
        if patterns.rapid_clicks > 3:
            triggers.append(f"{patterns.rapid_clicks} rapid answer submissions detected")

        if patterns.hesitation_events > 2:
            triggers.append(f"{patterns.hesitation_events} unusual hesitation events")

        if patterns.navigation_confusion > 5:
            triggers.append(f"Navigation confusion: {patterns.navigation_confusion} events")

        if patterns.session_duration_minutes > self.SESSION_DURATION_WARNING:
            triggers.append(f"Extended study session: {patterns.session_duration_minutes:.0f} minutes without break")

        return triggers

    def _generate_recommendation(
        self,
        status: str,
        triggers: List[str],
        patterns: BehavioralPatterns
    ) -> str:
        """
        Generate recommendation based on assessment.

        Args:
            status: Impairment status
            triggers: List of trigger descriptions
            patterns: Behavioral patterns

        Returns:
            Recommendation string
        """
        if status == 'optimal':
            return "Student is performing well. No intervention needed."

        elif status == 'early_warning':
            if patterns.session_duration_minutes > 60:
                return "Consider suggesting a 5-minute break soon. Student may be experiencing early fatigue."
            else:
                return "Monitor student closely. Early signs of difficulty detected."

        elif status == 'moderate':
            if patterns.session_duration_minutes > self.SESSION_DURATION_WARNING:
                return "Recommend 10-15 minute break immediately. Student showing signs of cognitive fatigue."
            elif any('careless' in t.lower() for t in triggers):
                return "Student making careless errors. Suggest slowing down and reviewing answers carefully."
            else:
                return "Intervention recommended. Student may need assistance or a break."

        elif status == 'severe':
            return "IMMEDIATE ACTION NEEDED: Student showing severe signs of impairment. Recommend mandatory break or teacher intervention."

        return "Monitor student performance."

    def should_alert_teacher(self, result: ImpairmentResult, min_confidence: float = 0.5) -> Tuple[bool, str]:
        """
        Determine if teacher should be alerted.

        Args:
            result: Impairment assessment result
            min_confidence: Minimum confidence level to trigger alert

        Returns:
            Tuple of (should_alert, alert_level)
            alert_level: 'info', 'warning', 'critical'
        """
        if result.confidence < min_confidence:
            return False, ''

        if result.status == 'severe':
            return True, 'critical'
        elif result.status == 'moderate':
            return True, 'warning'
        elif result.status == 'early_warning':
            return True, 'info'
        else:
            return False, ''
