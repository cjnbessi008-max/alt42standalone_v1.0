from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class StepDetector:
    """
    Detects when to create new learning steps based on action patterns

    Uses time-based, action-based, and semantic-based detection to identify
    transitions in the learning process.
    """

    # Time threshold for new step (seconds)
    TIME_THRESHOLD = 5.0

    # Action patterns that suggest new steps
    STEP_TRANSITION_PATTERNS = {
        'reading': ['scroll', 'focus', 'highlight'],
        'analyzing': ['extract', 'note', 'calculate'],
        'strategy-planning': ['plan', 'outline', 'organize'],
        'executing': ['input', 'draw', 'manipulate', 'calculate'],
        'verifying': ['check', 'verify', 'compare'],
        'reflecting': ['review', 'revise', 'correct'],
    }

    async def should_create_new_step(
        self,
        recent_actions: List[Any],
        current_step: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Determine if a new step should be created

        Args:
            recent_actions: Recent student actions
            current_step: Current active step (if any)

        Returns:
            Dictionary with decision and reasoning
        """
        if not recent_actions:
            return {
                "should_create_new_step": False,
                "suggested_step_type": None,
                "reason": "No actions to analyze"
            }

        # Time-based detection
        if current_step and self._time_gap_detected(recent_actions, current_step):
            return {
                "should_create_new_step": True,
                "suggested_step_type": self._suggest_step_type(recent_actions),
                "reason": "Time gap detected (>5 seconds)"
            }

        # Action-based detection
        if current_step and self._action_pattern_changed(recent_actions, current_step):
            suggested_type = self._suggest_step_type(recent_actions)
            return {
                "should_create_new_step": True,
                "suggested_step_type": suggested_type,
                "reason": f"Action pattern changed to {suggested_type}"
            }

        # Semantic detection (submit/complete actions)
        if self._completion_action_detected(recent_actions):
            return {
                "should_create_new_step": True,
                "suggested_step_type": "verifying",
                "reason": "Completion/submission action detected"
            }

        return {
            "should_create_new_step": False,
            "suggested_step_type": None,
            "reason": "No significant transition detected"
        }

    def _time_gap_detected(self, recent_actions: List[Any], current_step: Any) -> bool:
        """Check if there's a significant time gap"""
        if len(recent_actions) < 2:
            return False

        try:
            # Check gap between last two actions
            last_action = recent_actions[-1]
            prev_action = recent_actions[-2]

            last_time = self._parse_timestamp(last_action.timestamp)
            prev_time = self._parse_timestamp(prev_action.timestamp)

            gap = (last_time - prev_time).total_seconds()

            return gap > self.TIME_THRESHOLD
        except Exception as e:
            logger.warning(f"Error calculating time gap: {e}")
            return False

    def _action_pattern_changed(self, recent_actions: List[Any], current_step: Any) -> bool:
        """Check if action pattern has changed significantly"""
        if len(recent_actions) < 3:
            return False

        current_type = current_step.step_type if hasattr(current_step, 'step_type') else None
        if not current_type:
            return False

        # Get action types from recent actions
        recent_types = [a.action_type for a in recent_actions[-3:]]

        # Check if recent actions match a different step pattern
        for step_type, patterns in self.STEP_TRANSITION_PATTERNS.items():
            if step_type != current_type:
                matches = sum(1 for action_type in recent_types
                            if any(pattern in action_type.lower() for pattern in patterns))
                if matches >= 2:  # At least 2 out of 3 match new pattern
                    return True

        return False

    def _completion_action_detected(self, recent_actions: List[Any]) -> bool:
        """Check if completion/submission action was detected"""
        if not recent_actions:
            return False

        last_action = recent_actions[-1]
        completion_keywords = ['submit', 'complete', 'finish', 'done', 'check']

        return any(keyword in last_action.action_type.lower() for keyword in completion_keywords)

    def _suggest_step_type(self, recent_actions: List[Any]) -> str:
        """Suggest step type based on recent actions"""
        if not recent_actions:
            return "unknown"

        # Count action types
        action_types = [a.action_type for a in recent_actions[-5:]]

        # Score each step type
        scores = {}
        for step_type, patterns in self.STEP_TRANSITION_PATTERNS.items():
            score = sum(1 for action_type in action_types
                       if any(pattern in action_type.lower() for pattern in patterns))
            scores[step_type] = score

        # Return highest scoring type
        if scores:
            best_type = max(scores.items(), key=lambda x: x[1])
            if best_type[1] > 0:
                return best_type[0]

        return "executing"  # Default

    def _parse_timestamp(self, timestamp_str: str) -> datetime:
        """Parse timestamp string to datetime"""
        try:
            # Try ISO format first
            return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        except Exception:
            # Fallback to current time
            return datetime.now()

    async def identify_strategies(self, actions: List[Any]) -> List[str]:
        """
        Identify cognitive strategies based on action patterns

        Args:
            actions: List of student actions

        Returns:
            List of identified strategies
        """
        if not actions:
            return []

        strategies = set()
        action_types = [a.action_type.lower() for a in actions]

        # Pattern matching for strategies
        if any('read' in at or 'scroll' in at for at in action_types):
            strategies.add('problem-reading')

        if any('highlight' in at or 'note' in at or 'extract' in at for at in action_types):
            strategies.add('information-extraction')

        if any('draw' in at or 'visualize' in at or 'diagram' in at for at in action_types):
            strategies.add('visualization')

        if any('plan' in at or 'outline' in at for at in action_types):
            strategies.add('step-planning')

        if any('calculate' in at or 'compute' in at for at in action_types):
            strategies.add('calculation')

        if any('check' in at or 'verify' in at or 'compare' in at for at in action_types):
            strategies.add('verification')

        if any('correct' in at or 'revise' in at or 'undo' in at for at in action_types):
            strategies.add('self-correction')

        return list(strategies)
