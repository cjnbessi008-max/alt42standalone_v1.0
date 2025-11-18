import os
import json
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()


class AIService:
    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        self.client = Anthropic(api_key=api_key)

    def predict_wrong_answer(
        self,
        student_answer_num: int,
        student_answer_den: int,
        correct_answer_num: int,
        correct_answer_den: int,
        student_id: str,
        problem_type: str = "fraction_addition"
    ) -> dict:
        """
        Claude AI를 사용하여 학생의 답이 틀렸는지 예측하고, 오답 원인을 분석합니다.
        """

        # 답안을 정규화하여 비교
        student_simplified = self._simplify_fraction(student_answer_num, student_answer_den)
        correct_simplified = self._simplify_fraction(correct_answer_num, correct_answer_den)

        # 정답인 경우
        if student_simplified == correct_simplified:
            return {
                "is_likely_wrong": False,
                "error_type": None,
                "explanation": "정답입니다!",
                "suggestion": None,
                "confidence": 1.0
            }

        # Claude에게 오답 원인 분석 요청
        prompt = f"""당신은 수학 교육 전문가입니다. 학생이 분수 문제에서 제출한 답이 틀렸습니다.

**정답**: {correct_answer_num}/{correct_answer_den}
**학생 답안**: {student_answer_num}/{student_answer_den}

학생이 흔히 저지르는 실수 유형을 분석하고, 다음 JSON 형식으로 응답해주세요:

{{
  "error_type": "실수 유형 (예: 통분 오류, 계산 실수, 약분 누락 등)",
  "explanation": "이 답이 나온 이유에 대한 간단한 설명 (2-3문장, 학생이 이해하기 쉽게)",
  "suggestion": "학생에게 주는 힌트 (구체적인 답을 주지 말고, 생각의 방향만 제시)",
  "confidence": 0.0에서 1.0 사이의 숫자 (이 분석의 확신도)
}}

학생 수준에 맞게 친근하고 격려하는 톤으로 작성해주세요.
응답은 반드시 유효한 JSON 형식이어야 합니다."""

        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response_text = message.content[0].text

            # JSON 파싱
            analysis = json.loads(response_text)

            return {
                "is_likely_wrong": True,
                "error_type": analysis.get("error_type", "알 수 없는 오류"),
                "explanation": analysis.get("explanation", "답을 다시 확인해보세요."),
                "suggestion": analysis.get("suggestion", "계산 과정을 천천히 다시 확인해보세요."),
                "confidence": float(analysis.get("confidence", 0.8))
            }

        except json.JSONDecodeError:
            # JSON 파싱 실패 시 기본 응답
            return {
                "is_likely_wrong": True,
                "error_type": "계산 오류",
                "explanation": "답이 정답과 다릅니다. 계산 과정을 다시 확인해보세요.",
                "suggestion": "분수를 통분하고 계산하는 과정을 단계별로 확인해보세요.",
                "confidence": 0.7
            }
        except Exception as e:
            print(f"AI prediction error: {str(e)}")
            return {
                "is_likely_wrong": True,
                "error_type": "확인 필요",
                "explanation": "답을 제출하기 전에 다시 한 번 확인해보세요.",
                "suggestion": "계산 과정을 천천히 검토해보세요.",
                "confidence": 0.5
            }

    def _simplify_fraction(self, numerator: int, denominator: int) -> tuple:
        """분수를 기약분수로 만듭니다."""
        from math import gcd
        if denominator == 0:
            return (numerator, denominator)
        g = gcd(abs(numerator), abs(denominator))
        return (numerator // g, denominator // g)


# 싱글톤 인스턴스
ai_service = AIService()
