"""
Emotion Detection Service
Implements rule-based emotion classification from behavioral metrics.
Designed for Phase 1 MVP with future ML enhancement capability.
"""

import time
from typing import Dict, Tuple
from backend.models.emotion import (
    BehaviorMetrics,
    EmotionType,
    ColorMode,
    EmotionDetectionResult,
    DetectionSensitivity,
    EMOTION_TO_COLOR_MODE,
    SENSITIVITY_THRESHOLDS
)


class EmotionDetectorService:
    """
    Service for detecting emotional states from behavioral patterns.

    Phase 1: Rule-based classification
    Phase 2: ML-enhanced classification (future)
    """

    def __init__(self, algorithm_version: str = "1.0"):
        self.algorithm_version = algorithm_version

    def classify_emotion(
        self,
        metrics: BehaviorMetrics,
        sensitivity: DetectionSensitivity = DetectionSensitivity.MEDIUM
    ) -> EmotionDetectionResult:
        """
        Classify emotional state based on behavioral metrics.

        Args:
            metrics: BehaviorMetrics object with interaction data
            sensitivity: Detection sensitivity level

        Returns:
            EmotionDetectionResult with detected emotion and confidence
        """
        start_time = time.time()

        # Calculate emotion scores
        stressed_score = self._calculate_stressed_score(metrics)
        engaged_score = self._calculate_engaged_score(metrics)
        tired_score = self._calculate_tired_score(metrics)
        calm_score = self._calculate_calm_score(metrics)

        # Compile all scores
        all_scores = {
            EmotionType.STRESSED.value: round(stressed_score, 3),
            EmotionType.ENGAGED.value: round(engaged_score, 3),
            EmotionType.TIRED.value: round(tired_score, 3),
            EmotionType.CALM.value: round(calm_score, 3)
        }

        # Determine dominant emotion
        dominant_emotion = max(all_scores, key=all_scores.get)
        confidence = all_scores[dominant_emotion]

        # If no strong signal, default to calm
        if confidence < 0.4:
            dominant_emotion = EmotionType.CALM.value
            confidence = 0.5

        # Convert to EmotionType enum
        detected_emotion = EmotionType(dominant_emotion)

        # Get recommended color mode
        recommended_mode = EMOTION_TO_COLOR_MODE[detected_emotion]

        # Determine if mode switch should happen based on sensitivity
        confidence_threshold = SENSITIVITY_THRESHOLDS[sensitivity]
        should_switch = confidence >= confidence_threshold

        # Generate human-readable reason
        reason = self._generate_reason(detected_emotion, metrics, confidence)

        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)

        return EmotionDetectionResult(
            detected_emotion=detected_emotion,
            confidence=round(confidence, 2),
            recommended_mode=recommended_mode,
            should_switch=should_switch,
            reason=reason,
            all_scores=all_scores,
            processing_time_ms=processing_time_ms,
            algorithm_version=self.algorithm_version
        )

    def _calculate_stressed_score(self, metrics: BehaviorMetrics) -> float:
        """
        Calculate stress/frustration indicators.

        Stressed indicators:
        - High error rate (> 30%)
        - Multiple retries (> 3)
        - Very rapid clicking (< 1.5s intervals)
        - Low task completion (< 50%)
        """
        score = 0.0

        # High error rate
        if metrics.error_rate > 0.4:
            score += 0.5
        elif metrics.error_rate > 0.3:
            score += 0.4
        elif metrics.error_rate > 0.2:
            score += 0.2

        # Multiple retries
        if metrics.retry_count > 5:
            score += 0.4
        elif metrics.retry_count > 3:
            score += 0.3
        elif metrics.retry_count > 1:
            score += 0.15

        # Rapid, erratic clicking
        if metrics.avg_click_interval < 1.0:
            score += 0.3
        elif metrics.avg_click_interval < 1.5:
            score += 0.2

        # Low task completion
        if metrics.task_completion_rate < 0.3:
            score += 0.2
        elif metrics.task_completion_rate < 0.5:
            score += 0.1

        # Extended idle time after errors (frustration break)
        if metrics.idle_time_seconds > 180 and metrics.error_rate > 0.2:
            score += 0.15

        return min(score, 1.0)

    def _calculate_engaged_score(self, metrics: BehaviorMetrics) -> float:
        """
        Calculate engagement/focus indicators.

        Engaged indicators:
        - Steady click intervals (1.5-4s)
        - High task completion (> 80%)
        - Low error rate (< 15%)
        - Sustained session (> 10 min) with minimal idle
        """
        score = 0.0

        # Steady, focused interaction pace
        if 1.5 <= metrics.avg_click_interval <= 4.0:
            score += 0.35
        elif 1.0 <= metrics.avg_click_interval <= 5.0:
            score += 0.2

        # High task completion
        if metrics.task_completion_rate > 0.9:
            score += 0.35
        elif metrics.task_completion_rate > 0.8:
            score += 0.3
        elif metrics.task_completion_rate > 0.7:
            score += 0.15

        # Low error rate
        if metrics.error_rate < 0.1:
            score += 0.25
        elif metrics.error_rate < 0.15:
            score += 0.2
        elif metrics.error_rate < 0.2:
            score += 0.1

        # Sustained engagement (good session duration with low idle)
        if metrics.session_duration_minutes > 15 and metrics.idle_time_seconds < 90:
            score += 0.25
        elif metrics.session_duration_minutes > 10 and metrics.idle_time_seconds < 120:
            score += 0.15

        # Few retries (confident progress)
        if metrics.retry_count == 0:
            score += 0.1
        elif metrics.retry_count <= 1:
            score += 0.05

        return min(score, 1.0)

    def _calculate_tired_score(self, metrics: BehaviorMetrics) -> float:
        """
        Calculate tiredness/disengagement indicators.

        Tired indicators:
        - Very slow interactions (> 10s intervals)
        - Extended idle periods (> 2 min)
        - Short session duration (< 5 min)
        - Low task completion
        """
        score = 0.0

        # Very slow response times
        if metrics.avg_click_interval > 15:
            score += 0.5
        elif metrics.avg_click_interval > 10:
            score += 0.4
        elif metrics.avg_click_interval > 7:
            score += 0.2

        # Extended idle time
        if metrics.idle_time_seconds > 300:  # 5 minutes
            score += 0.4
        elif metrics.idle_time_seconds > 180:  # 3 minutes
            score += 0.3
        elif metrics.idle_time_seconds > 120:  # 2 minutes
            score += 0.2

        # Low task completion
        if metrics.task_completion_rate < 0.3:
            score += 0.25
        elif metrics.task_completion_rate < 0.4:
            score += 0.15

        # Short session (quick disengagement)
        if metrics.session_duration_minutes < 3 and metrics.idle_time_seconds > 60:
            score += 0.3
        elif metrics.session_duration_minutes < 5:
            score += 0.15

        # Low interaction volume (minimal engagement)
        # Implied by high avg_click_interval and high idle time

        return min(score, 1.0)

    def _calculate_calm_score(self, metrics: BehaviorMetrics) -> float:
        """
        Calculate calm/focused state indicators (default baseline).

        Calm indicators:
        - Moderate click intervals (2-5s)
        - Moderate task completion (50-80%)
        - Moderate error rate (10-20%)
        - Reasonable idle time (30-90s)
        """
        score = 0.0

        # Moderate, steady pace
        if 2.0 <= metrics.avg_click_interval <= 5.0:
            score += 0.35
        elif 1.5 <= metrics.avg_click_interval <= 6.0:
            score += 0.2

        # Moderate task completion (working steadily, not rushed)
        if 0.6 <= metrics.task_completion_rate <= 0.85:
            score += 0.3
        elif 0.5 <= metrics.task_completion_rate <= 0.9:
            score += 0.2

        # Acceptable error rate (some mistakes are normal)
        if 0.08 <= metrics.error_rate <= 0.18:
            score += 0.25
        elif 0.05 <= metrics.error_rate <= 0.25:
            score += 0.15

        # Reasonable idle time (thinking, not stuck)
        if 30 <= metrics.idle_time_seconds <= 90:
            score += 0.2
        elif 20 <= metrics.idle_time_seconds <= 120:
            score += 0.1

        # Moderate session duration (engaged but not exhausted)
        if 8 <= metrics.session_duration_minutes <= 25:
            score += 0.15

        # Low retry count (steady progress)
        if metrics.retry_count <= 2:
            score += 0.1

        return min(score, 1.0)

    def _generate_reason(
        self,
        emotion: EmotionType,
        metrics: BehaviorMetrics,
        confidence: float
    ) -> str:
        """
        Generate human-readable explanation for detected emotion.

        Args:
            emotion: Detected emotion type
            metrics: Behavioral metrics used
            confidence: Confidence score

        Returns:
            Human-readable reason string
        """
        if emotion == EmotionType.STRESSED:
            reasons = []
            if metrics.error_rate > 0.3:
                reasons.append("high error rate")
            if metrics.retry_count > 3:
                reasons.append("multiple retry attempts")
            if metrics.avg_click_interval < 1.5:
                reasons.append("rapid clicking")
            if metrics.task_completion_rate < 0.5:
                reasons.append("low completion rate")

            if reasons:
                return f"Stress detected: {', '.join(reasons)}"
            return "Frustration indicators detected"

        elif emotion == EmotionType.ENGAGED:
            reasons = []
            if metrics.task_completion_rate > 0.8:
                reasons.append("high completion rate")
            if metrics.error_rate < 0.15:
                reasons.append("low error rate")
            if 1.5 <= metrics.avg_click_interval <= 4.0:
                reasons.append("steady pace")

            if reasons:
                return f"Engaged learning: {', '.join(reasons)}"
            return "Strong engagement detected"

        elif emotion == EmotionType.TIRED:
            reasons = []
            if metrics.avg_click_interval > 10:
                reasons.append("slow response times")
            if metrics.idle_time_seconds > 180:
                reasons.append("extended idle periods")
            if metrics.session_duration_minutes < 5:
                reasons.append("brief session")

            if reasons:
                return f"Disengagement detected: {', '.join(reasons)}"
            return "Low energy indicators"

        else:  # CALM
            return "Steady, focused learning state"

    def recommend_color_mode(
        self,
        detection_result: EmotionDetectionResult,
        current_mode: ColorMode,
        preferences: 'StudentColorPreferences' = None
    ) -> Tuple[ColorMode, bool, str]:
        """
        Recommend color mode based on detected emotion and preferences.

        Args:
            detection_result: EmotionDetectionResult from classify_emotion
            current_mode: Current color mode
            preferences: Optional student preferences

        Returns:
            Tuple of (recommended_mode, should_switch, reason)
        """
        recommended_mode = detection_result.recommended_mode

        # Check if mode is disabled by user preferences
        if preferences and recommended_mode in preferences.disabled_modes:
            # Use preferred default instead
            recommended_mode = preferences.preferred_default_mode
            reason = f"Recommended mode disabled by preference, using {recommended_mode.value}"
            should_switch = recommended_mode != current_mode
            return recommended_mode, should_switch, reason

        # Check if already in recommended mode
        if recommended_mode == current_mode:
            return recommended_mode, False, "Already in optimal mode"

        # Check confidence threshold based on sensitivity
        if not detection_result.should_switch:
            return current_mode, False, f"Confidence {detection_result.confidence:.2f} below threshold"

        # Recommend switch
        reason = f"{detection_result.reason} (confidence: {detection_result.confidence:.2f})"
        return recommended_mode, True, reason


# Singleton instance
_detector_instance = None


def get_emotion_detector() -> EmotionDetectorService:
    """Get singleton instance of EmotionDetectorService"""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = EmotionDetectorService()
    return _detector_instance
