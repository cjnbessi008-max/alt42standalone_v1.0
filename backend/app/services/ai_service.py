"""
AI 서비스 (Claude API 연동)
"""
import json
from typing import Dict, Any, List
from datetime import date
from anthropic import Anthropic
from ..core.config import settings
from loguru import logger


class AIService:
    """Claude AI를 사용한 루틴 카드 생성 서비스"""

    def __init__(self):
        self.client = Anthropic(api_key=settings.CLAUDE_API_KEY)
        self.model = settings.AI_MODEL
        self.max_tokens = settings.AI_MAX_TOKENS
        self.temperature = settings.AI_TEMPERATURE

    def generate_routine_card(
        self,
        student_name: str,
        grade_level: str,
        learning_progress: List[Dict[str, Any]],
        card_date: date
    ) -> Dict[str, Any]:
        """
        학생의 학습 진행 상황을 기반으로 성공 루틴 카드 생성

        Args:
            student_name: 학생 이름
            grade_level: 학년
            learning_progress: 학습 진행 데이터 리스트
            card_date: 카드 날짜

        Returns:
            생성된 루틴 카드 데이터
        """
        try:
            prompt = self._build_prompt(student_name, grade_level, learning_progress, card_date)

            logger.info(f"AI 카드 생성 시작 - 학생: {student_name}, 날짜: {card_date}")

            message = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # 응답 파싱
            response_text = message.content[0].text
            card_data = self._parse_response(response_text)

            logger.info(f"AI 카드 생성 완료 - 학생: {student_name}")

            return card_data

        except Exception as e:
            logger.error(f"AI 카드 생성 실패: {str(e)}")
            # 실패 시 기본 카드 반환
            return self._generate_fallback_card(student_name, grade_level, learning_progress)

    def _build_prompt(
        self,
        student_name: str,
        grade_level: str,
        learning_progress: List[Dict[str, Any]],
        card_date: date
    ) -> str:
        """AI 프롬프트 생성"""

        progress_summary = self._format_progress_summary(learning_progress)

        prompt = f"""당신은 초등학교 수학 교육 전문가입니다. 학생의 학습 진행 상황을 분석하여 개인화된 "성공 루틴 카드"를 생성해주세요.

**학생 정보:**
- 이름: {student_name}
- 학년: {grade_level}
- 날짜: {card_date.strftime('%Y년 %m월 %d일')}

**최근 학습 진행 상황:**
{progress_summary}

**요청 사항:**
다음 JSON 형식으로 오늘의 성공 루틴 카드를 생성해주세요:

{{
  "title": "오늘의 학습 제목 (동기부여가 되는 긍정적인 제목)",
  "learning_goals": [
    "구체적인 학습 목표 1",
    "구체적인 학습 목표 2",
    "구체적인 학습 목표 3"
  ],
  "recommended_activities": [
    {{
      "title": "활동 제목",
      "description": "활동 설명",
      "duration_minutes": 15,
      "difficulty": "easy|medium|hard",
      "subject": "수학",
      "topic": "관련 주제"
    }}
  ],
  "progress_summary": {{
    "current_topics": ["현재 학습 중인 주제들"],
    "strengths": ["학생의 강점 분야"],
    "areas_for_improvement": ["개선이 필요한 영역"],
    "overall_progress": "전반적인 진행 상황 설명"
  }},
  "motivation_message": "학생을 격려하고 동기부여하는 개인화된 메시지 (친근하고 긍정적으로)",
  "next_steps": [
    "다음에 학습할 내용 1",
    "다음에 학습할 내용 2",
    "다음에 학습할 내용 3"
  ]
}}

**가이드라인:**
1. 학생의 현재 수준과 진행 상황을 고려하여 적절한 난이도의 활동을 추천하세요
2. 학습 목표는 구체적이고 달성 가능해야 합니다
3. 동기부여 메시지는 학생의 이름을 사용하여 개인화하세요
4. 권장 활동은 3-5개 정도로 제한하세요
5. 학생의 강점을 인정하면서도 개선이 필요한 부분을 부드럽게 제시하세요
6. 모든 텍스트는 학생이 이해하기 쉬운 한국어로 작성하세요

JSON 형식으로만 응답해주세요. 추가 설명은 포함하지 마세요."""

        return prompt

    def _format_progress_summary(self, learning_progress: List[Dict[str, Any]]) -> str:
        """학습 진행 데이터를 요약 문자열로 포맷"""
        if not learning_progress:
            return "최근 학습 기록이 없습니다."

        summary_lines = []
        for i, progress in enumerate(learning_progress[:5], 1):  # 최근 5개만
            subject = progress.get('subject', '과목 없음')
            topic = progress.get('topic', '주제 없음')
            completion = progress.get('completion_rate', 0)
            score = progress.get('score', 0)
            time_spent = progress.get('time_spent_minutes', 0)

            summary_lines.append(
                f"{i}. {subject} - {topic}\n"
                f"   진행률: {completion}%, 점수: {score}점, 학습 시간: {time_spent}분"
            )

        return "\n".join(summary_lines)

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """AI 응답 파싱"""
        try:
            # JSON 블록 추출 (마크다운 코드 블록 처리)
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            # JSON 파싱
            card_data = json.loads(response_text)

            # 필수 필드 검증
            required_fields = ['title', 'learning_goals', 'recommended_activities', 'motivation_message']
            for field in required_fields:
                if field not in card_data:
                    raise ValueError(f"필수 필드 누락: {field}")

            return card_data

        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"AI 응답 파싱 실패: {str(e)}")
            raise

    def _generate_fallback_card(
        self,
        student_name: str,
        grade_level: str,
        learning_progress: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """AI 실패 시 기본 카드 생성"""
        return {
            "title": f"{student_name}님의 오늘의 학습",
            "learning_goals": [
                "오늘 하루도 즐겁게 학습하기",
                "새로운 것을 배우고 연습하기",
                "어제보다 조금 더 성장하기"
            ],
            "recommended_activities": [
                {
                    "title": "복습하기",
                    "description": "지난 시간에 배운 내용을 다시 한번 살펴보세요",
                    "duration_minutes": 20,
                    "difficulty": "medium",
                    "subject": "수학",
                    "topic": "복습"
                }
            ],
            "progress_summary": {
                "current_topics": ["학습 진행 중"],
                "strengths": ["꾸준한 노력"],
                "areas_for_improvement": ["지속적인 연습"],
                "overall_progress": "열심히 학습하고 있습니다"
            },
            "motivation_message": f"{student_name}님, 오늘도 즐겁게 공부해봐요! 여러분의 노력이 멋진 결과를 만들어낼 거예요.",
            "next_steps": [
                "오늘 학습한 내용 복습하기",
                "새로운 문제 풀어보기",
                "모르는 부분은 선생님께 질문하기"
            ]
        }
