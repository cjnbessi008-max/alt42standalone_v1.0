"""
자신감 회복 및 난이도 조정 API
Confidence Recovery and Difficulty Adjustment API Endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

from backend.services.confidence_recovery_service import (
    ConfidenceRecoveryService,
    LMSIntegrationAnalyzer,
    StudentConfidenceData,
    StudentAttempt,
    RecoveryRecommendation,
    TriggerReason,
    format_recovery_recommendation_for_ui
)


# ============================================
# Pydantic 모델 정의
# ============================================

class DifficultyLevel(int, Enum):
    """난이도 레벨"""
    LEVEL_1 = 1
    LEVEL_2 = 2
    LEVEL_3 = 3
    LEVEL_4 = 4
    LEVEL_5 = 5


class AdjustmentTypeEnum(str, Enum):
    """조정 타입"""
    UPWARD = "upward"
    DOWNWARD = "downward"
    RESET = "reset"


class ConfidenceCheckResponse(BaseModel):
    """신뢰도 확인 응답"""
    needs_intervention: bool
    current_confidence_score: int = Field(..., ge=0, le=100)
    recommended_action: str
    recommended_difficulty: int = Field(..., ge=1, le=5)
    current_difficulty: int = Field(..., ge=1, le=5)
    trigger_reason: Optional[str] = None
    failure_count: int
    estimated_time_minutes: int
    recovery_path: Optional[List[Dict[str, Any]]] = None


class ApplyDifficultyAdjustmentRequest(BaseModel):
    """난이도 조정 적용 요청"""
    adjustment_type: AdjustmentTypeEnum
    target_difficulty: int = Field(..., ge=1, le=5)
    reason: str


class RecoveryProblem(BaseModel):
    """회복용 문제"""
    id: str
    difficulty: int = Field(..., ge=1, le=5)
    type: str
    module_id: str
    estimated_time: int


class RecoveryPlan(BaseModel):
    """회복 계획"""
    phase: str
    target_success_count: int
    next_phase_difficulty: int
    description: str


class ApplyDifficultyAdjustmentResponse(BaseModel):
    """난이도 조정 적용 응답"""
    success: bool
    new_difficulty: int = Field(..., ge=1, le=5)
    recovery_problems: List[RecoveryProblem]
    recovery_plan: RecoveryPlan
    message: str


class SubmitAttemptRequest(BaseModel):
    """시도 제출 요청"""
    problem_id: str
    is_correct: bool
    time_spent: int = Field(..., ge=0)
    hint_used: bool = False
    answer_data: Optional[Dict[str, Any]] = None


class SubmitAttemptResponse(BaseModel):
    """시도 제출 응답"""
    success: bool
    new_confidence_score: int = Field(..., ge=0, le=100)
    confidence_change: int
    consecutive_successes: int
    consecutive_failures: int
    should_check_intervention: bool
    message: str


class LMSPerformanceData(BaseModel):
    """LMS 성과 데이터"""
    lms_student_id: str
    course_id: str
    recent_scores: List[float]
    timestamp: datetime
    assignment_data: Optional[Dict[str, Any]] = None


class LMSWebhookResponse(BaseModel):
    """LMS 웹훅 응답"""
    recommendation: str
    message: str
    details: Dict[str, Any]


class RecoveryProgressResponse(BaseModel):
    """회복 진행 상황 응답"""
    student_id: str
    module_id: str
    in_recovery_mode: bool
    current_phase: Optional[str] = None
    progress_percentage: float
    problems_completed: int
    problems_remaining: int
    confidence_score: int
    confidence_gain: int
    current_difficulty: int
    original_difficulty: int


# ============================================
# API 라우터 생성
# ============================================

router = APIRouter(
    prefix="/api/confidence-recovery",
    tags=["Confidence Recovery"]
)

# 서비스 인스턴스 (실제로는 의존성 주입 사용)
confidence_service = ConfidenceRecoveryService()
lms_analyzer = LMSIntegrationAnalyzer()


# ============================================
# 데이터베이스 의존성 (플레이스홀더)
# ============================================

async def get_db():
    """데이터베이스 세션 (추후 구현)"""
    # TODO: PostgreSQL 연결 구현
    pass


async def get_student_data_from_db(
    student_id: str,
    module_id: str
) -> Optional[StudentConfidenceData]:
    """
    데이터베이스에서 학생 신뢰도 데이터 조회 (플레이스홀더)

    Args:
        student_id: 학생 ID
        module_id: 모듈 ID

    Returns:
        학생 신뢰도 데이터 또는 None
    """
    # TODO: 실제 데이터베이스 쿼리 구현
    # 현재는 샘플 데이터 반환
    return StudentConfidenceData(
        student_id=student_id,
        module_id=module_id,
        confidence_score=45,
        current_difficulty=4,
        original_difficulty=4,
        consecutive_failures=3,
        consecutive_successes=0,
        total_attempts=10,
        correct_attempts=3,
        recent_attempts=[],
        in_recovery_mode=False,
        target_time_per_problem=120
    )


# ============================================
# API 엔드포인트
# ============================================

@router.get("/students/{student_id}/confidence-check")
async def check_confidence(
    student_id: str,
    module_id: str
) -> ConfidenceCheckResponse:
    """
    학생의 신뢰도를 확인하고 개입 필요 여부 판단

    Args:
        student_id: 학생 ID
        module_id: 모듈 ID

    Returns:
        신뢰도 확인 응답
    """
    # 학생 데이터 조회
    student_data = await get_student_data_from_db(student_id, module_id)

    if not student_data:
        raise HTTPException(status_code=404, detail="Student data not found")

    # 개입 필요 여부 확인
    recommendation = confidence_service.check_student_needs_intervention(student_data)

    # 응답 생성
    response = ConfidenceCheckResponse(
        needs_intervention=recommendation.needs_intervention,
        current_confidence_score=recommendation.current_confidence_score,
        recommended_action=recommendation.recommended_action,
        recommended_difficulty=recommendation.recommended_difficulty,
        current_difficulty=recommendation.current_difficulty,
        trigger_reason=recommendation.trigger_reason.value if recommendation.trigger_reason else None,
        failure_count=recommendation.failure_count,
        estimated_time_minutes=recommendation.estimated_time_minutes,
        recovery_path=[
            {
                "phase": phase.phase.value,
                "difficulty": phase.difficulty,
                "required_successes": phase.required_successes,
                "description": phase.description
            }
            for phase in (recommendation.recovery_path or [])
        ] if recommendation.recovery_path else None
    )

    return response


@router.post("/students/{student_id}/apply-difficulty-adjustment")
async def apply_difficulty_adjustment(
    student_id: str,
    module_id: str,
    request: ApplyDifficultyAdjustmentRequest,
    background_tasks: BackgroundTasks
) -> ApplyDifficultyAdjustmentResponse:
    """
    난이도 조정 적용 및 회복용 문제 생성

    Args:
        student_id: 학생 ID
        module_id: 모듈 ID
        request: 조정 요청

    Returns:
        조정 적용 응답
    """
    # 학생 데이터 조회
    student_data = await get_student_data_from_db(student_id, module_id)

    if not student_data:
        raise HTTPException(status_code=404, detail="Student data not found")

    # 회복 경로 생성
    recovery_path = confidence_service.path_generator.generate_recovery_path(
        student_data.current_difficulty,
        student_data.original_difficulty
    )

    # 회복용 문제 생성
    recovery_problems = confidence_service.generate_recovery_problems(
        difficulty=request.target_difficulty,
        count=3,
        module_id=module_id
    )

    # TODO: 데이터베이스 업데이트
    # - student_confidence 테이블 업데이트
    # - difficulty_adjustment_history에 기록
    # - recovery_path 테이블에 저장

    # 백그라운드 작업: 교사에게 알림
    background_tasks.add_task(
        notify_teacher_of_adjustment,
        student_id,
        module_id,
        request.adjustment_type,
        request.target_difficulty
    )

    # 첫 번째 단계 정보
    first_phase = recovery_path[0] if recovery_path else None
    next_phase = recovery_path[1] if len(recovery_path) > 1 else first_phase

    response = ApplyDifficultyAdjustmentResponse(
        success=True,
        new_difficulty=request.target_difficulty,
        recovery_problems=[
            RecoveryProblem(
                id=p["id"],
                difficulty=p["difficulty"],
                type=p["type"],
                module_id=p["module_id"],
                estimated_time=p["estimated_time"]
            )
            for p in recovery_problems
        ],
        recovery_plan=RecoveryPlan(
            phase=first_phase.phase.value if first_phase else "immediate_downward",
            target_success_count=first_phase.required_successes if first_phase else 3,
            next_phase_difficulty=next_phase.difficulty if next_phase else request.target_difficulty + 1,
            description=first_phase.description if first_phase else "자신감 회복 단계"
        ),
        message=f"난이도가 {request.target_difficulty}로 조정되었습니다. 자신감 회복을 시작합니다!"
    )

    return response


@router.post("/students/{student_id}/submit-attempt")
async def submit_attempt(
    student_id: str,
    module_id: str,
    request: SubmitAttemptRequest
) -> SubmitAttemptResponse:
    """
    학생의 문제 시도 제출 및 신뢰도 업데이트

    Args:
        student_id: 학생 ID
        module_id: 모듈 ID
        request: 시도 제출 요청

    Returns:
        시도 제출 응답
    """
    # 학생 데이터 조회
    student_data = await get_student_data_from_db(student_id, module_id)

    if not student_data:
        raise HTTPException(status_code=404, detail="Student data not found")

    # 시도 데이터 생성
    attempt = StudentAttempt(
        is_correct=request.is_correct,
        time_spent=request.time_spent,
        attempted_at=datetime.now(),
        hint_used=request.hint_used
    )

    # 이전 신뢰도 점수 저장
    previous_score = student_data.confidence_score

    # 신뢰도 업데이트
    new_score = confidence_service.update_confidence_after_attempt(
        student_data,
        attempt
    )

    # 연속 성공/실패 카운트 업데이트
    if request.is_correct:
        student_data.consecutive_successes += 1
        student_data.consecutive_failures = 0
    else:
        student_data.consecutive_failures += 1
        student_data.consecutive_successes = 0

    # TODO: 데이터베이스 업데이트
    # - student_confidence 업데이트
    # - student_attempts 테이블에 기록
    # - recovery_path 진행 상황 업데이트

    # 개입 필요 여부 확인 (3회 연속 실패 또는 신뢰도 40 미만)
    should_check = (
        student_data.consecutive_failures >= 3 or
        new_score < 40
    )

    response = SubmitAttemptResponse(
        success=True,
        new_confidence_score=new_score,
        confidence_change=new_score - previous_score,
        consecutive_successes=student_data.consecutive_successes,
        consecutive_failures=student_data.consecutive_failures,
        should_check_intervention=should_check,
        message="성공! 계속 잘하고 있어요!" if request.is_correct else "다시 한번 도전해보세요!"
    )

    return response


@router.get("/students/{student_id}/recovery-progress")
async def get_recovery_progress(
    student_id: str,
    module_id: str
) -> RecoveryProgressResponse:
    """
    학생의 회복 진행 상황 조회

    Args:
        student_id: 학생 ID
        module_id: 모듈 ID

    Returns:
        회복 진행 상황
    """
    # TODO: 데이터베이스에서 회복 경로 데이터 조회

    # 플레이스홀더 응답
    response = RecoveryProgressResponse(
        student_id=student_id,
        module_id=module_id,
        in_recovery_mode=True,
        current_phase="immediate_downward",
        progress_percentage=60.0,
        problems_completed=5,
        problems_remaining=3,
        confidence_score=65,
        confidence_gain=20,
        current_difficulty=2,
        original_difficulty=4
    )

    return response


@router.post("/lms/webhook/student-performance")
async def lms_performance_webhook(
    data: LMSPerformanceData,
    background_tasks: BackgroundTasks
) -> LMSWebhookResponse:
    """
    LMS로부터 학생 성과 데이터 수신 및 분석

    Args:
        data: LMS 성과 데이터

    Returns:
        LMS 웹훅 응답
    """
    # LMS 데이터 분석
    analysis_result = lms_analyzer.analyze_lms_performance_data({
        "recent_scores": data.recent_scores,
        "lms_student_id": data.lms_student_id,
        "course_id": data.course_id
    })

    # 추천 생성
    recommendation = lms_analyzer.generate_lms_recommendation(
        {
            "recent_scores": data.recent_scores,
            "lms_student_id": data.lms_student_id,
            "course_id": data.course_id
        },
        analysis_result
    )

    # TODO: 데이터베이스에 로그 저장
    # - lms_integration_log 테이블에 기록
    # - auto_recommendation_events에 추천 저장

    # 백그라운드 작업: 추천이 생성된 경우 학생에게 알림
    if recommendation["recommendation"] == "trigger_confidence_recovery":
        background_tasks.add_task(
            notify_student_of_recommendation,
            data.lms_student_id,
            recommendation
        )

    response = LMSWebhookResponse(
        recommendation=recommendation["recommendation"],
        message=recommendation["message"],
        details=recommendation["details"]
    )

    return response


@router.get("/students/{student_id}/ui-notification")
async def get_ui_notification(
    student_id: str,
    module_id: str
) -> Dict[str, Any]:
    """
    학생 UI용 알림 데이터 조회

    Args:
        student_id: 학생 ID
        module_id: 모듈 ID

    Returns:
        UI 친화적 알림 데이터
    """
    # 신뢰도 확인
    student_data = await get_student_data_from_db(student_id, module_id)

    if not student_data:
        raise HTTPException(status_code=404, detail="Student data not found")

    # 추천 생성
    recommendation = confidence_service.check_student_needs_intervention(student_data)

    # UI 포맷으로 변환
    ui_data = format_recovery_recommendation_for_ui(recommendation)

    return ui_data


# ============================================
# 백그라운드 작업 함수
# ============================================

async def notify_teacher_of_adjustment(
    student_id: str,
    module_id: str,
    adjustment_type: AdjustmentTypeEnum,
    new_difficulty: int
):
    """
    교사에게 난이도 조정 알림 전송

    Args:
        student_id: 학생 ID
        module_id: 모듈 ID
        adjustment_type: 조정 타입
        new_difficulty: 새 난이도
    """
    # TODO: 교사 알림 시스템 연동
    print(f"[Teacher Notification] Student {student_id} difficulty adjusted to {new_difficulty}")


async def notify_student_of_recommendation(
    lms_student_id: str,
    recommendation: Dict[str, Any]
):
    """
    학생에게 추천 알림 전송

    Args:
        lms_student_id: LMS 학생 ID
        recommendation: 추천 데이터
    """
    # TODO: 학생 알림 시스템 연동 (이메일, 푸시 등)
    print(f"[Student Notification] Recommendation sent to {lms_student_id}")


# ============================================
# 헬스 체크
# ============================================

@router.get("/health")
async def health_check():
    """서비스 헬스 체크"""
    return {
        "status": "healthy",
        "service": "confidence-recovery-api",
        "timestamp": datetime.now().isoformat()
    }
