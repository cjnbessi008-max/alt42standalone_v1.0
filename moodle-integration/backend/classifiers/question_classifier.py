"""
AI 기반 문제 유형 분류기
문제를 추론(reasoning)과 계산(calculation)으로 분류
"""
import logging
import re
from typing import List, Dict, Tuple, Optional
import anthropic
from ..models.schemas import QuestionType, QuestionClassificationResult

logger = logging.getLogger(__name__)


class QuestionClassifier:
    """
    AI를 활용한 문제 유형 분류기
    Anthropic Claude API를 사용하여 문제를 추론/계산으로 분류
    """

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        """
        Args:
            api_key: Anthropic API 키
            model: 사용할 Claude 모델
        """
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model

    def classify_question(
        self,
        question_id: int,
        question_text: str,
        question_type_moodle: Optional[str] = None
    ) -> QuestionClassificationResult:
        """
        단일 문제 분류

        Args:
            question_id: 문제 ID
            question_text: 문제 텍스트
            question_type_moodle: Moodle 문제 유형 (multichoice, numerical 등)

        Returns:
            분류 결과
        """
        # HTML 태그 제거
        clean_text = self._clean_html(question_text)

        # 빈 문제 처리
        if not clean_text.strip():
            return QuestionClassificationResult(
                question_id=question_id,
                moodle_question_id=question_id,
                question_text=question_text,
                classified_type=QuestionType.UNKNOWN,
                confidence=0.0,
                reasoning="문제 텍스트가 비어있습니다.",
                tags=[]
            )

        # AI 분류 수행
        try:
            classified_type, confidence, reasoning, tags = self._classify_with_ai(
                clean_text, question_type_moodle
            )

            return QuestionClassificationResult(
                question_id=question_id,
                moodle_question_id=question_id,
                question_text=clean_text[:500],  # 처음 500자만 저장
                classified_type=classified_type,
                confidence=confidence,
                reasoning=reasoning,
                tags=tags
            )

        except Exception as e:
            logger.error(f"문제 {question_id} 분류 중 오류: {e}")
            return QuestionClassificationResult(
                question_id=question_id,
                moodle_question_id=question_id,
                question_text=clean_text[:500],
                classified_type=QuestionType.UNKNOWN,
                confidence=0.0,
                reasoning=f"분류 중 오류 발생: {str(e)}",
                tags=[]
            )

    def classify_questions_batch(
        self,
        questions: List[Dict]
    ) -> List[QuestionClassificationResult]:
        """
        여러 문제 일괄 분류

        Args:
            questions: 문제 리스트 (각각 id, questiontext, qtype 포함)

        Returns:
            분류 결과 리스트
        """
        results = []
        for i, q in enumerate(questions):
            logger.info(f"문제 분류 진행 중: {i+1}/{len(questions)}")
            result = self.classify_question(
                question_id=q.get('id'),
                question_text=q.get('questiontext', ''),
                question_type_moodle=q.get('qtype')
            )
            results.append(result)

        return results

    def _classify_with_ai(
        self,
        question_text: str,
        question_type_moodle: Optional[str] = None
    ) -> Tuple[QuestionType, float, str, List[str]]:
        """
        AI를 사용하여 문제 분류

        Args:
            question_text: 문제 텍스트
            question_type_moodle: Moodle 문제 유형

        Returns:
            (분류 유형, 신뢰도, 분류 근거, 태그 리스트)
        """
        system_prompt = """당신은 교육 평가 전문가입니다. 수학/과학 문제를 분석하여 다음 두 가지 유형으로 분류해야 합니다:

**추론(REASONING)**: 논리적 사고, 개념 이해, 패턴 인식, 문제 해결 전략이 필요한 문제
- 특징: "왜", "어떻게", "설명하시오", "패턴을 찾으시오", "증명하시오"
- 예시: "왜 이 공식이 성립하는가?", "다음 패턴의 규칙을 설명하시오", "두 개념의 관계를 설명하시오"

**계산(CALCULATION)**: 수치 계산, 공식 적용, 알고리즘 실행이 주된 문제
- 특징: 명확한 수치 답, 공식 대입, 단계적 계산
- 예시: "x를 구하시오", "넓이를 계산하시오", "값을 구하시오"

**혼합(MIXED)**: 추론과 계산이 모두 필요한 문제
- 특징: 문제 해결 전략 수립 + 계산 수행

분류 시 다음 JSON 형식으로 응답하세요:
{
  "type": "REASONING" | "CALCULATION" | "MIXED",
  "confidence": 0.0 ~ 1.0,
  "reasoning": "분류 근거 설명",
  "tags": ["관련 주제 태그 리스트"]
}"""

        user_prompt = f"""다음 문제를 분류해주세요:

문제:
{question_text}
"""

        if question_type_moodle:
            user_prompt += f"\n\nMoodle 문제 유형: {question_type_moodle}"

        user_prompt += "\n\nJSON 형식으로 분류 결과를 반환해주세요."

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )

            response_text = message.content[0].text
            logger.debug(f"AI 응답: {response_text}")

            # JSON 파싱
            import json
            # JSON 블록 추출 (마크다운 코드 블록 제거)
            json_match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # 코드 블록 없이 직접 JSON인 경우
                json_str = response_text

            result = json.loads(json_str)

            # 결과 파싱
            type_str = result.get('type', 'UNKNOWN').upper()
            classified_type = QuestionType[type_str] if type_str in QuestionType.__members__ else QuestionType.UNKNOWN

            confidence = float(result.get('confidence', 0.5))
            reasoning = result.get('reasoning', 'AI 분류 완료')
            tags = result.get('tags', [])

            return classified_type, confidence, reasoning, tags

        except Exception as e:
            logger.error(f"AI 분류 실패: {e}")
            # 폴백: 간단한 규칙 기반 분류
            return self._rule_based_classification(question_text, question_type_moodle)

    def _rule_based_classification(
        self,
        question_text: str,
        question_type_moodle: Optional[str] = None
    ) -> Tuple[QuestionType, float, str, List[str]]:
        """
        규칙 기반 폴백 분류 (AI 실패 시)

        Args:
            question_text: 문제 텍스트
            question_type_moodle: Moodle 문제 유형

        Returns:
            (분류 유형, 신뢰도, 분류 근거, 태그 리스트)
        """
        text_lower = question_text.lower()

        # 추론 키워드
        reasoning_keywords = [
            '왜', 'why', '설명', 'explain', '증명', 'prove', '비교', 'compare',
            '분석', 'analyze', '패턴', 'pattern', '관계', 'relationship',
            '개념', 'concept', '이유', 'reason', '어떻게', 'how'
        ]

        # 계산 키워드
        calculation_keywords = [
            '계산', 'calculate', '구하', 'find', 'solve', '값', 'value',
            '넓이', 'area', '부피', 'volume', '길이', 'length',
            'x =', 'y =', '방정식', 'equation', '공식', 'formula'
        ]

        reasoning_score = sum(1 for kw in reasoning_keywords if kw in text_lower)
        calculation_score = sum(1 for kw in calculation_keywords if kw in text_lower)

        # Moodle 문제 유형도 고려
        if question_type_moodle:
            if question_type_moodle in ['numerical', 'calculated', 'calculatedmulti', 'calculatedsimple']:
                calculation_score += 2
            elif question_type_moodle in ['essay', 'shortanswer']:
                reasoning_score += 1

        # 분류 결정
        if reasoning_score > calculation_score + 1:
            return (
                QuestionType.REASONING,
                0.6,
                f"추론 키워드 {reasoning_score}개, 계산 키워드 {calculation_score}개 (규칙 기반)",
                ['rule-based']
            )
        elif calculation_score > reasoning_score + 1:
            return (
                QuestionType.CALCULATION,
                0.6,
                f"계산 키워드 {calculation_score}개, 추론 키워드 {reasoning_score}개 (규칙 기반)",
                ['rule-based']
            )
        elif reasoning_score > 0 and calculation_score > 0:
            return (
                QuestionType.MIXED,
                0.5,
                f"추론 및 계산 키워드 혼재 (규칙 기반)",
                ['rule-based']
            )
        else:
            return (
                QuestionType.UNKNOWN,
                0.3,
                "분류 키워드 부족 (규칙 기반)",
                ['rule-based']
            )

    def _clean_html(self, html_text: str) -> str:
        """
        HTML 태그 제거 및 텍스트 정제

        Args:
            html_text: HTML이 포함된 텍스트

        Returns:
            정제된 텍스트
        """
        if not html_text:
            return ""

        # HTML 태그 제거
        text = re.sub(r'<[^>]+>', '', html_text)

        # HTML 엔티티 디코딩
        import html
        text = html.unescape(text)

        # 여러 공백을 하나로
        text = re.sub(r'\s+', ' ', text)

        # 앞뒤 공백 제거
        text = text.strip()

        return text

    def get_classification_statistics(
        self,
        results: List[QuestionClassificationResult]
    ) -> Dict[str, any]:
        """
        분류 결과 통계 생성

        Args:
            results: 분류 결과 리스트

        Returns:
            통계 정보
        """
        total = len(results)
        if total == 0:
            return {
                'total': 0,
                'reasoning_count': 0,
                'calculation_count': 0,
                'mixed_count': 0,
                'unknown_count': 0,
                'average_confidence': 0.0
            }

        reasoning_count = sum(1 for r in results if r.classified_type == QuestionType.REASONING)
        calculation_count = sum(1 for r in results if r.classified_type == QuestionType.CALCULATION)
        mixed_count = sum(1 for r in results if r.classified_type == QuestionType.MIXED)
        unknown_count = sum(1 for r in results if r.classified_type == QuestionType.UNKNOWN)

        avg_confidence = sum(r.confidence for r in results) / total

        return {
            'total': total,
            'reasoning_count': reasoning_count,
            'calculation_count': calculation_count,
            'mixed_count': mixed_count,
            'unknown_count': unknown_count,
            'reasoning_percentage': (reasoning_count / total) * 100,
            'calculation_percentage': (calculation_count / total) * 100,
            'mixed_percentage': (mixed_count / total) * 100,
            'unknown_percentage': (unknown_count / total) * 100,
            'average_confidence': avg_confidence
        }
