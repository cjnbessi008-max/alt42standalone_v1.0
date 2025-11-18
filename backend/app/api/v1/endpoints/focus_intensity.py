"""
Focus Intensity API Endpoints
집중 강도 조절 관련 API
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.schemas.focus_intensity import (
    FocusIntensityLevelResponse,
    FocusIntensityLevelUpdate,
    AdjustFocusIntensityRequest,
    AdjustFocusIntensityResponse,
    FocusSessionCreate,
    FocusSessionResponse,
    FocusAnalyticsResponse,
)
from app.services.focus_intensity import FocusIntensityService
from app.algorithms.focus_intensity import FocusIntensityAlgorithm, PerformanceData

router = APIRouter()


# ============================================================================
# 집중 강도 레벨 API
# ============================================================================

@router.get("/modules/{module_id}/focus-intensity/levels", response_model=List[FocusIntensityLevelResponse])
async def get_focus_intensity_levels(
    module_id: UUID,
    db: Session = Depends(get_db)
):
    """
    모듈의 모든 집중 강도 레벨 설정 조회

    - **module_id**: 모듈 ID (UUID)
    - 권한: 학생, 교사
    """
    service = FocusIntensityService(db)
    levels = service.get_focus_levels(module_id)

    if not levels:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No focus intensity levels found for module {module_id}"
        )

    # 레벨 이름과 설명 추가
    level_names = {
        1: ("Relaxed", "편안한 학습 모드 - 충분한 시간과 힌트 제공"),
        2: ("Comfortable", "여유로운 학습 모드 - 적당한 시간과 힌트"),
        3: ("Engaged", "집중 학습 모드 - 표준 시간과 제한적 힌트"),
        4: ("Challenged", "도전 학습 모드 - 짧은 시간과 최소 힌트"),
        5: ("Peak Focus", "최고 집중 모드 - 타이트한 시간, 힌트 없음"),
    }

    response = []
    for level in levels:
        level_dict = level.to_dict()
        name, description = level_names.get(level.level, ("Unknown", ""))
        level_dict.update({
            "name": name,
            "description": description,
            "created_at": level.created_at,
            "updated_at": level.updated_at,
        })
        response.append(FocusIntensityLevelResponse(**level_dict))

    return response


@router.put("/modules/{module_id}/focus-intensity/levels/{level}", response_model=dict)
async def update_focus_intensity_level(
    module_id: UUID,
    level: int,
    update_data: FocusIntensityLevelUpdate,
    db: Session = Depends(get_db)
):
    """
    집중 강도 레벨 설정 수정

    - **module_id**: 모듈 ID
    - **level**: 레벨 (1-5)
    - 권한: 교사만
    """
    if not (1 <= level <= 5):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Level must be between 1 and 5"
        )

    service = FocusIntensityService(db)
    updated_level = service.update_focus_level(module_id, level, update_data.dict(exclude_unset=True))

    if not updated_level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Focus intensity level {level} not found for module {module_id}"
        )

    updated_fields = list(update_data.dict(exclude_unset=True).keys())

    return {
        "success": True,
        "updated_level": updated_level.to_dict(),
        "updated_fields": updated_fields
    }


# ============================================================================
# 집중 강도 조절 API
# ============================================================================

@router.post("/students/{student_id}/focus-intensity/adjust", response_model=AdjustFocusIntensityResponse)
async def adjust_focus_intensity(
    student_id: UUID,
    request: AdjustFocusIntensityRequest,
    db: Session = Depends(get_db)
):
    """
    학생의 집중 강도 자동 조절

    - **student_id**: 학생 ID
    - 실시간 성과 데이터를 분석하여 최적의 집중 강도로 조절
    """
    service = FocusIntensityService(db)

    # 알고리즘 실행
    algorithm = FocusIntensityAlgorithm()
    performance = PerformanceData(
        recent_accuracy=request.performance_data.recent_accuracy,
        avg_response_time=request.performance_data.avg_response_time,
        expected_response_time=request.performance_data.expected_response_time,
        consecutive_correct=request.performance_data.consecutive_correct,
        consecutive_incorrect=request.performance_data.consecutive_incorrect,
        total_attempts=5,  # 임시값 (실제로는 DB에서 조회)
        hints_used_avg=0.0  # 임시값
    )

    adjustment = algorithm.calculate_adjustment(
        current_level=request.current_level,
        problem_difficulty=request.problem_difficulty,
        performance=performance,
        manual_override=request.force_manual_level
    )

    # 새로운 레벨의 UI 설정 조회
    new_level_settings = service.get_focus_level_by_number(
        request.module_id,
        adjustment.new_level
    )

    if not new_level_settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Focus intensity level {adjustment.new_level} not found"
        )

    # 응답 생성
    level_names = {
        1: "Relaxed", 2: "Comfortable", 3: "Engaged",
        4: "Challenged", 5: "Peak Focus"
    }

    level_dict = new_level_settings.to_dict()
    level_dict.update({
        "name": level_names.get(adjustment.new_level, "Unknown"),
        "description": "",
        "created_at": new_level_settings.created_at,
        "updated_at": new_level_settings.updated_at,
    })

    return AdjustFocusIntensityResponse(
        new_level=adjustment.new_level,
        previous_level=adjustment.previous_level,
        level_changed=adjustment.level_changed,
        adjustment_reason=adjustment.adjustment_reason.value,
        confidence_score=adjustment.confidence_score,
        ui_settings=FocusIntensityLevelResponse(**level_dict),
        recommendation=adjustment.recommendation
    )


# ============================================================================
# 세션 기록 API
# ============================================================================

@router.post("/students/{student_id}/focus-intensity/sessions", response_model=FocusSessionResponse)
async def create_focus_session(
    student_id: UUID,
    session_data: FocusSessionCreate,
    db: Session = Depends(get_db)
):
    """
    집중 강도 세션 기록 생성

    학생이 문제를 풀 때마다 호출되어 세션 데이터 저장
    """
    if session_data.student_id != student_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="student_id in path and body must match"
        )

    service = FocusIntensityService(db)
    session = service.create_session(session_data)

    return FocusSessionResponse(
        id=session.id,
        session_id=session.id,
        created_at=session.started_at
    )


# ============================================================================
# 분석 API
# ============================================================================

@router.get("/students/{student_id}/focus-intensity/analytics", response_model=FocusAnalyticsResponse)
async def get_focus_analytics(
    student_id: UUID,
    module_id: UUID = None,
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """
    학생별 집중 강도 성과 분석

    - 레벨별 정답률, 평균 시간, 효율성
    - 최적 레벨 추천
    - 학습 추세 분석
    """
    service = FocusIntensityService(db)
    analytics = service.get_student_analytics(
        student_id,
        module_id=module_id,
        start_date=start_date,
        end_date=end_date
    )

    return analytics


# ============================================================================
# 초기화 API (개발/테스트용)
# ============================================================================

@router.post("/modules/{module_id}/focus-intensity/initialize", response_model=dict)
async def initialize_focus_levels(
    module_id: UUID,
    db: Session = Depends(get_db)
):
    """
    모듈의 기본 집중 강도 레벨 5단계 생성 (개발/테스트용)

    이미 레벨이 존재하면 에러 반환
    """
    service = FocusIntensityService(db)

    # 이미 존재하는지 확인
    existing = service.get_focus_levels(module_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Focus intensity levels already exist for module {module_id}"
        )

    # 5단계 생성
    created_levels = service.create_default_levels(module_id)

    return {
        "success": True,
        "module_id": str(module_id),
        "levels_created": len(created_levels),
        "message": "Default focus intensity levels created successfully"
    }
