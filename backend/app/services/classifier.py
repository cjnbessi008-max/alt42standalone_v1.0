"""
AI-powered Answer Classification Service
Uses Claude API to classify wrong answers into 개념/계산/조건누락
"""
import json
import logging
from typing import Dict, Any, Optional
from anthropic import Anthropic
from app.models.schemas import ErrorType

logger = logging.getLogger(__name__)


class AnswerClassifier:
    """AI 기반 오답 원인 분류기"""

    def __init__(self, api_key: str, model: str = "claude-3-sonnet-20240229"):
        """
        Args:
            api_key: Anthropic API key
            model: Claude model to use
        """
        self.client = Anthropic(api_key=api_key)
        self.model = model
        self.max_tokens = 2000

    async def classify_answer(
        self,
        problem_text: str,
        correct_answer: str,
        student_answer: str,
        work_shown: Optional[str] = None,
        problem_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        학생의 오답을 분석하여 원인 분류

        Args:
            problem_text: 문제 텍스트
            correct_answer: 정답
            student_answer: 학생 답안
            work_shown: 학생이 작성한 풀이 과정 (선택)
            problem_context: 추가 문제 정보 (난이도, 유형 등)

        Returns:
            Dict containing:
                - classification: ErrorType (개념/계산/조건누락)
                - confidence: float (0.0-1.0)
                - reasoning: str (분석 근거)
                - feedback: str (학생 피드백)
                - recommended_action: str (권장 학습 방향)
        """
        prompt = self._build_classification_prompt(
            problem_text=problem_text,
            correct_answer=correct_answer,
            student_answer=student_answer,
            work_shown=work_shown,
            problem_context=problem_context
        )

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.3,  # Lower temperature for consistent classification
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Parse AI response
            result = self._parse_classification_response(response.content[0].text)

            logger.info(
                f"Classification completed: {result['classification']} "
                f"(confidence: {result['confidence']})"
            )

            return result

        except Exception as e:
            logger.error(f"Classification failed: {str(e)}")
            # Fallback to rule-based classification
            return self._fallback_classification(student_answer, correct_answer)

    def _build_classification_prompt(
        self,
        problem_text: str,
        correct_answer: str,
        student_answer: str,
        work_shown: Optional[str] = None,
        problem_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """분류 프롬프트 생성"""

        context_info = ""
        if problem_context:
            context_info = f"\n**문제 정보:**\n{json.dumps(problem_context, ensure_ascii=False, indent=2)}\n"

        work_info = ""
        if work_shown:
            work_info = f"\n**학생의 풀이 과정:**\n{work_shown}\n"

        prompt = f"""당신은 수학 교육 전문가이며 학생의 오답을 분석하는 AI 어시스턴트입니다.

**문제:**
{problem_text}

**정답:**
{correct_answer}

**학생의 답:**
{student_answer}
{work_info}{context_info}

**과제:**
학생의 오답을 다음 세 가지 카테고리 중 하나로 분류하세요:

1. **개념 (Concept)**: 학생이 해당 수학 개념이나 원리를 근본적으로 이해하지 못했습니다.
   - 예시: 분수 덧셈 시 분모를 통분해야 한다는 개념 자체를 모름
   - 예시: 음수 곱셈의 부호 규칙을 잘못 이해함

2. **계산 (Calculation)**: 학생이 개념은 이해했지만 계산 과정에서 실수했습니다.
   - 예시: 분모를 12로 통분하는 것은 알지만 4×3=11로 잘못 계산함
   - 예시: 곱셈 순서는 맞지만 구구단을 틀림

3. **조건누락 (Condition Omission)**: 학생이 문제의 조건이나 제약사항을 놓쳤습니다.
   - 예시: "양수만" 답하라는 조건을 무시하고 음수 답을 제시
   - 예시: "소수점 둘째자리까지" 요구를 놓치고 정수로 답함

**분류 기준:**
1. 학생의 접근 방법이 완전히 잘못되었다면 → **개념**
2. 접근 방법은 맞지만 중간 계산이 틀렸다면 → **계산**
3. 접근과 계산은 맞지만 조건을 확인하지 않았다면 → **조건누락**

**신뢰도 점수 (confidence):**
- 0.9-1.0: 명확한 오류 패턴, 확신함
- 0.7-0.89: 강한 증거가 있음
- 0.5-0.69: 중간 정도 확신, 교사 검토 권장
- 0.0-0.49: 불확실, 반드시 교사 검토 필요

**출력 형식 (JSON):**
{{
  "classification": "개념" | "계산" | "조건누락",
  "confidence": 0.0에서 1.0 사이의 숫자,
  "reasoning": "상세한 분석 내용 (한국어, 100-300자)",
  "feedback": "학생에게 제공할 건설적인 피드백 (한국어, 50-150자)",
  "recommended_action": "학생이 복습하거나 연습해야 할 내용 (한국어, 30-100자)"
}}

**예시 1:**
문제: 1/3 + 1/4 = ?
정답: 7/12
학생 답: 2/7
분석: 학생이 분자끼리, 분모끼리 더함 (1+1=2, 3+4=7)

{{
  "classification": "개념",
  "confidence": 0.95,
  "reasoning": "학생이 분수 덧셈의 핵심 개념인 '통분'을 이해하지 못했습니다. 분자와 분모를 각각 더하는 것은 전형적인 개념 오류 패턴입니다.",
  "feedback": "분수를 더할 때는 먼저 분모를 같게 만들어야 합니다 (통분). 1/3는 4/12, 1/4는 3/12로 바꾼 후 분자만 더하세요.",
  "recommended_action": "분수의 통분 개념과 최소공배수 찾기를 복습하세요."
}}

**예시 2:**
문제: 1/3 + 1/4 = ?
정답: 7/12
학생 답: 8/12
학생 풀이: "분모를 12로 통분했습니다. 1/3 = 4/12, 1/4 = 4/12, 4+4=8"

{{
  "classification": "계산",
  "confidence": 0.92,
  "reasoning": "학생이 통분 개념은 정확히 이해했습니다. 하지만 1/4를 4/12로 변환하는 과정에서 1×3=4로 잘못 계산했습니다 (올바른 계산: 1×3=3).",
  "feedback": "통분 방법은 정확합니다! 하지만 1/4를 12분의 얼마로 바꿀 때 계산을 다시 확인해보세요. 1×3은 얼마인가요?",
  "recommended_action": "곱셈 계산을 꼼꼼히 확인하는 습관을 기르세요."
}}

**예시 3:**
문제: 1/3 + 1/4의 답을 기약분수로 나타내시오
정답: 7/12
학생 답: 14/24

{{
  "classification": "조건누락",
  "confidence": 0.88,
  "reasoning": "학생이 분수 덧셈을 정확히 수행했습니다 (14/24는 7/12와 동치). 하지만 '기약분수로 나타내시오'라는 조건을 간과하고 약분하지 않았습니다.",
  "feedback": "계산은 정확합니다! 하지만 문제에서 '기약분수'로 답하라고 했으니 14/24를 2로 약분해서 7/12로 만들어야 합니다.",
  "recommended_action": "문제의 조건을 끝까지 읽고 확인하는 습관을 기르세요."
}}

이제 위 문제를 분석하여 JSON 형식으로만 답변하세요 (다른 설명 없이)."""

        return prompt

    def _parse_classification_response(self, response_text: str) -> Dict[str, Any]:
        """AI 응답 파싱"""
        try:
            # Extract JSON from response (in case there's extra text)
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1

            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON found in response")

            json_str = response_text[start_idx:end_idx]
            result = json.loads(json_str)

            # Validate required fields
            required_fields = ['classification', 'confidence', 'reasoning', 'feedback']
            for field in required_fields:
                if field not in result:
                    raise ValueError(f"Missing required field: {field}")

            # Validate classification value
            if result['classification'] not in ['개념', '계산', '조건누락']:
                raise ValueError(f"Invalid classification: {result['classification']}")

            # Validate confidence range
            confidence = float(result['confidence'])
            if not 0.0 <= confidence <= 1.0:
                raise ValueError(f"Confidence out of range: {confidence}")

            return {
                'classification': result['classification'],
                'confidence': confidence,
                'reasoning': result['reasoning'],
                'feedback': result['feedback'],
                'recommended_action': result.get('recommended_action', '')
            }

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse AI response: {str(e)}")
            logger.debug(f"Response text: {response_text}")
            raise ValueError(f"Invalid AI response format: {str(e)}")

    def _fallback_classification(
        self,
        student_answer: str,
        correct_answer: str
    ) -> Dict[str, Any]:
        """
        AI 분류 실패 시 폴백 (기본 규칙 기반)
        매우 낮은 신뢰도로 반환하여 교사 검토 유도
        """
        logger.warning("Using fallback classification due to AI failure")

        # Simple rule-based heuristic
        if len(student_answer.strip()) < 3:
            classification = "조건누락"
            reasoning = "답변이 너무 짧아 조건을 확인하지 않았을 가능성이 있습니다."
        else:
            classification = "개념"
            reasoning = "자동 분류 실패. 교사 검토가 필요합니다."

        return {
            'classification': classification,
            'confidence': 0.3,  # Very low confidence
            'reasoning': f"[자동 분류 실패] {reasoning}",
            'feedback': "선생님께서 자세한 피드백을 제공할 예정입니다.",
            'recommended_action': "선생님의 검토를 기다려주세요."
        }

    def get_model_version(self) -> str:
        """현재 사용 중인 AI 모델 버전 반환"""
        return self.model


# ============================================================================
# Utility Functions
# ============================================================================

def should_request_teacher_review(confidence: float, threshold: float = 0.6) -> bool:
    """
    신뢰도 기반 교사 검토 필요 여부 판단

    Args:
        confidence: 분류 신뢰도 (0.0-1.0)
        threshold: 검토 요청 임계값

    Returns:
        True if teacher review is recommended
    """
    return confidence < threshold


def get_classification_emoji(classification: ErrorType) -> str:
    """분류 타입별 이모지 (UI 표시용)"""
    emoji_map = {
        ErrorType.CONCEPT: "💡",          # Light bulb for concept
        ErrorType.CALCULATION: "🔢",      # Numbers for calculation
        ErrorType.CONDITION_OMISSION: "📋"  # Clipboard for conditions
    }
    return emoji_map.get(classification, "❓")


def get_classification_color(classification: ErrorType) -> str:
    """분류 타입별 색상 (UI 표시용)"""
    color_map = {
        ErrorType.CONCEPT: "#FF6B6B",        # Red - needs concept review
        ErrorType.CALCULATION: "#4ECDC4",    # Teal - practice more
        ErrorType.CONDITION_OMISSION: "#FFD93D"  # Yellow - be careful
    }
    return color_map.get(classification, "#95A5A6")
