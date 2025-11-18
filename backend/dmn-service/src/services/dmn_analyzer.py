"""
DMN Analyzer Service
Core logic for analyzing student behavior and determining DMN status
"""
from typing import List, Tuple
from datetime import datetime, timedelta
import numpy as np
from collections import defaultdict

from ..models.dmn_models import (
    InteractionEvent,
    EventType,
    BehavioralMetrics,
    DMNStatus,
    DMNStatusResponse,
    DMNAnalysisRequest,
)


class DMNAnalyzer:
    """
    Analyzes student interaction patterns to determine DMN activation status.

    DMN (Default Mode Network) is inversely related to focused attention.
    When DMN is LOW (deactivated), the student is in deep focus.
    When DMN is HIGH (activated), the student's mind is wandering.

    For user clarity, we report the inverse:
    - "Deep Focus" = DMN deactivated (optimal learning)
    - "Wandering" = DMN activated (mind drifting)
    """

    # Threshold configuration
    THRESHOLDS = {
        'deep_focus': 0.75,      # Engagement score >= 0.75
        'active_learning': 0.55,  # Engagement score >= 0.55
        'wandering': 0.35,        # Engagement score >= 0.35
        # Below 0.35 = disengaged
    }

    # Weight factors for different behaviors
    WEIGHTS = {
        'interaction_frequency': 0.30,
        'mouse_intensity': 0.15,
        'keyboard_activity': 0.20,
        'page_focus': 0.20,
        'click_patterns': 0.10,
        'scroll_activity': 0.05,
    }

    def __init__(self):
        self.event_cache = defaultdict(list)

    def analyze(self, request: DMNAnalysisRequest) -> DMNStatusResponse:
        """
        Main analysis function to determine DMN status from interaction events.

        Args:
            request: Analysis request containing events and parameters

        Returns:
            DMNStatusResponse with status, confidence, and metrics
        """
        # Calculate behavioral metrics
        metrics = self._calculate_metrics(
            request.events,
            request.analysis_window_seconds
        )

        # Calculate engagement score
        engagement_score, confidence = self._calculate_engagement_score(metrics)

        # Determine DMN status
        status = self._determine_status(engagement_score)

        # Create response
        return DMNStatusResponse(
            student_id=request.student_id,
            session_id=request.session_id,
            course_id=request.course_id,
            status=status,
            color_code="",  # Will be auto-set by validator
            confidence_score=confidence,
            metrics=metrics,
            analysis_window_seconds=request.analysis_window_seconds,
            metadata={
                'engagement_score': round(engagement_score, 3),
                'analysis_method': 'behavioral_pattern_v1'
            }
        )

    def _calculate_metrics(
        self,
        events: List[InteractionEvent],
        window_seconds: int
    ) -> BehavioralMetrics:
        """Calculate behavioral metrics from raw events"""

        if not events:
            return BehavioralMetrics()

        # Sort events by timestamp
        sorted_events = sorted(events, key=lambda e: e.timestamp)

        # Count event types
        event_counts = defaultdict(int)
        for event in sorted_events:
            event_counts[event.event_type] += 1

        # Calculate interaction count
        interaction_count = len(sorted_events)

        # Mouse movement intensity (0.0 to 1.0)
        mouse_events = event_counts[EventType.MOUSE_MOVE]
        mouse_intensity = min(1.0, mouse_events / (window_seconds * 2))  # ~2 moves/sec = high

        # Keyboard activity rate (keypress per second)
        keyboard_events = event_counts[EventType.KEYPRESS]
        keyboard_rate = keyboard_events / window_seconds if window_seconds > 0 else 0

        # Page focus duration
        focus_events = [e for e in sorted_events if e.event_type == EventType.FOCUS]
        blur_events = [e for e in sorted_events if e.event_type == EventType.BLUR]

        # Estimate focus time (simplified)
        if focus_events:
            focus_duration = window_seconds  # Assume focused if focus events present
            if blur_events:
                # Calculate time between last focus and first blur
                last_focus = max(e.timestamp for e in focus_events)
                first_blur = min(e.timestamp for e in blur_events if e.timestamp > last_focus)
                focus_duration = min(window_seconds, (first_blur - last_focus).total_seconds())
        else:
            focus_duration = 0

        # Idle time calculation
        if len(sorted_events) >= 2:
            # Find longest gap between events
            gaps = []
            for i in range(1, len(sorted_events)):
                gap = (sorted_events[i].timestamp - sorted_events[i-1].timestamp).total_seconds()
                gaps.append(gap)
            idle_time = int(max(gaps)) if gaps else 0
        else:
            idle_time = window_seconds if len(sorted_events) == 0 else 0

        # Click frequency (clicks per minute)
        click_events = event_counts[EventType.CLICK]
        click_frequency = (click_events / window_seconds) * 60 if window_seconds > 0 else 0

        # Scroll activity (scrolls per minute)
        scroll_events = event_counts[EventType.SCROLL]
        scroll_activity = (scroll_events / window_seconds) * 60 if window_seconds > 0 else 0

        return BehavioralMetrics(
            interaction_count=interaction_count,
            mouse_movement_intensity=round(mouse_intensity, 3),
            keyboard_activity_rate=round(keyboard_rate, 3),
            page_focus_duration=int(focus_duration),
            idle_time_seconds=idle_time,
            click_frequency=round(click_frequency, 2),
            scroll_activity=round(scroll_activity, 2),
        )

    def _calculate_engagement_score(
        self,
        metrics: BehavioralMetrics
    ) -> Tuple[float, float]:
        """
        Calculate overall engagement score and confidence.

        Returns:
            Tuple of (engagement_score, confidence_score)
        """

        # Normalize metrics to 0-1 scale

        # Interaction frequency score (30+ interactions in 30s = high)
        interaction_score = min(1.0, metrics.interaction_count / 30)

        # Mouse intensity (already 0-1)
        mouse_score = metrics.mouse_movement_intensity

        # Keyboard activity (2+ keypress/sec = high engagement for typing tasks)
        keyboard_score = min(1.0, metrics.keyboard_activity_rate / 2.0)

        # Page focus score (focused entire window = 1.0)
        focus_score = metrics.page_focus_duration / 30  # Assume 30s window

        # Click pattern score (5-15 clicks/min is optimal, too few or too many is suspicious)
        if 5 <= metrics.click_frequency <= 15:
            click_score = 1.0
        elif metrics.click_frequency < 5:
            click_score = metrics.click_frequency / 5
        else:
            click_score = max(0.5, 1.0 - (metrics.click_frequency - 15) / 30)

        # Scroll activity (some scrolling is good, but not excessive)
        if 3 <= metrics.scroll_activity <= 12:
            scroll_score = 1.0
        elif metrics.scroll_activity < 3:
            scroll_score = metrics.scroll_activity / 3
        else:
            scroll_score = max(0.3, 1.0 - (metrics.scroll_activity - 12) / 20)

        # Idle time penalty
        idle_penalty = 1.0 - min(1.0, metrics.idle_time_seconds / 15)  # 15s idle = max penalty

        # Weighted engagement score
        engagement_score = (
            self.WEIGHTS['interaction_frequency'] * interaction_score +
            self.WEIGHTS['mouse_intensity'] * mouse_score +
            self.WEIGHTS['keyboard_activity'] * keyboard_score +
            self.WEIGHTS['page_focus'] * focus_score +
            self.WEIGHTS['click_patterns'] * click_score +
            self.WEIGHTS['scroll_activity'] * scroll_score
        ) * idle_penalty

        # Calculate confidence based on data quality
        confidence = self._calculate_confidence(metrics)

        return engagement_score, confidence

    def _calculate_confidence(self, metrics: BehavioralMetrics) -> float:
        """
        Calculate confidence in the analysis based on data quality.

        More interactions = higher confidence
        """
        # Base confidence on interaction count
        if metrics.interaction_count >= 20:
            base_confidence = 0.9
        elif metrics.interaction_count >= 10:
            base_confidence = 0.75
        elif metrics.interaction_count >= 5:
            base_confidence = 0.6
        else:
            base_confidence = 0.4

        # Reduce confidence if mostly one type of event
        event_diversity = 1.0
        if metrics.interaction_count > 0:
            # If 80%+ are just mouse moves, reduce confidence
            mouse_ratio = (metrics.mouse_movement_intensity * 60) / max(1, metrics.interaction_count)
            if mouse_ratio > 0.8:
                event_diversity = 0.7

        confidence = base_confidence * event_diversity

        return round(confidence, 3)

    def _determine_status(self, engagement_score: float) -> DMNStatus:
        """
        Determine DMN status from engagement score.

        High engagement = DMN deactivated = Deep Focus
        Low engagement = DMN activated = Wandering/Disengaged
        """
        if engagement_score >= self.THRESHOLDS['deep_focus']:
            return DMNStatus.DEEP_FOCUS
        elif engagement_score >= self.THRESHOLDS['active_learning']:
            return DMNStatus.ACTIVE_LEARNING
        elif engagement_score >= self.THRESHOLDS['wandering']:
            return DMNStatus.WANDERING
        else:
            return DMNStatus.DISENGAGED

    def update_thresholds(
        self,
        deep_focus: float = None,
        active_learning: float = None,
        wandering: float = None
    ):
        """Update threshold values for custom tuning"""
        if deep_focus is not None:
            self.THRESHOLDS['deep_focus'] = deep_focus
        if active_learning is not None:
            self.THRESHOLDS['active_learning'] = active_learning
        if wandering is not None:
            self.THRESHOLDS['wandering'] = wandering


# Singleton instance
dmn_analyzer = DMNAnalyzer()
