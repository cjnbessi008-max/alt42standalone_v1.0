from typing import Optional, Dict, List
import anthropic
from app.config import settings
import json


class ComparisonService:
    """Service for comparing student solutions with model solutions using AI"""

    def __init__(self):
        self.client = None
        if settings.ANTHROPIC_API_KEY:
            self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def compare_solutions(
        self,
        student_solution: str,
        model_solution: str,
        problem_description: str,
        student_explanation: Optional[str] = None,
        model_explanation: Optional[str] = None,
    ) -> Dict:
        """
        Compare student solution with model solution using Claude AI

        Returns:
            Dictionary with:
            - similarity_score: int (0-100)
            - feedback: str
            - strengths: List[str]
            - improvements: List[str]
            - differences: dict
        """
        if not self.client:
            return self._fallback_comparison(student_solution, model_solution)

        prompt = self._build_comparison_prompt(
            student_solution, model_solution, problem_description, student_explanation, model_explanation
        )

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = message.content[0].text
            result = self._parse_ai_response(response_text)
            return result

        except Exception as e:
            print(f"AI comparison failed: {e}")
            return self._fallback_comparison(student_solution, model_solution)

    def _build_comparison_prompt(
        self,
        student_solution: str,
        model_solution: str,
        problem_description: str,
        student_explanation: Optional[str],
        model_explanation: Optional[str],
    ) -> str:
        """Build the prompt for Claude AI"""
        prompt = f"""당신은 교육 전문가입니다. 학생의 풀이와 모범 풀이를 비교하고 건설적인 피드백을 제공해주세요.

문제 설명:
{problem_description}

모범 풀이:
{model_solution}
"""

        if model_explanation:
            prompt += f"\n모범 풀이 설명:\n{model_explanation}\n"

        prompt += f"""
학생 풀이:
{student_solution}
"""

        if student_explanation:
            prompt += f"\n학생 풀이 설명:\n{student_explanation}\n"

        prompt += """
다음 형식의 JSON으로 응답해주세요:
{
  "similarity_score": 0-100 사이의 점수,
  "feedback": "전반적인 피드백 (2-3문장)",
  "strengths": ["잘한 점 1", "잘한 점 2", ...],
  "improvements": ["개선할 점 1", "개선할 점 2", ...],
  "differences": {
    "approach": "접근 방법의 차이",
    "accuracy": "정확성 평가",
    "completeness": "완성도 평가"
  }
}

평가 기준:
- 정확성: 답이 맞는지
- 풀이 과정: 논리적이고 체계적인지
- 설명: 이해하기 쉽게 설명했는지
- 효율성: 더 간단한 방법이 있는지

학생을 격려하면서도 구체적인 개선 방향을 제시해주세요.
"""
        return prompt

    def _parse_ai_response(self, response_text: str) -> Dict:
        """Parse Claude's response into structured format"""
        try:
            # Try to extract JSON from the response
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}") + 1

            if start_idx != -1 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                result = json.loads(json_str)

                # Validate and ensure all required fields exist
                return {
                    "similarity_score": result.get("similarity_score", 50),
                    "feedback": result.get("feedback", "비교가 완료되었습니다."),
                    "strengths": result.get("strengths", []),
                    "improvements": result.get("improvements", []),
                    "differences": result.get("differences", {}),
                }
        except Exception as e:
            print(f"Failed to parse AI response: {e}")

        # Fallback parsing
        return {
            "similarity_score": 50,
            "feedback": response_text[:500] if response_text else "비교 결과를 파싱하지 못했습니다.",
            "strengths": [],
            "improvements": [],
            "differences": {},
        }

    def _fallback_comparison(self, student_solution: str, model_solution: str) -> Dict:
        """Fallback comparison when AI is not available"""
        # Simple text similarity
        similarity = self._calculate_simple_similarity(student_solution, model_solution)

        return {
            "similarity_score": similarity,
            "feedback": "AI 비교 서비스를 사용할 수 없어 기본 비교를 수행했습니다. 정확한 피드백을 위해서는 ANTHROPIC_API_KEY를 설정해주세요.",
            "strengths": ["풀이를 제출했습니다."],
            "improvements": ["더 자세한 피드백을 받으려면 AI 서비스를 활성화하세요."],
            "differences": {
                "approach": "AI 분석 없이는 상세 비교가 어렵습니다.",
                "accuracy": "정확성 자동 평가 불가",
                "completeness": "완성도 자동 평가 불가",
            },
        }

    def _calculate_simple_similarity(self, text1: str, text2: str) -> int:
        """Calculate simple text similarity (character overlap)"""
        if not text1 or not text2:
            return 0

        # Simple character-based similarity
        set1 = set(text1.lower().replace(" ", ""))
        set2 = set(text2.lower().replace(" ", ""))

        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))

        if union == 0:
            return 0

        similarity = int((intersection / union) * 100)
        return min(similarity, 100)
