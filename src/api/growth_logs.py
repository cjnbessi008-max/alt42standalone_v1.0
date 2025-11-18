"""
성장로그 API 엔드포인트
오답을 '실패'가 아닌 '성장'으로 기록하는 API
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.growth_log import (
    GrowthLogCreate,
    GrowthLogResponse,
    GrowthLogUpdate,
    LearningSessionCreate,
    LearningSessionResponse,
    LearningSessionUpdate,
    GrowthMilestoneCreate,
    GrowthMilestoneResponse,
    GrowthMilestoneShare,
    StudentGrowthAnalytics,
)
from ..services.growth_log_service import GrowthLogService
from ..database.session import get_db

router = APIRouter(prefix="/api/v1/growth-logs", tags=["growth-logs"])


# =============================================================================
# GROWTH LOG ENDPOINTS
# =============================================================================

@router.post("/", response_model=GrowthLogResponse, status_code=status.HTTP_201_CREATED)
async def create_growth_log(
    growth_log: GrowthLogCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    성장로그 생성

    학생의 답변을 기록하고 AI가 성장 중심 피드백을 생성합니다.
    오답도 학습 과정의 일부로 긍정적으로 기록됩니다.
    """
    service = GrowthLogService(db)
    return await service.create_growth_log(growth_log)


@router.get("/{growth_log_id}", response_model=GrowthLogResponse)
async def get_growth_log(
    growth_log_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """특정 성장로그 조회"""
    service = GrowthLogService(db)
    growth_log = await service.get_growth_log(growth_log_id)

    if not growth_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Growth log {growth_log_id} not found"
        )

    return growth_log


@router.get("/", response_model=List[GrowthLogResponse])
async def list_growth_logs(
    student_id: Optional[UUID] = Query(None),
    module_id: Optional[UUID] = Query(None),
    session_id: Optional[UUID] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    growth_category: Optional[str] = Query(None),
    is_correct: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """
    성장로그 목록 조회

    다양한 필터링 옵션 제공:
    - student_id: 특정 학생의 로그만
    - module_id: 특정 모듈의 로그만
    - session_id: 특정 세션의 로그만
    - from_date/to_date: 날짜 범위
    - growth_category: 성장 카테고리별 필터
    - is_correct: 정답/오답 필터
    """
    service = GrowthLogService(db)
    return await service.list_growth_logs(
        student_id=student_id,
        module_id=module_id,
        session_id=session_id,
        from_date=from_date,
        to_date=to_date,
        growth_category=growth_category,
        is_correct=is_correct,
        limit=limit,
        offset=offset
    )


@router.patch("/{growth_log_id}", response_model=GrowthLogResponse)
async def update_growth_log(
    growth_log_id: UUID,
    update_data: GrowthLogUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    성장로그 업데이트

    주로 교사 코멘트나 학생 자기 성찰 추가에 사용
    """
    service = GrowthLogService(db)
    growth_log = await service.update_growth_log(growth_log_id, update_data)

    if not growth_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Growth log {growth_log_id} not found"
        )

    return growth_log


@router.get("/student/{student_id}/analytics", response_model=StudentGrowthAnalytics)
async def get_student_growth_analytics(
    student_id: UUID,
    module_id: Optional[UUID] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    학생의 성장 분석 리포트

    전체 성장 점수, 학습 패턴, 강점, 개선 영역 등을 제공
    """
    service = GrowthLogService(db)
    analytics = await service.get_student_analytics(
        student_id=student_id,
        module_id=module_id,
        from_date=from_date,
        to_date=to_date
    )

    if not analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No growth data found for student {student_id}"
        )

    return analytics


# =============================================================================
# LEARNING SESSION ENDPOINTS
# =============================================================================

@router.post("/sessions", response_model=LearningSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_learning_session(
    session: LearningSessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    학습 세션 시작

    학생이 학습을 시작할 때 세션을 생성합니다.
    """
    service = GrowthLogService(db)
    return await service.create_learning_session(session)


@router.get("/sessions/{session_id}", response_model=LearningSessionResponse)
async def get_learning_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """특정 학습 세션 조회"""
    service = GrowthLogService(db)
    session = await service.get_learning_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning session {session_id} not found"
        )

    return session


@router.patch("/sessions/{session_id}", response_model=LearningSessionResponse)
async def update_learning_session(
    session_id: UUID,
    update_data: LearningSessionUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    학습 세션 업데이트

    주로 세션 종료 시 사용
    """
    service = GrowthLogService(db)
    session = await service.update_learning_session(session_id, update_data)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning session {session_id} not found"
        )

    return session


@router.post("/sessions/{session_id}/end", response_model=LearningSessionResponse)
async def end_learning_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    학습 세션 종료

    자동으로 세션 통계를 계산하고 성장 점수를 업데이트합니다.
    """
    service = GrowthLogService(db)
    session = await service.end_learning_session(session_id)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Learning session {session_id} not found"
        )

    return session


# =============================================================================
# GROWTH MILESTONE ENDPOINTS
# =============================================================================

@router.post("/milestones", response_model=GrowthMilestoneResponse, status_code=status.HTTP_201_CREATED)
async def create_milestone(
    milestone: GrowthMilestoneCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    성장 마일스톤 생성

    학생이 주요 성장 포인트를 달성했을 때 기록합니다.
    """
    service = GrowthLogService(db)
    return await service.create_milestone(milestone)


@router.get("/milestones", response_model=List[GrowthMilestoneResponse])
async def list_milestones(
    student_id: Optional[UUID] = Query(None),
    module_id: Optional[UUID] = Query(None),
    milestone_type: Optional[str] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """성장 마일스톤 목록 조회"""
    service = GrowthLogService(db)
    return await service.list_milestones(
        student_id=student_id,
        module_id=module_id,
        milestone_type=milestone_type,
        from_date=from_date,
        to_date=to_date,
        limit=limit,
        offset=offset
    )


@router.post("/milestones/{milestone_id}/share", response_model=GrowthMilestoneResponse)
async def share_milestone(
    milestone_id: UUID,
    share_settings: GrowthMilestoneShare,
    db: AsyncSession = Depends(get_db)
):
    """
    마일스톤 공유 설정

    교사, 학부모와 공유하거나 LMS에 동기화할 수 있습니다.
    """
    service = GrowthLogService(db)
    milestone = await service.share_milestone(milestone_id, share_settings)

    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Milestone {milestone_id} not found"
        )

    return milestone


# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """API 헬스 체크"""
    return {
        "status": "healthy",
        "service": "growth-logs-api",
        "timestamp": datetime.now().isoformat()
    }


@router.get("/stats/summary")
async def get_summary_stats(
    module_id: Optional[UUID] = Query(None),
    from_date: Optional[datetime] = Query(None),
    to_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    전체 통계 요약

    모듈별 성장 통계, 전체 참여도 등을 제공합니다.
    """
    service = GrowthLogService(db)
    return await service.get_summary_stats(
        module_id=module_id,
        from_date=from_date,
        to_date=to_date
    )
