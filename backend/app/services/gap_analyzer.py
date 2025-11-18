"""
Gap Analysis Service using Claude AI
This is the core logic for quantifying solution gaps
"""
from typing import Dict, List, Any
import json
from anthropic import Anthropic

from app.core.config import settings
from app.models.problem import Problem
from app.models.solution import Solution


class GapAnalyzer:
    """Analyzes logical gaps in student solutions using AI"""

    def __init__(self):
        self.client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.ANTHROPIC_MODEL

    async def analyze_solution(
        self,
        problem: Problem,
        solution: Solution
    ) -> Dict[str, Any]:
        """
        Main analysis method that quantifies logical gaps

        Args:
            problem: The problem definition with expected steps
            solution: The student's submitted solution

        Returns:
            Comprehensive gap analysis results
        """
        # Build the analysis prompt
        prompt = self._build_analysis_prompt(problem, solution)

        # Call Claude AI
        response = self.client.messages.create(
            model=self.model,
            max_tokens=settings.ANTHROPIC_MAX_TOKENS,
            temperature=settings.ANTHROPIC_TEMPERATURE,
            messages=[{
                "role": "user",
                "content": prompt
            }]
        )

        # Parse AI response
        ai_response_text = response.content[0].text
        analysis_result = self._parse_ai_response(ai_response_text)

        # Add metadata
        analysis_result["ai_model_used"] = self.model
        analysis_result["solution_id"] = str(solution.id)
        analysis_result["problem_id"] = str(problem.id)

        return analysis_result

    def _build_analysis_prompt(self, problem: Problem, solution: Solution) -> str:
        """Build the AI prompt for gap analysis"""

        expected_steps_str = json.dumps(problem.expected_steps, indent=2, ensure_ascii=False)
        submitted_steps_str = json.dumps(solution.submitted_steps, indent=2, ensure_ascii=False)

        prompt = f"""당신은 교육 전문가이자 논리 분석 전문가입니다. 학생의 문제 풀이 과정을 분석하여 논리적 간격(logic gaps)을 정량화해야 합니다.

## 문제 정보
**제목**: {problem.title}
**설명**: {problem.description}
**과목**: {problem.subject.value}
**난이도**: {problem.difficulty.value}

## 기대되는 풀이 과정 (Expected Solution Steps)
{expected_steps_str}

**기대 추론 과정**:
{problem.expected_reasoning or '제공되지 않음'}

## 학생이 제출한 풀이 과정 (Student's Solution Steps)
{submitted_steps_str}

**학생의 원본 입력**:
{solution.raw_input or '제공되지 않음'}

---

## 분석 요구사항

다음 기준으로 학생의 풀이를 분석하고, **반드시 JSON 형식으로만** 응답하세요:

1. **완성도 점수 (Completeness Score, 0-100)**: 필요한 단계가 얼마나 포함되었는가?
2. **논리 연속성 점수 (Logic Continuity Score, 0-100)**: 단계들이 논리적으로 연결되는가?
3. **정확성 점수 (Correctness Score, 0-100)**: 각 단계가 수학적/논리적으로 올바른가?
4. **종합 점수 (Overall Score, 0-100)**: 전체적인 풀이 품질

5. **탐지된 간격 (Detected Gaps)**: 각 간격에 대해:
   - `gap_type`: 간격 유형 (예: "missing_step", "logic_jump", "incorrect_calculation", "unjustified_assumption")
   - `severity`: 심각도 ("LOW", "MEDIUM", "HIGH", "CRITICAL")
   - `after_step_number`: 어느 단계 이후에 간격이 발생했는가?
   - `before_step_number`: 어느 단계 이전에 간격이 있는가?
   - `description`: 간격에 대한 설명 (한국어)
   - `expected_content`: 있어야 했던 내용
   - `suggestion`: 개선 제안 (한국어)

6. **단계별 비교 (Step Comparisons)**: 학생 단계와 기대 단계 비교
   - `student_step_number`: 학생 단계 번호
   - `expected_step_number`: 대응하는 기대 단계 번호
   - `similarity_score`: 유사도 (0-100)
   - `match_type`: "exact", "partial", "missing", "extra", "incorrect" 중 하나
   - `comparison_notes`: 비교 노트 (한국어)

7. **피드백 (Feedback Items)**: 학생에게 제공할 피드백
   - `feedback_type`: "hint", "explanation", "correction", "encouragement" 중 하나
   - `content`: 피드백 내용 (한국어)
   - `priority`: 1(high), 2(medium), 3(low)
   - `related_step_number`: 관련 단계 번호

8. **AI 요약 (AI Summary)**: 전체 분석 요약 (한국어, 2-3문장)
9. **AI 피드백 (AI Feedback)**: 학생에게 전달할 종합 피드백 (한국어, 3-5문장)

## 출력 형식 (JSON만 출력하세요)

```json
{{
  "completeness_score": 85.5,
  "logic_continuity_score": 78.0,
  "correctness_score": 90.0,
  "overall_score": 84.5,
  "total_gaps_detected": 2,
  "critical_gaps_count": 0,
  "missing_steps_count": 1,
  "logical_errors_count": 1,
  "detected_gaps": [
    {{
      "gap_type": "missing_step",
      "severity": "MEDIUM",
      "after_step_number": 2,
      "before_step_number": 3,
      "description": "양변에서 5를 빼는 과정에 대한 명시적인 설명이 없습니다.",
      "expected_content": "2x + 5 - 5 = 13 - 5",
      "suggestion": "등식의 성질(양변에 같은 수를 더하거나 빼도 등식이 성립)을 명시적으로 언급하세요."
    }}
  ],
  "step_comparisons": [
    {{
      "student_step_number": 1,
      "expected_step_number": 1,
      "similarity_score": 100.0,
      "match_type": "exact",
      "comparison_notes": "주어진 문제를 정확히 기술했습니다."
    }}
  ],
  "feedback_items": [
    {{
      "feedback_type": "encouragement",
      "content": "문제를 정확히 이해하고 올바른 방향으로 풀이를 시작했습니다!",
      "priority": 1,
      "related_step_number": 1
    }}
  ],
  "ai_summary": "학생은 전체적으로 올바른 접근을 했으나, 일부 중간 단계에서 설명이 부족합니다. 특히 등식의 성질을 적용하는 과정을 더 명확히 설명하면 좋겠습니다.",
  "ai_feedback": "전반적으로 잘 풀었습니다! 답도 정확하고, 풀이 과정도 논리적입니다. 다만, 각 단계에서 '왜' 그렇게 했는지(예: 양변에서 5를 빼는 이유)를 조금 더 명확히 설명하면 완벽한 풀이가 될 것입니다. 수학적 원리를 언급하는 습관을 들이면 더욱 좋습니다."
}}
```

**중요**: 반드시 유효한 JSON만 출력하세요. 추가 설명이나 마크다운 블록 없이 JSON만 출력해야 합니다.
"""
        return prompt

    def _parse_ai_response(self, response_text: str) -> Dict[str, Any]:
        """Parse AI response and extract structured data"""
        try:
            # Remove markdown code blocks if present
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]

            # Parse JSON
            analysis = json.loads(response_text.strip())

            # Ensure all required fields exist with defaults
            return {
                "completeness_score": float(analysis.get("completeness_score", 0)),
                "logic_continuity_score": float(analysis.get("logic_continuity_score", 0)),
                "correctness_score": float(analysis.get("correctness_score", 0)),
                "overall_score": float(analysis.get("overall_score", 0)),
                "total_gaps_detected": int(analysis.get("total_gaps_detected", 0)),
                "critical_gaps_count": int(analysis.get("critical_gaps_count", 0)),
                "missing_steps_count": int(analysis.get("missing_steps_count", 0)),
                "logical_errors_count": int(analysis.get("logical_errors_count", 0)),
                "detected_gaps": analysis.get("detected_gaps", []),
                "step_comparisons": analysis.get("step_comparisons", []),
                "feedback_items": analysis.get("feedback_items", []),
                "ai_summary": analysis.get("ai_summary", ""),
                "ai_feedback": analysis.get("ai_feedback", ""),
                "raw_response": response_text
            }

        except json.JSONDecodeError as e:
            # If JSON parsing fails, return a basic structure with the raw response
            return {
                "completeness_score": 0,
                "logic_continuity_score": 0,
                "correctness_score": 0,
                "overall_score": 0,
                "total_gaps_detected": 0,
                "critical_gaps_count": 0,
                "missing_steps_count": 0,
                "logical_errors_count": 0,
                "detected_gaps": [],
                "step_comparisons": [],
                "feedback_items": [],
                "ai_summary": "AI 응답 파싱 오류",
                "ai_feedback": f"응답 처리 중 오류가 발생했습니다: {str(e)}",
                "raw_response": response_text,
                "parse_error": str(e)
            }
