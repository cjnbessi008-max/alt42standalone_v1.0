"""Claude API integration service for AI-powered question generation."""
import os
from typing import List, Dict, Any
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()


class ClaudeService:
    """Service for interacting with Anthropic Claude API."""

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-3-5-sonnet-20241022"

    async def generate_question_suggestions(
        self,
        problem_context: Dict[str, Any],
        student_context: Dict[str, Any],
        attempt_history: List[Dict[str, Any]]
    ) -> List[Dict[str, str]]:
        """
        Generate 3 self-reflection questions for the student.

        Args:
            problem_context: Information about the current problem
            student_context: Student's learning profile and concept mastery
            attempt_history: Recent attempt history

        Returns:
            List of 3 suggested questions with rationale
        """
        prompt = self._build_prompt(problem_context, student_context, attempt_history)

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                temperature=0.7,
                system=self._get_system_prompt(),
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Parse the response
            response_text = message.content[0].text
            questions = self._parse_questions(response_text)

            return questions

        except Exception as e:
            print(f"Error generating questions with Claude API: {e}")
            # Return fallback questions
            return self._get_fallback_questions(problem_context)

    def _get_system_prompt(self) -> str:
        """System prompt for Claude to generate educational questions."""
        return """You are an expert educational assistant specializing in mathematics education.
Your role is to help students develop metacognitive skills by suggesting self-reflection questions
they can ask themselves while solving problems.

Generate questions that encourage students to:
1. Clarify their understanding of the problem
2. Think about problem-solving strategies
3. Reflect on their approach and reasoning

The questions should be:
- Age-appropriate and encouraging
- Open-ended to promote thinking
- Focused on the learning process, not just the answer
- Written in Korean (한국어) for Korean students

Always provide exactly 3 questions, each with:
- The question text (in Korean)
- A brief rationale for why this question is helpful (in Korean)
- A category: "clarification" (이해 확인), "strategy" (전략), or "reflection" (성찰)
"""

    def _build_prompt(
        self,
        problem_context: Dict[str, Any],
        student_context: Dict[str, Any],
        attempt_history: List[Dict[str, Any]]
    ) -> str:
        """Build the prompt for Claude API."""
        problem_title = problem_context.get("title", "Unknown problem")
        problem_desc = problem_context.get("description", "")
        problem_type = problem_context.get("problem_type", "")
        difficulty = problem_context.get("difficulty_level", 3)

        struggling_concepts = student_context.get("struggling_concepts", [])
        total_attempts = len(attempt_history)
        recent_errors = student_context.get("recent_errors", [])

        prompt = f"""문제 상황:
제목: {problem_title}
설명: {problem_desc}
유형: {problem_type}
난이도: {difficulty}/5

학생 상황:
- 이 문제에 대한 시도 횟수: {total_attempts}회
- 어려워하는 개념: {', '.join(struggling_concepts) if struggling_concepts else '없음'}
- 최근 오류 패턴: {', '.join(recent_errors[:3]) if recent_errors else '없음'}

학생이 문제를 풀면서 스스로에게 던질 수 있는 질문 3개를 제안해주세요.
각 질문은 학생의 사고를 촉진하고 학습을 돕는 것이어야 합니다.

다음 JSON 형식으로 정확히 3개의 질문을 제공해주세요:
[
  {{
    "question": "첫 번째 질문 (한국어)",
    "rationale": "이 질문이 도움이 되는 이유 (한국어)",
    "category": "clarification" 또는 "strategy" 또는 "reflection"
  }},
  {{
    "question": "두 번째 질문 (한국어)",
    "rationale": "이 질문이 도움이 되는 이유 (한국어)",
    "category": "clarification" 또는 "strategy" 또는 "reflection"
  }},
  {{
    "question": "세 번째 질문 (한국어)",
    "rationale": "이 질문이 도움이 되는 이유 (한국어)",
    "category": "clarification" 또는 "strategy" 또는 "reflection"
  }}
]
"""
        return prompt

    def _parse_questions(self, response_text: str) -> List[Dict[str, str]]:
        """Parse Claude's response to extract questions."""
        import json
        import re

        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                questions_json = json_match.group(0)
                questions = json.loads(questions_json)

                # Ensure we have exactly 3 questions
                if len(questions) >= 3:
                    return questions[:3]

        except (json.JSONDecodeError, AttributeError) as e:
            print(f"Error parsing Claude response: {e}")

        # Fallback: try to parse manually
        return self._manual_parse(response_text)

    def _manual_parse(self, text: str) -> List[Dict[str, str]]:
        """Manual parsing if JSON parsing fails."""
        # Simple fallback - return default questions
        return [
            {
                "question": "이 문제에서 무엇을 구하려고 하는가?",
                "rationale": "문제의 목표를 명확히 이해하는 것이 중요합니다.",
                "category": "clarification"
            },
            {
                "question": "어떤 전략이나 방법을 사용할 수 있을까?",
                "rationale": "다양한 문제 해결 전략을 고려해보는 것이 도움됩니다.",
                "category": "strategy"
            },
            {
                "question": "내 풀이 과정이 논리적으로 맞는가?",
                "rationale": "자신의 사고 과정을 점검하는 것이 중요합니다.",
                "category": "reflection"
            }
        ]

    def _get_fallback_questions(self, problem_context: Dict[str, Any]) -> List[Dict[str, str]]:
        """Fallback questions when API fails."""
        return [
            {
                "question": "이 문제를 내 말로 다시 설명하면 어떻게 될까?",
                "rationale": "문제를 자신의 언어로 재구성하면 이해도를 높일 수 있습니다.",
                "category": "clarification"
            },
            {
                "question": "비슷한 문제를 풀어본 적이 있나? 그때는 어떻게 했나?",
                "rationale": "이전 경험을 활용하면 문제 해결의 실마리를 찾을 수 있습니다.",
                "category": "strategy"
            },
            {
                "question": "내 답이 맞는지 확인하려면 어떻게 해야 할까?",
                "rationale": "답을 검증하는 습관은 정확성을 높여줍니다.",
                "category": "reflection"
            }
        ]


# Singleton instance
claude_service = ClaudeService()
