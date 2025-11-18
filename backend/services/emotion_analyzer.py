"""
Emotion analysis service using behavioral patterns and AI

This service analyzes student behavior patterns to detect emotional states:
- Frustration (좌절): Repeated errors, rapid clicking, increased mouse speed
- Concentration (집중): Steady interaction, appropriate timing, high accuracy
- Confusion (답답함): Hesitation, backtracking, slow responses
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import numpy as np
from loguru import logger


class EmotionAnalyzer:
    """
    Analyzes behavior events to detect emotional patterns
    """

    # Thresholds for emotion detection
    FRUSTRATION_THRESHOLDS = {
        'rapid_clicks': 5,  # clicks within 2 seconds
        'high_mouse_speed': 500,  # pixels per second
        'repeated_errors': 3,  # consecutive errors
        'rapid_keypresses': 200,  # chars per minute
    }

    CONCENTRATION_THRESHOLDS = {
        'steady_interaction': (2, 10),  # seconds between events
        'high_accuracy': 0.7,  # 70% or higher
        'moderate_speed': (50, 150),  # chars per minute
    }

    CONFUSION_THRESHOLDS = {
        'slow_response': 30,  # seconds
        'backtracking_rate': 0.3,  # 30% of actions are backs/undos
        'low_progress': 0.2,  # 20% completion after significant time
        'hesitation_time': 15,  # seconds without interaction
    }

    def __init__(self, use_ai: bool = True, ai_client=None):
        """
        Initialize the emotion analyzer

        Args:
            use_ai: Whether to use AI (Claude) for enhanced analysis
            ai_client: Anthropic client for AI analysis
        """
        self.use_ai = use_ai
        self.ai_client = ai_client
        logger.info(f"EmotionAnalyzer initialized (AI: {use_ai})")

    def analyze_emotion(
        self,
        events: List[Dict],
        window_minutes: int = 5
    ) -> Dict[str, float]:
        """
        Analyze a sequence of behavior events to detect emotions

        Args:
            events: List of behavior events
            window_minutes: Time window for analysis

        Returns:
            Dictionary with emotion scores and primary emotion
        """
        if not events:
            return self._neutral_emotion()

        # Calculate basic metrics
        metrics = self._calculate_metrics(events)

        # Score each emotion based on metrics
        frustration_score = self._score_frustration(metrics)
        concentration_score = self._score_concentration(metrics)
        confusion_score = self._score_confusion(metrics)

        # Determine primary emotion
        scores = {
            'frustration': frustration_score,
            'concentration': concentration_score,
            'confusion': confusion_score,
        }
        primary_emotion = max(scores, key=scores.get)
        confidence = scores[primary_emotion]

        # If AI is enabled and confidence is low, use AI analysis
        if self.use_ai and confidence < 0.6 and self.ai_client:
            try:
                ai_result = self._ai_enhanced_analysis(events, metrics)
                if ai_result:
                    scores.update(ai_result['scores'])
                    primary_emotion = ai_result['primary_emotion']
                    confidence = ai_result['confidence']
            except Exception as e:
                logger.warning(f"AI analysis failed, using rule-based: {e}")

        return {
            'frustration_score': frustration_score,
            'concentration_score': concentration_score,
            'confusion_score': confusion_score,
            'primary_emotion': primary_emotion,
            'confidence': confidence,
            'analysis_method': 'ai_enhanced' if self.use_ai else 'rule_based',
            'metrics': metrics,
        }

    def _calculate_metrics(self, events: List[Dict]) -> Dict:
        """Calculate behavioral metrics from events"""
        metrics = {
            'total_events': len(events),
            'event_types': {},
            'avg_time_between_events': 0,
            'rapid_click_count': 0,
            'error_count': 0,
            'correct_count': 0,
            'avg_mouse_speed': 0,
            'backtrack_count': 0,
            'hesitation_count': 0,
            'long_pauses': 0,
        }

        # Count event types
        for event in events:
            event_type = event.get('event_type', 'unknown')
            metrics['event_types'][event_type] = metrics['event_types'].get(event_type, 0) + 1

        # Calculate timing metrics
        timestamps = [e.get('timestamp') for e in events if e.get('timestamp')]
        if len(timestamps) > 1:
            time_diffs = []
            for i in range(1, len(timestamps)):
                if isinstance(timestamps[i], datetime) and isinstance(timestamps[i-1], datetime):
                    diff = (timestamps[i] - timestamps[i-1]).total_seconds()
                    time_diffs.append(diff)

                    # Detect rapid clicks (< 2 seconds)
                    if diff < 2 and events[i].get('event_type') == 'click':
                        metrics['rapid_click_count'] += 1

                    # Detect long pauses (> 30 seconds)
                    if diff > 30:
                        metrics['long_pauses'] += 1

                    # Detect hesitation (10-30 seconds)
                    if 10 < diff < 30:
                        metrics['hesitation_count'] += 1

            metrics['avg_time_between_events'] = np.mean(time_diffs) if time_diffs else 0

        # Calculate accuracy
        for event in events:
            answer = event.get('is_correct_answer', 'na')
            if answer == 'correct':
                metrics['correct_count'] += 1
            elif answer in ['incorrect', 'partial']:
                metrics['error_count'] += 1

        # Calculate mouse speed
        mouse_speeds = [e.get('mouse_speed', 0) for e in events if e.get('mouse_speed')]
        metrics['avg_mouse_speed'] = np.mean(mouse_speeds) if mouse_speeds else 0

        # Detect backtracking (back button, undo actions)
        for event in events:
            event_data = event.get('event_data', {})
            if isinstance(event_data, dict):
                if event_data.get('action') in ['back', 'undo', 'previous']:
                    metrics['backtrack_count'] += 1

        # Calculate accuracy rate
        total_answers = metrics['correct_count'] + metrics['error_count']
        metrics['accuracy_rate'] = metrics['correct_count'] / total_answers if total_answers > 0 else 0

        return metrics

    def _score_frustration(self, metrics: Dict) -> float:
        """Score frustration based on behavioral indicators"""
        score = 0.0
        indicators = 0

        # Rapid clicking
        if metrics['rapid_click_count'] >= self.FRUSTRATION_THRESHOLDS['rapid_clicks']:
            score += 0.3
            indicators += 1

        # High mouse speed
        if metrics['avg_mouse_speed'] > self.FRUSTRATION_THRESHOLDS['high_mouse_speed']:
            score += 0.25
            indicators += 1

        # Repeated errors
        if metrics['error_count'] >= self.FRUSTRATION_THRESHOLDS['repeated_errors']:
            score += 0.3
            indicators += 1

        # Very short time between events (frantic behavior)
        if 0 < metrics['avg_time_between_events'] < 1:
            score += 0.15
            indicators += 1

        # Normalize score
        return min(score, 1.0) if indicators > 0 else 0.0

    def _score_concentration(self, metrics: Dict) -> float:
        """Score concentration based on behavioral indicators"""
        score = 0.0
        indicators = 0

        # Steady interaction timing
        min_time, max_time = self.CONCENTRATION_THRESHOLDS['steady_interaction']
        if min_time <= metrics['avg_time_between_events'] <= max_time:
            score += 0.35
            indicators += 1

        # High accuracy
        if metrics['accuracy_rate'] >= self.CONCENTRATION_THRESHOLDS['high_accuracy']:
            score += 0.35
            indicators += 1

        # Low backtracking
        backtrack_rate = metrics['backtrack_count'] / metrics['total_events'] if metrics['total_events'] > 0 else 0
        if backtrack_rate < 0.1:
            score += 0.15
            indicators += 1

        # Few hesitations
        if metrics['hesitation_count'] < 2:
            score += 0.15
            indicators += 1

        # Normalize score
        return min(score, 1.0) if indicators > 0 else 0.0

    def _score_confusion(self, metrics: Dict) -> float:
        """Score confusion based on behavioral indicators"""
        score = 0.0
        indicators = 0

        # Slow responses
        if metrics['avg_time_between_events'] > self.CONFUSION_THRESHOLDS['slow_response']:
            score += 0.3
            indicators += 1

        # High backtracking rate
        backtrack_rate = metrics['backtrack_count'] / metrics['total_events'] if metrics['total_events'] > 0 else 0
        if backtrack_rate > self.CONFUSION_THRESHOLDS['backtracking_rate']:
            score += 0.25
            indicators += 1

        # Many hesitations
        if metrics['hesitation_count'] >= 3:
            score += 0.25
            indicators += 1

        # Long pauses
        if metrics['long_pauses'] >= 2:
            score += 0.2
            indicators += 1

        # Normalize score
        return min(score, 1.0) if indicators > 0 else 0.0

    def _neutral_emotion(self) -> Dict:
        """Return neutral emotion state"""
        return {
            'frustration_score': 0.0,
            'concentration_score': 0.0,
            'confusion_score': 0.0,
            'primary_emotion': 'neutral',
            'confidence': 1.0,
            'analysis_method': 'rule_based',
            'metrics': {},
        }

    def _ai_enhanced_analysis(self, events: List[Dict], metrics: Dict) -> Optional[Dict]:
        """
        Use Claude AI for enhanced emotion analysis

        Args:
            events: List of behavior events
            metrics: Calculated metrics

        Returns:
            Enhanced analysis results
        """
        if not self.ai_client:
            return None

        # Prepare summary for AI
        event_summary = self._prepare_event_summary(events, metrics)

        prompt = f"""Analyze the following student learning behavior data and determine their emotional state.

Behavior Summary:
{event_summary}

The three emotions to detect are:
1. Frustration (좌절): Repeated errors, rapid/frantic clicking, high stress
2. Concentration (집중): Steady engagement, good accuracy, focused behavior
3. Confusion (답답함): Hesitation, backtracking, slow responses, uncertainty

Provide your analysis in the following JSON format:
{{
    "primary_emotion": "frustration|concentration|confusion",
    "confidence": 0.0-1.0,
    "scores": {{
        "frustration": 0.0-1.0,
        "concentration": 0.0-1.0,
        "confusion": 0.0-1.0
    }},
    "reasoning": "Brief explanation of the analysis"
}}"""

        try:
            response = self.ai_client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse AI response (simplified - would need proper JSON extraction)
            content = response.content[0].text
            # In production, properly parse JSON from response
            logger.info(f"AI analysis completed: {content[:100]}...")

            # For now, return None to use rule-based
            # In production, implement proper JSON parsing
            return None

        except Exception as e:
            logger.error(f"AI analysis error: {e}")
            return None

    def _prepare_event_summary(self, events: List[Dict], metrics: Dict) -> str:
        """Prepare a human-readable summary of events for AI analysis"""
        summary = f"""
Total Events: {metrics['total_events']}
Average Time Between Events: {metrics['avg_time_between_events']:.2f} seconds
Accuracy Rate: {metrics['accuracy_rate']:.2%}
Errors: {metrics['error_count']}
Rapid Clicks: {metrics['rapid_click_count']}
Hesitations: {metrics['hesitation_count']}
Long Pauses: {metrics['long_pauses']}
Backtracking: {metrics['backtrack_count']}
Average Mouse Speed: {metrics['avg_mouse_speed']:.1f} px/s

Event Type Distribution:
"""
        for event_type, count in metrics['event_types'].items():
            summary += f"  - {event_type}: {count}\n"

        return summary

    def analyze_pattern(
        self,
        emotion_states: List[Dict],
        window_minutes: int = 30
    ) -> Dict:
        """
        Analyze pattern of emotions over a longer time window

        Args:
            emotion_states: List of detected emotion states
            window_minutes: Time window for pattern analysis

        Returns:
            Pattern analysis including dominant emotion and recommendations
        """
        if not emotion_states:
            return {
                'dominant_emotion': 'neutral',
                'emotion_transitions': 0,
                'is_concerning': 'no',
                'intervention_suggested': 'no',
            }

        # Count emotions
        emotion_counts = {
            'frustration': 0,
            'concentration': 0,
            'confusion': 0,
            'neutral': 0,
        }

        for state in emotion_states:
            emotion = state.get('primary_emotion', 'neutral')
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1

        # Calculate transitions
        transitions = 0
        prev_emotion = None
        for state in emotion_states:
            curr_emotion = state.get('primary_emotion')
            if prev_emotion and curr_emotion != prev_emotion:
                transitions += 1
            prev_emotion = curr_emotion

        # Determine dominant emotion
        dominant = max(emotion_counts, key=emotion_counts.get)

        # Assess if concerning
        frustration_ratio = emotion_counts['frustration'] / len(emotion_states)
        confusion_ratio = emotion_counts['confusion'] / len(emotion_states)

        is_concerning = 'no'
        intervention = 'no'
        intervention_type = None

        if frustration_ratio > 0.5:
            is_concerning = 'yes'
            intervention = 'yes'
            intervention_type = 'Consider providing a break or offering hints to reduce frustration'
        elif confusion_ratio > 0.6:
            is_concerning = 'yes'
            intervention = 'yes'
            intervention_type = 'Provide additional explanation or simpler problems'
        elif transitions > len(emotion_states) * 0.7:
            is_concerning = 'monitor'
            intervention_type = 'High emotional volatility - monitor closely'

        return {
            'dominant_emotion': dominant,
            'emotion_counts': emotion_counts,
            'emotion_transitions': transitions,
            'is_concerning': is_concerning,
            'intervention_suggested': intervention,
            'intervention_type': intervention_type,
            'frustration_ratio': frustration_ratio,
            'confusion_ratio': confusion_ratio,
        }
