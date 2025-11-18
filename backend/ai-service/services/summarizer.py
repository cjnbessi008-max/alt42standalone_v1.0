import anthropic
import os
import time
from typing import List, Dict, Any, Optional
import logging
from tenacity import retry, stop_after_attempt, wait_exponential

from .cache import get_cached_summary, cache_summary

logger = logging.getLogger(__name__)

class MetacognitiveSummarizer:
    """
    AI-powered metacognitive summary generator using Claude

    Generates natural language summaries of student learning processes,
    focusing on cognitive strategies and problem-solving approaches.
    """

    def __init__(self):
        self.client = anthropic.Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY")
        )
        self.model = os.getenv("CLAUDE_MODEL", "claude-3-sonnet-20240229")
        self.max_tokens = int(os.getenv("MAX_TOKENS", "1024"))
        self.temperature = float(os.getenv("TEMPERATURE", "0.7"))

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def generate_summary(
        self,
        step: Any,
        actions: List[Any],
        language: str = "ko",
        student_context: Optional[Dict] = None,
        problem_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate metacognitive summary for a learning step

        Args:
            step: Learning step information
            actions: List of student actions in this step
            language: Output language (ko/en)
            student_context: Student profile information
            problem_context: Problem details

        Returns:
            Dictionary with summary, strategies, confidence, etc.
        """
        start_time = time.time()

        # Check cache first
        cache_key = self._generate_cache_key(step.id, actions)
        cached = await get_cached_summary(cache_key)
        if cached:
            logger.info(f"Using cached summary for step {step.id}")
            cached['from_cache'] = True
            return cached

        # Build prompt
        prompt = self._build_prompt(step, actions, language, student_context, problem_context)

        try:
            # Call Claude API
            message = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Parse response
            response_text = message.content[0].text
            summary, strategies = self._parse_response(response_text)

            generation_time_ms = int((time.time() - start_time) * 1000)

            result = {
                "summary": summary,
                "strategies": strategies,
                "confidence": self._estimate_confidence(actions),
                "model": self.model,
                "generation_time_ms": generation_time_ms,
                "from_cache": False
            }

            # Cache the result
            await cache_summary(cache_key, result)

            return result

        except Exception as e:
            logger.error(f"Claude API error: {str(e)}")
            # Fallback to template-based summary
            return self._generate_fallback_summary(step, actions, language)

    def _build_prompt(
        self,
        step: Any,
        actions: List[Any],
        language: str,
        student_context: Optional[Dict],
        problem_context: Optional[Dict]
    ) -> str:
        """Build prompt for Claude API"""

        # Format actions for context
        actions_description = self._format_actions(actions)

        # Build context sections
        student_info = ""
        if student_context:
            grade = student_context.get('grade_level', 'unknown')
            student_info = f"- Student Grade Level: {grade}\n"

        problem_info = ""
        if problem_context:
            problem_type = problem_context.get('type', 'math problem')
            problem_text = problem_context.get('text', '')
            problem_info = f"""- Problem Type: {problem_type}
- Problem: {problem_text}
"""

        # Select language instruction
        lang_instruction = "Generate your response in Korean (한국어)." if language == "ko" else "Generate your response in English."

        prompt = f"""You are an expert educational psychologist specializing in metacognition and learning processes.

Your task is to analyze a student's learning actions and generate an encouraging, specific metacognitive summary.

Context:
{student_info}{problem_info}
Current Learning Step Type: {step.step_type}
Step Duration: {self._format_duration(step)}

Student Actions in This Step:
{actions_description}

Task:
1. Analyze what cognitive process the student is engaged in
2. Identify the problem-solving strategy being used
3. Generate a 1-2 sentence summary that:
   - Uses second person ("You are..." or "지금..." for Korean)
   - Focuses on WHY the student is doing this, not just WHAT
   - Is encouraging and positive
   - Is specific to the actual actions observed
   - Highlights the cognitive strategy being employed

{lang_instruction}

Output Format (JSON):
{{
  "summary": "your 1-2 sentence summary here",
  "strategies": ["strategy1", "strategy2"]
}}

Cognitive Strategies to Consider:
- Problem Reading & Comprehension
- Information Extraction
- Visualization
- Step-by-Step Planning
- Pattern Recognition
- Trial and Error
- Verification & Checking
- Reflection & Self-Correction

Examples:

For Korean:
{{
  "summary": "지금 분수 문제에서 분모를 비교하며 통분이 필요한지 파악하고 있어요. 차근차근 접근하는 좋은 전략이에요!",
  "strategies": ["problem-analysis", "step-planning"]
}}

For English:
{{
  "summary": "You're carefully comparing the denominators to determine if you need to find a common denominator. This systematic approach is an excellent strategy!",
  "strategies": ["problem-analysis", "step-planning"]
}}

Now generate the metacognitive summary for the current student actions:"""

        return prompt

    def _format_actions(self, actions: List[Any]) -> str:
        """Format actions into readable description"""
        if not actions:
            return "No actions recorded yet."

        descriptions = []
        for i, action in enumerate(actions[:10], 1):  # Limit to last 10 actions
            action_type = action.action_type
            action_data = action.action_data if hasattr(action, 'action_data') else {}

            desc = f"{i}. {action_type}"
            if action_data:
                if isinstance(action_data, dict):
                    details = ", ".join([f"{k}: {v}" for k, v in action_data.items() if k != 'timestamp'])
                    if details:
                        desc += f" ({details})"
            descriptions.append(desc)

        return "\n".join(descriptions)

    def _format_duration(self, step: Any) -> str:
        """Format step duration"""
        if hasattr(step, 'duration_seconds') and step.duration_seconds:
            return f"{step.duration_seconds} seconds"
        return "ongoing"

    def _parse_response(self, response_text: str) -> tuple[str, List[str]]:
        """Parse Claude's JSON response"""
        import json
        try:
            # Extract JSON from response
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            json_str = response_text[start:end]

            data = json.loads(json_str)
            summary = data.get('summary', '')
            strategies = data.get('strategies', [])

            return summary, strategies
        except Exception as e:
            logger.warning(f"Failed to parse JSON response: {e}")
            # Return raw text as summary
            return response_text.strip(), []

    def _estimate_confidence(self, actions: List[Any]) -> float:
        """Estimate confidence score based on action count and diversity"""
        if not actions:
            return 0.3

        action_count = len(actions)
        action_types = len(set(a.action_type for a in actions))

        # More actions and diverse types = higher confidence
        confidence = min(0.5 + (action_count * 0.05) + (action_types * 0.1), 0.95)
        return round(confidence, 2)

    def _generate_fallback_summary(
        self,
        step: Any,
        actions: List[Any],
        language: str
    ) -> Dict[str, Any]:
        """Generate template-based summary when AI fails"""
        templates = {
            'ko': {
                'reading': '문제를 꼼꼼히 읽으며 이해하고 있어요.',
                'analyzing': '문제의 핵심 정보를 파악하고 있어요.',
                'strategy-planning': '문제 해결 전략을 수립하고 있어요.',
                'executing': '계획한 전략을 실행하고 있어요.',
                'verifying': '답을 검증하고 확인하고 있어요.',
                'reflecting': '풀이 과정을 되돌아보며 반성하고 있어요.',
            },
            'en': {
                'reading': 'You are carefully reading and understanding the problem.',
                'analyzing': 'You are identifying the key information in the problem.',
                'strategy-planning': 'You are developing a strategy to solve the problem.',
                'executing': 'You are executing your planned strategy.',
                'verifying': 'You are verifying and checking your answer.',
                'reflecting': 'You are reflecting on your problem-solving process.',
            }
        }

        step_type = step.step_type if hasattr(step, 'step_type') else 'unknown'
        summary = templates.get(language, templates['ko']).get(
            step_type,
            '열심히 문제를 풀고 있어요.' if language == 'ko' else 'You are working hard on the problem.'
        )

        return {
            "summary": summary,
            "strategies": [step_type],
            "confidence": 0.5,
            "model": "template",
            "generation_time_ms": 0,
            "from_cache": False
        }

    def _generate_cache_key(self, step_id: str, actions: List[Any]) -> str:
        """Generate cache key from step and actions"""
        action_signature = "-".join([a.action_type for a in actions[:5]])
        return f"summary:{step_id}:{hash(action_signature)}"
