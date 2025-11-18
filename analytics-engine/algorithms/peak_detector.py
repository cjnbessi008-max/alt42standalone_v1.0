"""
Peak Thinking Period Detection Algorithm

This module implements the core algorithm for detecting "peak thinking periods"
based on learning activity data.

Peak Thinking Period Criteria:
1. Duration: 30 seconds to 5 minutes
2. Event Rate: 0.5 to 3.0 events per second
3. Focus: Maximum idle time < 10 seconds
4. Efficiency: Progress/time ratio > 0.6
"""

import logging
from typing import List, Dict, Tuple, Any
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class DetectionConfig:
    """Configuration parameters for peak detection"""
    min_duration_sec: float = 30.0
    max_duration_sec: float = 300.0
    min_event_rate: float = 0.5
    max_event_rate: float = 3.0
    max_idle_sec: float = 10.0
    efficiency_threshold: float = 0.6
    min_events_for_peak: int = 15
    window_size_sec: float = 60.0  # Sliding window size

class PeakThinkingDetector:
    """Detector for peak thinking periods in learning sessions"""

    def __init__(self, config: DetectionConfig = None):
        self.config = config or DetectionConfig()
        logger.info(f"PeakThinkingDetector initialized with config: {self.config}")

    def detect_peaks(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Main method to detect peak thinking periods from events

        Args:
            events: List of learning events sorted by timestamp

        Returns:
            List of detected peak periods with metrics
        """
        if not events or len(events) < self.config.min_events_for_peak:
            logger.info(f"Insufficient events for analysis: {len(events) if events else 0}")
            return []

        # Sort events by timestamp
        events = sorted(events, key=lambda e: e['timestamp'])

        # Find candidate periods using sliding window
        candidate_periods = self._find_candidate_periods(events)

        # Analyze each candidate period
        peak_periods = []
        for period in candidate_periods:
            metrics = self._calculate_period_metrics(period['events'])

            # Check if period meets peak criteria
            if self._is_peak_period(metrics):
                peak_data = {
                    'period_start': period['start'],
                    'period_end': period['end'],
                    'duration_sec': (period['end'] - period['start']).total_seconds(),
                    'events': period['events'],
                    **metrics
                }
                peak_periods.append(peak_data)

        # Merge overlapping peaks
        merged_peaks = self._merge_overlapping_peaks(peak_periods)

        logger.info(f"Detected {len(merged_peaks)} peak periods from {len(events)} events")
        return merged_peaks

    def _find_candidate_periods(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Find candidate periods using activity clustering"""
        if not events:
            return []

        candidates = []
        current_period_events = []
        current_period_start = None

        for i, event in enumerate(events):
            timestamp = event['timestamp']

            if not current_period_start:
                # Start new period
                current_period_start = timestamp
                current_period_events = [event]
                continue

            # Calculate time since last event
            time_since_last = (timestamp - events[i-1]['timestamp']).total_seconds()

            if time_since_last > self.config.max_idle_sec:
                # End current period due to idle time
                if len(current_period_events) >= self.config.min_events_for_peak:
                    candidates.append({
                        'start': current_period_start,
                        'end': events[i-1]['timestamp'],
                        'events': current_period_events.copy()
                    })

                # Start new period
                current_period_start = timestamp
                current_period_events = [event]
            else:
                # Continue current period
                current_period_events.append(event)

                # Check if period is getting too long
                duration = (timestamp - current_period_start).total_seconds()
                if duration > self.config.max_duration_sec:
                    # Split the period
                    if len(current_period_events) >= self.config.min_events_for_peak:
                        candidates.append({
                            'start': current_period_start,
                            'end': timestamp,
                            'events': current_period_events.copy()
                        })

                    # Start new period from midpoint
                    midpoint = len(current_period_events) // 2
                    current_period_events = current_period_events[midpoint:]
                    current_period_start = current_period_events[0]['timestamp']

        # Add last period if valid
        if current_period_events and len(current_period_events) >= self.config.min_events_for_peak:
            candidates.append({
                'start': current_period_start,
                'end': current_period_events[-1]['timestamp'],
                'events': current_period_events
            })

        return candidates

    def _calculate_period_metrics(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate metrics for a period"""
        if not events:
            return {}

        # Basic statistics
        start_time = events[0]['timestamp']
        end_time = events[-1]['timestamp']
        duration_sec = (end_time - start_time).total_seconds()

        event_count = len(events)
        event_rate = event_count / duration_sec if duration_sec > 0 else 0

        # Event type counts
        click_count = sum(1 for e in events if e['event_type'] == 'click')
        input_count = sum(1 for e in events if e['event_type'] in ['input', 'keypress'])
        modification_count = sum(1 for e in events if e.get('event_action') in ['answer_change', 'delete_input', 'modification'])

        # Calculate idle times
        idle_times = []
        for i in range(1, len(events)):
            idle = (events[i]['timestamp'] - events[i-1]['timestamp']).total_seconds()
            idle_times.append(idle)

        max_idle_sec = max(idle_times) if idle_times else 0
        avg_response_time_ms = int(np.mean(idle_times) * 1000) if idle_times else 0

        # Calculate interaction intensity (weighted by event type)
        event_weights = {
            'click': 1.0,
            'input': 1.5,
            'keypress': 1.5,
            'submit': 2.0,
            'modification': 1.8,
            'focus': 0.5,
            'blur': 0.3,
        }

        total_weight = sum(event_weights.get(e['event_type'], 1.0) for e in events)
        interaction_intensity = total_weight / event_count if event_count > 0 else 0

        # Calculate focus score (inverse of idle variance, normalized)
        if len(idle_times) > 1:
            idle_variance = np.var(idle_times)
            focus_score = 1.0 / (1.0 + idle_variance)  # Normalize to 0-1
        else:
            focus_score = 0.5

        # Calculate efficiency score (placeholder - would need problem-specific data)
        # For now, use a heuristic based on event rate and interaction intensity
        efficiency_score = min(1.0, (event_rate / self.config.max_event_rate) * interaction_intensity)

        # Calculate composite peak score
        peak_score = self._calculate_peak_score(
            event_rate, interaction_intensity, focus_score, efficiency_score
        )

        # Determine quality classification
        if peak_score >= 0.85:
            quality = 'excellent'
            confidence = 0.9
        elif peak_score >= 0.70:
            quality = 'good'
            confidence = 0.8
        elif peak_score >= 0.55:
            quality = 'moderate'
            confidence = 0.7
        else:
            quality = 'low'
            confidence = 0.6

        return {
            'event_count': event_count,
            'event_rate': round(event_rate, 3),
            'interaction_intensity': round(interaction_intensity, 3),
            'focus_score': round(focus_score, 3),
            'efficiency_score': round(efficiency_score, 3),
            'peak_score': round(peak_score, 3),
            'peak_quality': quality,
            'confidence_level': confidence,
            'click_count': click_count,
            'input_count': input_count,
            'modification_count': modification_count,
            'max_idle_sec': round(max_idle_sec, 2),
            'avg_response_time_ms': avg_response_time_ms,
        }

    def _calculate_peak_score(
        self,
        event_rate: float,
        interaction_intensity: float,
        focus_score: float,
        efficiency_score: float
    ) -> float:
        """Calculate composite peak score"""
        # Normalize event rate to 0-1 range
        event_rate_norm = np.clip(
            (event_rate - self.config.min_event_rate) /
            (self.config.max_event_rate - self.config.min_event_rate),
            0, 1
        )

        # Weighted combination
        weights = {
            'event_rate': 0.25,
            'interaction': 0.25,
            'focus': 0.30,
            'efficiency': 0.20,
        }

        score = (
            weights['event_rate'] * event_rate_norm +
            weights['interaction'] * np.clip(interaction_intensity, 0, 1) +
            weights['focus'] * focus_score +
            weights['efficiency'] * efficiency_score
        )

        return float(np.clip(score, 0, 1))

    def _is_peak_period(self, metrics: Dict[str, Any]) -> bool:
        """Check if a period meets peak criteria"""
        # Must have minimum event rate
        if metrics['event_rate'] < self.config.min_event_rate:
            return False

        # Must not exceed maximum event rate (could indicate frantic/unfocused activity)
        if metrics['event_rate'] > self.config.max_event_rate:
            return False

        # Must have acceptable focus (not too many long idles)
        if metrics['max_idle_sec'] > self.config.max_idle_sec:
            return False

        # Must meet minimum peak score threshold
        if metrics['peak_score'] < 0.5:
            return False

        return True

    def _merge_overlapping_peaks(self, peaks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Merge overlapping or adjacent peak periods"""
        if len(peaks) <= 1:
            return peaks

        # Sort by start time
        sorted_peaks = sorted(peaks, key=lambda p: p['period_start'])

        merged = []
        current = sorted_peaks[0]

        for next_peak in sorted_peaks[1:]:
            # Check if peaks are adjacent (within 5 seconds)
            gap = (next_peak['period_start'] - current['period_end']).total_seconds()

            if gap <= 5.0:
                # Merge peaks
                all_events = current['events'] + next_peak['events']
                merged_metrics = self._calculate_period_metrics(all_events)

                current = {
                    'period_start': current['period_start'],
                    'period_end': next_peak['period_end'],
                    'duration_sec': (next_peak['period_end'] - current['period_start']).total_seconds(),
                    'events': all_events,
                    **merged_metrics
                }
            else:
                # Save current and start new
                merged.append(current)
                current = next_peak

        # Add last peak
        merged.append(current)

        return merged
