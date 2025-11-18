"""
Thinking Flow Analysis Service
Analyzes student activity patterns to identify delays, struggles, and thinking patterns
"""
from typing import List, Dict, Any, Tuple
from datetime import datetime
import statistics
from ..core.config import settings


class ThinkingFlowAnalyzer:
    """Analyzes student thinking patterns from activity events"""

    def __init__(self, pause_threshold_ms: int = None, struggle_threshold_ms: int = None):
        self.pause_threshold_ms = pause_threshold_ms or settings.PAUSE_THRESHOLD_MS
        self.struggle_threshold_ms = struggle_threshold_ms or settings.STRUGGLE_THRESHOLD_MS

    def analyze_session(
        self, events: List[Dict[str, Any]], expected_time_seconds: int = None
    ) -> Dict[str, Any]:
        """
        Analyze a learning session to identify thinking patterns and delays

        Args:
            events: List of activity events sorted by time_since_start_ms
            expected_time_seconds: Expected time to complete the problem

        Returns:
            Analysis results including delay segments, thinking pattern, and scores
        """
        if not events:
            return self._empty_analysis()

        # Sort events by time
        sorted_events = sorted(events, key=lambda e: e.get("time_since_start_ms", 0))

        # Identify delay segments
        delay_segments = self._identify_delay_segments(sorted_events)

        # Analyze thinking pattern
        thinking_pattern = self._analyze_thinking_pattern(sorted_events, delay_segments)

        # Identify struggle points
        struggle_points = self._identify_struggle_points(sorted_events, delay_segments)

        # Calculate cognitive metrics
        cognitive_load_score = self._calculate_cognitive_load(
            sorted_events, delay_segments
        )
        persistence_score = self._calculate_persistence(sorted_events, struggle_points)
        efficiency_score = self._calculate_efficiency(
            sorted_events, expected_time_seconds
        )

        return {
            "delay_segments": delay_segments,
            "thinking_pattern": thinking_pattern,
            "struggle_points": struggle_points,
            "cognitive_load_score": cognitive_load_score,
            "persistence_score": persistence_score,
            "efficiency_score": efficiency_score,
            "total_events": len(sorted_events),
            "total_pauses": len([s for s in delay_segments if s["segment_type"] == "pause"]),
            "total_struggles": len(
                [s for s in delay_segments if s["segment_type"] == "struggle"]
            ),
        }

    def _identify_delay_segments(
        self, events: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Identify periods of delay/pause in student activity

        Delay types:
        - pause: Brief inactivity (3-10 seconds)
        - struggle: Extended inactivity (>10 seconds)
        - exploration: Multiple rapid interactions with same element
        - verification: Pause after answer before submission
        """
        segments = []

        for i in range(len(events) - 1):
            current_event = events[i]
            next_event = events[i + 1]

            time_gap = next_event["time_since_start_ms"] - current_event["time_since_start_ms"]

            if time_gap >= self.pause_threshold_ms:
                segment_type = (
                    "struggle" if time_gap >= self.struggle_threshold_ms else "pause"
                )

                context = {
                    "before_event": current_event["event_type"],
                    "after_event": next_event["event_type"],
                    "before_data": current_event.get("event_data"),
                }

                segments.append(
                    {
                        "start_time_ms": current_event["time_since_start_ms"],
                        "end_time_ms": next_event["time_since_start_ms"],
                        "duration_ms": time_gap,
                        "segment_type": segment_type,
                        "context": context,
                    }
                )

        # Identify exploration patterns (rapid interactions)
        exploration_segments = self._identify_exploration_patterns(events)
        segments.extend(exploration_segments)

        # Identify verification pauses (pause after input before submission)
        verification_segments = self._identify_verification_pauses(events)
        segments.extend(verification_segments)

        return sorted(segments, key=lambda s: s["start_time_ms"])

    def _identify_exploration_patterns(
        self, events: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify periods where student is exploring different approaches"""
        exploration = []
        window_size = 5  # Look at 5 consecutive events

        for i in range(len(events) - window_size):
            window = events[i : i + window_size]

            # Check if multiple rapid interactions with similar elements
            input_changes = [
                e for e in window if e["event_type"] == "input_change"
            ]

            if len(input_changes) >= 3:
                # Rapid input changes suggest exploration
                time_span = (
                    window[-1]["time_since_start_ms"] - window[0]["time_since_start_ms"]
                )

                if time_span < 5000:  # Within 5 seconds
                    exploration.append(
                        {
                            "start_time_ms": window[0]["time_since_start_ms"],
                            "end_time_ms": window[-1]["time_since_start_ms"],
                            "duration_ms": time_span,
                            "segment_type": "exploration",
                            "context": {
                                "input_changes": len(input_changes),
                                "rapid_exploration": True,
                            },
                        }
                    )

        return exploration

    def _identify_verification_pauses(
        self, events: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify pauses where student is verifying their answer"""
        verification = []

        for i in range(len(events) - 1):
            current = events[i]
            next_event = events[i + 1]

            # Look for pause between input_blur and answer_submitted
            if (
                current["event_type"] == "input_blur"
                and next_event["event_type"] == "answer_submitted"
            ):
                time_gap = next_event["time_since_start_ms"] - current["time_since_start_ms"]

                if self.pause_threshold_ms <= time_gap < self.struggle_threshold_ms:
                    verification.append(
                        {
                            "start_time_ms": current["time_since_start_ms"],
                            "end_time_ms": next_event["time_since_start_ms"],
                            "duration_ms": time_gap,
                            "segment_type": "verification",
                            "context": {"checking_answer": True},
                        }
                    )

        return verification

    def _analyze_thinking_pattern(
        self, events: List[Dict[str, Any]], delay_segments: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze the overall thinking pattern of the student

        Returns:
            Pattern characteristics including:
            - approach: systematic, exploratory, impulsive, careful
            - focus: high, medium, low
            - phases: List of distinct phases in problem-solving
        """
        total_time = events[-1]["time_since_start_ms"] if events else 0
        total_pauses = len([s for s in delay_segments if s["segment_type"] == "pause"])
        total_struggles = len(
            [s for s in delay_segments if s["segment_type"] == "struggle"]
        )
        total_explorations = len(
            [s for s in delay_segments if s["segment_type"] == "exploration"]
        )

        # Determine approach style
        if total_explorations > 3:
            approach = "exploratory"
        elif total_pauses < 2 and total_time < 30000:
            approach = "impulsive"
        elif total_pauses > 5:
            approach = "careful"
        else:
            approach = "systematic"

        # Determine focus level based on consistency of activity
        input_events = [e for e in events if e["event_type"] in ["input_change", "input_focus"]]
        if len(input_events) > 0:
            time_between_inputs = []
            for i in range(len(input_events) - 1):
                gap = input_events[i + 1]["time_since_start_ms"] - input_events[i]["time_since_start_ms"]
                time_between_inputs.append(gap)

            if time_between_inputs:
                variance = statistics.variance(time_between_inputs) if len(time_between_inputs) > 1 else 0
                avg_gap = statistics.mean(time_between_inputs)

                if variance < 1000000:  # Low variance
                    focus = "high"
                elif variance > 5000000:  # High variance
                    focus = "low"
                else:
                    focus = "medium"
            else:
                focus = "medium"
        else:
            focus = "low"

        # Identify phases
        phases = self._identify_phases(events, delay_segments)

        return {
            "approach": approach,
            "focus": focus,
            "total_time_ms": total_time,
            "active_time_ms": total_time - sum(s["duration_ms"] for s in delay_segments),
            "pause_time_ms": sum(
                s["duration_ms"] for s in delay_segments if s["segment_type"] == "pause"
            ),
            "struggle_time_ms": sum(
                s["duration_ms"] for s in delay_segments if s["segment_type"] == "struggle"
            ),
            "phases": phases,
        }

    def _identify_phases(
        self, events: List[Dict[str, Any]], delay_segments: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """Identify distinct phases in problem-solving process"""
        phases = []

        # Phase 1: Initial understanding (from start to first input)
        first_input = next(
            (e for e in events if e["event_type"] in ["input_focus", "input_change"]),
            None,
        )
        if first_input:
            phases.append(
                {
                    "phase": "understanding",
                    "start_ms": 0,
                    "end_ms": first_input["time_since_start_ms"],
                    "description": "Reading and understanding the problem",
                }
            )

        # Phase 2: Active problem-solving
        last_input = next(
            (
                e
                for e in reversed(events)
                if e["event_type"] in ["input_change", "input_blur"]
            ),
            None,
        )
        if first_input and last_input:
            phases.append(
                {
                    "phase": "solving",
                    "start_ms": first_input["time_since_start_ms"],
                    "end_ms": last_input["time_since_start_ms"],
                    "description": "Active problem-solving and input",
                }
            )

        # Phase 3: Verification (from last input to submission)
        submit_event = next(
            (e for e in reversed(events) if e["event_type"] == "answer_submitted"),
            None,
        )
        if last_input and submit_event:
            phases.append(
                {
                    "phase": "verification",
                    "start_ms": last_input["time_since_start_ms"],
                    "end_ms": submit_event["time_since_start_ms"],
                    "description": "Checking answer before submission",
                }
            )

        return phases

    def _identify_struggle_points(
        self, events: List[Dict[str, Any]], delay_segments: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify specific points where student struggled"""
        struggles = []

        for segment in delay_segments:
            if segment["segment_type"] == "struggle":
                context = segment.get("context", {})
                struggles.append(
                    {
                        "time_ms": segment["start_time_ms"],
                        "duration_ms": segment["duration_ms"],
                        "context": context.get("before_event"),
                        "description": f"Extended pause of {segment['duration_ms'] / 1000:.1f} seconds",
                    }
                )

        # Also identify multiple failed attempts (if hint requests or repeated changes)
        hint_requests = [e for e in events if e["event_type"] == "hint_requested"]
        for hint in hint_requests:
            struggles.append(
                {
                    "time_ms": hint["time_since_start_ms"],
                    "duration_ms": 0,
                    "context": "hint_requested",
                    "description": "Student requested a hint",
                }
            )

        return sorted(struggles, key=lambda s: s["time_ms"])

    def _calculate_cognitive_load(
        self, events: List[Dict[str, Any]], delay_segments: List[Dict[str, Any]]
    ) -> float:
        """
        Calculate cognitive load score (0-100)
        Higher score = higher cognitive load
        """
        if not events:
            return 0.0

        # Factors indicating high cognitive load:
        # 1. Many pauses and struggles
        # 2. Long total time
        # 3. Many hint requests
        # 4. High variance in activity

        struggle_count = len([s for s in delay_segments if s["segment_type"] == "struggle"])
        pause_count = len([s for s in delay_segments if s["segment_type"] == "pause"])
        hint_count = len([e for e in events if e["event_type"] == "hint_requested"])

        total_time = events[-1]["time_since_start_ms"]

        # Calculate score components (0-100 each)
        struggle_score = min(struggle_count * 20, 100)
        pause_score = min(pause_count * 10, 100)
        hint_score = min(hint_count * 25, 100)
        time_score = min((total_time / 60000) * 20, 100)  # 60 seconds = max score

        # Weighted average
        cognitive_load = (
            struggle_score * 0.4 + pause_score * 0.2 + hint_score * 0.3 + time_score * 0.1
        )

        return round(cognitive_load, 2)

    def _calculate_persistence(
        self, events: List[Dict[str, Any]], struggle_points: List[Dict[str, Any]]
    ) -> float:
        """
        Calculate persistence score (0-100)
        Higher score = more persistent
        """
        if not events:
            return 0.0

        # Factors indicating high persistence:
        # 1. Continued activity after struggles
        # 2. Multiple attempts without giving up
        # 3. Completion despite difficulties

        struggle_count = len(struggle_points)
        completed = any(e["event_type"] == "problem_completed" for e in events)

        if struggle_count == 0:
            # No struggles detected
            return 100.0 if completed else 80.0

        # Check for continued activity after each struggle
        recovery_count = 0
        for struggle in struggle_points:
            struggle_time = struggle["time_ms"]
            # Look for activity within 5 seconds after struggle
            next_activity = next(
                (
                    e
                    for e in events
                    if e["time_since_start_ms"] > struggle_time + struggle.get("duration_ms", 0)
                    and e["event_type"] in ["input_change", "input_focus"]
                ),
                None,
            )
            if next_activity:
                recovery_count += 1

        recovery_rate = recovery_count / struggle_count if struggle_count > 0 else 0

        persistence = recovery_rate * 80
        if completed:
            persistence += 20

        return round(min(persistence, 100.0), 2)

    def _calculate_efficiency(
        self, events: List[Dict[str, Any]], expected_time_seconds: int = None
    ) -> float:
        """
        Calculate efficiency score (0-100)
        Higher score = more efficient
        """
        if not events:
            return 0.0

        actual_time_ms = events[-1]["time_since_start_ms"]
        actual_time_seconds = actual_time_ms / 1000

        if expected_time_seconds is None:
            # No baseline, use heuristics
            # Assume 30 seconds is optimal for most problems
            expected_time_seconds = 30

        # Calculate efficiency ratio
        if actual_time_seconds <= expected_time_seconds:
            # Finished faster than expected
            efficiency = 100.0
        else:
            # Took longer than expected
            ratio = expected_time_seconds / actual_time_seconds
            efficiency = ratio * 100

        return round(min(efficiency, 100.0), 2)

    def _empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis structure"""
        return {
            "delay_segments": [],
            "thinking_pattern": {
                "approach": "unknown",
                "focus": "unknown",
                "total_time_ms": 0,
                "active_time_ms": 0,
                "pause_time_ms": 0,
                "struggle_time_ms": 0,
                "phases": [],
            },
            "struggle_points": [],
            "cognitive_load_score": 0.0,
            "persistence_score": 0.0,
            "efficiency_score": 0.0,
            "total_events": 0,
            "total_pauses": 0,
            "total_struggles": 0,
        }

    def generate_graph_data(self, analysis: Dict[str, Any], events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate data structure optimized for graph visualization

        Returns:
            Timeline data, segment highlights, and metrics for charting
        """
        timeline = []
        for event in events:
            timeline.append({
                "time_ms": event["time_since_start_ms"],
                "event_type": event["event_type"],
                "data": event.get("event_data"),
            })

        return {
            "timeline": timeline,
            "delay_segments": analysis["delay_segments"],
            "thinking_metrics": {
                "cognitive_load": analysis["cognitive_load_score"],
                "persistence": analysis["persistence_score"],
                "efficiency": analysis["efficiency_score"],
            },
            "phase_breakdown": analysis["thinking_pattern"]["phases"],
            "recommendations": self._generate_recommendations(analysis),
        }

    def _generate_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate educational recommendations based on analysis"""
        recommendations = []

        cognitive_load = analysis["cognitive_load_score"]
        persistence = analysis["persistence_score"]
        efficiency = analysis["efficiency_score"]
        approach = analysis["thinking_pattern"]["approach"]

        if cognitive_load > 70:
            recommendations.append(
                "Consider providing scaffolding or breaking down the problem into smaller steps"
            )

        if persistence < 50:
            recommendations.append(
                "Student may benefit from encouragement and confidence-building exercises"
            )

        if efficiency < 50:
            recommendations.append(
                "Additional practice with similar problems may improve speed and confidence"
            )

        if approach == "impulsive":
            recommendations.append(
                "Encourage student to slow down and verify their answers before submitting"
            )

        if approach == "exploratory":
            recommendations.append(
                "Student shows good problem-solving exploration; guide toward more systematic approaches"
            )

        if len(analysis["struggle_points"]) > 3:
            recommendations.append(
                "Multiple struggle points detected; consider reviewing prerequisite concepts"
            )

        return recommendations
