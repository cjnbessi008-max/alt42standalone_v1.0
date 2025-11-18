"""
성장로그 비즈니스 로직 서비스
AI 피드백 생성 및 성장 지표 계산
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from anthropic import Anthropic
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from ..models.growth_log import (
    GrowthLogCreate,
    GrowthLogResponse,
    GrowthLogUpdate,
    GrowthCategory,
    GrowthFeedback,
    LearningSessionCreate,
    LearningSessionResponse,
    LearningSessionUpdate,
    GrowthMilestoneCreate,
    GrowthMilestoneResponse,
    GrowthMilestoneShare,
    StudentGrowthAnalytics,
)


class GrowthLogService:
    """성장로그 서비스"""

    def __init__(self, db: AsyncSession):
        self.db = db
        # Anthropic Claude API client (환경변수에서 API 키 로드)
        self.anthropic = Anthropic()

    async def create_growth_log(self, data: GrowthLogCreate) -> GrowthLogResponse:
        """
        성장로그 생성

        1. 이전 시도들을 분석하여 개선 사항 파악
        2. AI를 사용하여 성장 중심 피드백 생성
        3. 성장 점수 계산
        4. 데이터베이스에 저장
        5. LMS 동기화 큐에 추가 (선택적)
        """

        # 1. 이전 시도들 가져오기
        previous_attempts = await self._get_previous_attempts(
            student_id=data.student_id,
            module_id=data.module_id,
            problem_id=data.problem_id
        )

        # 2. 개선 사항 분석
        improvement = self._analyze_improvement(data, previous_attempts)

        # 3. 성장 카테고리 자동 분류
        growth_category = self._classify_growth_category(data, previous_attempts)

        # 4. AI 피드백 생성
        ai_feedback = await self._generate_ai_feedback(data, previous_attempts, improvement)

        # 5. 성장 점수 계산
        scores = self._calculate_growth_scores(data, previous_attempts, improvement)

        # 6. 다음 학습 단계 추천
        next_steps = self._recommend_next_steps(data, ai_feedback, scores)

        # 7. 데이터베이스에 저장
        growth_log = {
            **data.model_dump(),
            "growth_category": growth_category,
            "improvement_from_previous": improvement,
            "growth_score": scores["growth_score"],
            "effort_score": scores["effort_score"],
            "progress_score": scores["progress_score"],
            "ai_feedback": ai_feedback["full_message"],
            "next_steps": next_steps,
        }

        # TODO: 실제 DB 저장 로직 (SQLAlchemy ORM 사용)
        # result = await self.db.execute(insert(...))

        # 8. LMS 동기화 (비동기 태스크)
        if should_sync_to_lms := True:  # 설정에 따라
            await self._queue_lms_sync(growth_log)

        # 9. 마일스톤 체크
        await self._check_and_create_milestones(data.student_id, data.module_id)

        return GrowthLogResponse(**growth_log)

    async def _get_previous_attempts(
        self,
        student_id: UUID,
        module_id: UUID,
        problem_id: UUID
    ) -> List[dict]:
        """이전 시도들 조회"""
        # TODO: 실제 DB 쿼리
        # query = select(GrowthLog).where(
        #     and_(
        #         GrowthLog.student_id == student_id,
        #         GrowthLog.module_id == module_id,
        #         GrowthLog.problem_id == problem_id
        #     )
        # ).order_by(GrowthLog.created_at.desc()).limit(5)
        # result = await self.db.execute(query)
        # return result.scalars().all()

        return []  # Placeholder

    def _analyze_improvement(
        self,
        current: GrowthLogCreate,
        previous: List[dict]
    ) -> dict:
        """이전 시도 대비 개선 사항 분석"""
        if not previous:
            return {"type": "first_attempt", "improvements": []}

        improvements = []

        # 시간 개선
        if previous:
            avg_prev_time = sum(p.get("time_spent_seconds", 0) for p in previous) / len(previous)
            if current.time_spent_seconds < avg_prev_time:
                improvement_pct = ((avg_prev_time - current.time_spent_seconds) / avg_prev_time) * 100
                improvements.append({
                    "type": "speed",
                    "description": f"이전보다 {improvement_pct:.0f}% 빠르게 문제를 해결했습니다",
                    "percentage": improvement_pct
                })

        # 힌트 사용 감소
        prev_hints = [p.get("hints_used", 0) for p in previous]
        if prev_hints and current.hints_used < min(prev_hints):
            improvements.append({
                "type": "independence",
                "description": "힌트 사용이 줄어들어 독립적으로 문제를 해결하고 있습니다",
                "hints_reduction": min(prev_hints) - current.hints_used
            })

        # 접근 방법 개선 (thinking_process 분석)
        if current.thinking_process and previous:
            # TODO: 더 정교한 분석
            improvements.append({
                "type": "approach",
                "description": "문제 해결 접근 방법이 체계적으로 변화하고 있습니다"
            })

        return {
            "type": "improvement_detected" if improvements else "consistent_effort",
            "improvements": improvements,
            "attempt_number": len(previous) + 1
        }

    def _classify_growth_category(
        self,
        data: GrowthLogCreate,
        previous: List[dict]
    ) -> GrowthCategory:
        """성장 카테고리 자동 분류"""
        attempt_number = len(previous) + 1

        if data.is_correct:
            if attempt_number == 1:
                return GrowthCategory.FIRST_SUCCESS
            else:
                return GrowthCategory.PERSISTENT_LEARNING

        # 오답인 경우
        if attempt_number == 1:
            return GrowthCategory.CONCEPT_EXPLORATION

        # 이전 시도들과 비교
        if self._shows_strategy_change(data, previous):
            return GrowthCategory.STRATEGY_REFINEMENT

        if self._shows_partial_progress(data, previous):
            return GrowthCategory.PARTIAL_UNDERSTANDING

        return GrowthCategory.CONCEPT_EXPLORATION

    def _shows_strategy_change(self, current: GrowthLogCreate, previous: List[dict]) -> bool:
        """전략 변경이 있는지 확인"""
        # TODO: thinking_process를 분석하여 전략 변경 감지
        return False

    def _shows_partial_progress(self, current: GrowthLogCreate, previous: List[dict]) -> bool:
        """부분적 진전이 있는지 확인"""
        # TODO: 답안을 분석하여 부분 정답 여부 확인
        return False

    async def _generate_ai_feedback(
        self,
        data: GrowthLogCreate,
        previous: List[dict],
        improvement: dict
    ) -> dict:
        """AI를 사용하여 성장 중심 피드백 생성"""

        prompt = f"""당신은 격려와 성장을 중시하는 수학 교육 전문가입니다.

학생 정보:
- 문제 ID: {data.problem_id}
- 학생 답안: {data.student_answer}
- 정답: {data.expected_answer}
- 정답 여부: {"맞았습니다" if data.is_correct else "틀렸습니다"}
- 시도 횟수: {len(previous) + 1}
- 걸린 시간: {data.time_spent_seconds}초
- 사용한 힌트: {data.hints_used}개

이전 시도 분석:
{self._format_previous_attempts(previous)}

개선 사항:
{self._format_improvements(improvement)}

다음 기준으로 성장 중심 피드백을 작성하세요:

1. **긍정적 인정**: 학생이 보여준 노력이나 시도를 먼저 인정
2. **성장 관찰**: 이전 시도 대비 개선된 점이 있다면 구체적으로 언급
3. **학습 기회**: 오답도 배움의 기회임을 강조
4. **구체적 제안**: 다음에 시도할 구체적인 방법 제시
5. **동기부여**: 계속 도전하도록 격려

응답 형식 (JSON):
{{
  "encouragement": "학생의 노력과 시도를 인정하는 메시지",
  "growth_observed": "관찰된 성장이나 개선 사항 (있다면)",
  "learning_opportunity": "이번 시도에서 배울 수 있는 점",
  "next_steps": ["구체적인 다음 단계 1", "구체적인 다음 단계 2"],
  "celebration": "축하할 만한 점 (있다면, 없으면 null)"
}}
"""

        try:
            # Claude API 호출
            message = self.anthropic.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # 응답 파싱
            feedback_json = message.content[0].text
            # TODO: JSON 파싱 및 검증

            # 피드백을 읽기 쉬운 형태로 조합
            full_message = self._format_feedback_message(feedback_json)

            return {
                "structured": feedback_json,
                "full_message": full_message
            }

        except Exception as e:
            # AI 호출 실패 시 기본 피드백
            return self._generate_fallback_feedback(data)

    def _format_previous_attempts(self, previous: List[dict]) -> str:
        """이전 시도들을 텍스트로 포맷"""
        if not previous:
            return "첫 번째 시도입니다."

        formatted = []
        for i, attempt in enumerate(previous[:3], 1):  # 최근 3개만
            formatted.append(
                f"시도 {i}: {'정답' if attempt.get('is_correct') else '오답'}, "
                f"{attempt.get('time_spent_seconds', 0)}초 소요"
            )

        return "\n".join(formatted)

    def _format_improvements(self, improvement: dict) -> str:
        """개선 사항을 텍스트로 포맷"""
        if improvement["type"] == "first_attempt":
            return "첫 시도입니다."

        if not improvement["improvements"]:
            return "꾸준히 노력하고 있습니다."

        formatted = []
        for imp in improvement["improvements"]:
            formatted.append(f"- {imp['description']}")

        return "\n".join(formatted)

    def _format_feedback_message(self, feedback_json: dict) -> str:
        """피드백을 읽기 쉬운 메시지로 조합"""
        # TODO: feedback_json을 파싱하여 보기 좋은 형태로 조합
        return """🌱 성장 기록

좋은 시도였어요! 계속 성장하고 있습니다.

다음 단계를 시도해보세요!
"""

    def _generate_fallback_feedback(self, data: GrowthLogCreate) -> dict:
        """AI 실패 시 기본 피드백"""
        if data.is_correct:
            message = "정답입니다! 계속해서 좋은 결과를 보여주고 있어요. 🎉"
        else:
            message = "좋은 시도였어요! 다시 한 번 도전해보세요. 실수는 배움의 기회입니다. 💪"

        return {
            "structured": {},
            "full_message": message
        }

    def _calculate_growth_scores(
        self,
        data: GrowthLogCreate,
        previous: List[dict],
        improvement: dict
    ) -> dict:
        """성장 점수 계산"""

        # Growth Score: 전체적인 성장 정도
        growth_score = Decimal("0.0")

        if data.is_correct:
            growth_score += Decimal("50.0")  # 기본 정답 점수

            # 시도 횟수에 따른 가산점
            attempt_count = len(previous) + 1
            if attempt_count == 1:
                growth_score += Decimal("30.0")  # 첫 시도 성공
            else:
                growth_score += max(Decimal("10.0"), Decimal("30.0") - Decimal(attempt_count * 5))

        else:
            # 오답이라도 시도 자체에 점수 부여
            growth_score += Decimal("20.0")

        # 개선 사항에 따른 가산점
        if improvement["improvements"]:
            growth_score += Decimal(len(improvement["improvements"]) * 10)

        # Effort Score: 노력 정도
        effort_score = Decimal("50.0")  # 기본 점수

        # 시간 투자
        if data.time_spent_seconds > 60:
            effort_score += Decimal("20.0")

        # 자원 활용
        if data.resources_accessed:
            effort_score += Decimal("15.0")

        # 반복 시도
        if previous:
            effort_score += min(Decimal("15.0"), Decimal(len(previous) * 5))

        # Progress Score: 진척도
        progress_score = Decimal("0.0")

        if data.is_correct:
            progress_score = Decimal("100.0")
        else:
            # TODO: 부분 정답 분석
            progress_score = Decimal("30.0") + Decimal(len(improvement.get("improvements", [])) * 10)

        return {
            "growth_score": min(Decimal("100.0"), growth_score),
            "effort_score": min(Decimal("100.0"), effort_score),
            "progress_score": min(Decimal("100.0"), progress_score),
        }

    def _recommend_next_steps(
        self,
        data: GrowthLogCreate,
        ai_feedback: dict,
        scores: dict
    ) -> dict:
        """다음 학습 단계 추천"""

        recommendations = {
            "immediate_actions": [],
            "resources": [],
            "similar_problems": []
        }

        if data.is_correct:
            recommendations["immediate_actions"].append({
                "action": "try_harder_problem",
                "description": "더 어려운 문제에 도전해보세요"
            })
        else:
            recommendations["immediate_actions"].append({
                "action": "review_concept",
                "description": "관련 개념을 다시 복습해보세요"
            })

            if data.hints_used < 3:
                recommendations["immediate_actions"].append({
                    "action": "use_hint",
                    "description": "힌트를 활용해보세요"
                })

        return recommendations

    async def _queue_lms_sync(self, growth_log: dict):
        """LMS 동기화 큐에 추가"""
        # TODO: Celery 또는 다른 task queue에 추가
        pass

    async def _check_and_create_milestones(self, student_id: UUID, module_id: UUID):
        """마일스톤 달성 여부 확인 및 생성"""
        # TODO: 조건 확인 후 마일스톤 생성
        pass

    # =============================================================================
    # ADDITIONAL METHODS (PLACEHOLDERS)
    # =============================================================================

    async def get_growth_log(self, growth_log_id: UUID) -> Optional[GrowthLogResponse]:
        """성장로그 조회"""
        # TODO: DB 쿼리
        pass

    async def list_growth_logs(self, **filters) -> List[GrowthLogResponse]:
        """성장로그 목록 조회"""
        # TODO: DB 쿼리 with filters
        pass

    async def update_growth_log(
        self,
        growth_log_id: UUID,
        update_data: GrowthLogUpdate
    ) -> Optional[GrowthLogResponse]:
        """성장로그 업데이트"""
        # TODO: DB 업데이트
        pass

    async def get_student_analytics(
        self,
        student_id: UUID,
        **filters
    ) -> Optional[StudentGrowthAnalytics]:
        """학생 성장 분석"""
        # TODO: DB 쿼리 및 분석
        pass

    async def create_learning_session(
        self,
        data: LearningSessionCreate
    ) -> LearningSessionResponse:
        """학습 세션 생성"""
        # TODO: DB 저장
        pass

    async def get_learning_session(self, session_id: UUID) -> Optional[LearningSessionResponse]:
        """학습 세션 조회"""
        # TODO: DB 쿼리
        pass

    async def update_learning_session(
        self,
        session_id: UUID,
        update_data: LearningSessionUpdate
    ) -> Optional[LearningSessionResponse]:
        """학습 세션 업데이트"""
        # TODO: DB 업데이트
        pass

    async def end_learning_session(self, session_id: UUID) -> Optional[LearningSessionResponse]:
        """학습 세션 종료"""
        # TODO: 세션 통계 계산 및 업데이트
        pass

    async def create_milestone(
        self,
        data: GrowthMilestoneCreate
    ) -> GrowthMilestoneResponse:
        """마일스톤 생성"""
        # TODO: DB 저장
        pass

    async def list_milestones(self, **filters) -> List[GrowthMilestoneResponse]:
        """마일스톤 목록"""
        # TODO: DB 쿼리
        pass

    async def share_milestone(
        self,
        milestone_id: UUID,
        share_settings: GrowthMilestoneShare
    ) -> Optional[GrowthMilestoneResponse]:
        """마일스톤 공유"""
        # TODO: DB 업데이트 및 LMS 동기화
        pass

    async def get_summary_stats(self, **filters) -> dict:
        """전체 통계 요약"""
        # TODO: DB 집계 쿼리
        pass
