"""
LMS 연동 API 엔드포인트
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.growth_log import (
    LMSIntegrationCreate,
    LMSIntegrationResponse,
    LMSSyncRequest,
    LMSSyncLogResponse,
)
from ..services.lms_service import LMSService
from ..database.session import get_db

router = APIRouter(prefix="/api/v1/lms", tags=["lms-integration"])


# =============================================================================
# LMS INTEGRATION ENDPOINTS
# =============================================================================

@router.post("/integrations", response_model=LMSIntegrationResponse, status_code=status.HTTP_201_CREATED)
async def create_lms_integration(
    integration: LMSIntegrationCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    LMS 연동 설정 생성

    지원 LMS:
    - Canvas
    - Moodle
    - Google Classroom
    - Blackboard
    """
    service = LMSService(db)

    # 연결 테스트
    is_valid = await service.test_connection(integration)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LMS 연결에 실패했습니다. 인증 정보를 확인해주세요."
        )

    return await service.create_integration(integration)


@router.get("/integrations", response_model=List[LMSIntegrationResponse])
async def list_lms_integrations(
    module_id: Optional[UUID] = Query(None),
    is_active: Optional[bool] = Query(None),
    lms_provider: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """LMS 연동 설정 목록 조회"""
    service = LMSService(db)
    return await service.list_integrations(
        module_id=module_id,
        is_active=is_active,
        lms_provider=lms_provider
    )


@router.get("/integrations/{integration_id}", response_model=LMSIntegrationResponse)
async def get_lms_integration(
    integration_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """특정 LMS 연동 설정 조회"""
    service = LMSService(db)
    integration = await service.get_integration(integration_id)

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"LMS integration {integration_id} not found"
        )

    return integration


@router.patch("/integrations/{integration_id}", response_model=LMSIntegrationResponse)
async def update_lms_integration(
    integration_id: UUID,
    update_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """LMS 연동 설정 업데이트"""
    service = LMSService(db)
    integration = await service.update_integration(integration_id, update_data)

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"LMS integration {integration_id} not found"
        )

    return integration


@router.delete("/integrations/{integration_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lms_integration(
    integration_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """LMS 연동 설정 삭제"""
    service = LMSService(db)
    success = await service.delete_integration(integration_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"LMS integration {integration_id} not found"
        )


@router.post("/integrations/{integration_id}/test", status_code=status.HTTP_200_OK)
async def test_lms_connection(
    integration_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    LMS 연결 테스트

    연결 및 인증이 정상적으로 작동하는지 확인
    """
    service = LMSService(db)
    integration = await service.get_integration(integration_id)

    if not integration:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"LMS integration {integration_id} not found"
        )

    is_valid = await service.test_existing_connection(integration_id)

    return {
        "valid": is_valid,
        "message": "LMS 연결이 정상입니다." if is_valid else "LMS 연결에 실패했습니다.",
        "tested_at": datetime.now().isoformat()
    }


# =============================================================================
# SYNC ENDPOINTS
# =============================================================================

@router.post("/integrations/{integration_id}/sync", response_model=LMSSyncLogResponse)
async def trigger_sync(
    integration_id: UUID,
    sync_request: LMSSyncRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    수동 LMS 동기화 트리거

    sync_type:
    - growth_log: 성장로그만 동기화
    - milestone: 마일스톤만 동기화
    - session: 학습 세션만 동기화
    - full: 전체 동기화
    """
    service = LMSService(db)

    # 동기화 작업을 백그라운드에서 실행
    sync_log = await service.create_sync_log(integration_id, sync_request.sync_type)

    background_tasks.add_task(
        service.execute_sync,
        integration_id=integration_id,
        sync_log_id=sync_log["id"],
        sync_type=sync_request.sync_type,
        date_range=sync_request.date_range
    )

    return sync_log


@router.get("/integrations/{integration_id}/sync-status")
async def get_sync_status(
    integration_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    LMS 동기화 상태 조회

    마지막 동기화 시간, 성공/실패 여부, 대기 중인 레코드 수 등
    """
    service = LMSService(db)
    status_info = await service.get_sync_status(integration_id)

    if not status_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"LMS integration {integration_id} not found"
        )

    return status_info


@router.get("/integrations/{integration_id}/sync-logs", response_model=List[LMSSyncLogResponse])
async def list_sync_logs(
    integration_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    """LMS 동기화 로그 조회"""
    service = LMSService(db)
    return await service.list_sync_logs(
        integration_id=integration_id,
        limit=limit,
        offset=offset
    )


@router.get("/sync-logs/{sync_log_id}", response_model=LMSSyncLogResponse)
async def get_sync_log(
    sync_log_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """특정 동기화 로그 상세 조회"""
    service = LMSService(db)
    sync_log = await service.get_sync_log(sync_log_id)

    if not sync_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sync log {sync_log_id} not found"
        )

    return sync_log


# =============================================================================
# LMS DATA PULL ENDPOINTS
# =============================================================================

@router.post("/integrations/{integration_id}/pull-students")
async def pull_students_from_lms(
    integration_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    LMS에서 학생 목록 가져오기

    LMS의 학생 데이터를 우리 시스템으로 동기화
    """
    service = LMSService(db)

    try:
        students = await service.pull_students(integration_id)

        return {
            "success": True,
            "students_count": len(students),
            "students": students,
            "pulled_at": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to pull students from LMS: {str(e)}"
        )


# =============================================================================
# UTILITY ENDPOINTS
# =============================================================================

@router.get("/providers")
async def list_supported_lms_providers():
    """
    지원하는 LMS 제공자 목록

    각 제공자별 필요한 인증 정보 및 설정 가이드 제공
    """
    providers = [
        {
            "id": "canvas",
            "name": "Canvas LMS",
            "auth_types": ["api_key", "oauth2"],
            "required_fields": ["instance_url", "api_token", "course_id"],
            "optional_fields": ["assignment_id"],
            "documentation": "https://canvas.instructure.com/doc/api/"
        },
        {
            "id": "moodle",
            "name": "Moodle",
            "auth_types": ["api_key"],
            "required_fields": ["instance_url", "ws_token", "course_id"],
            "optional_fields": [],
            "documentation": "https://docs.moodle.org/dev/Web_services"
        },
        {
            "id": "google_classroom",
            "name": "Google Classroom",
            "auth_types": ["oauth2"],
            "required_fields": ["course_id"],
            "optional_fields": [],
            "documentation": "https://developers.google.com/classroom"
        },
    ]

    return {
        "supported_providers": providers,
        "total_count": len(providers)
    }


@router.get("/health")
async def lms_health_check():
    """LMS API 헬스 체크"""
    return {
        "status": "healthy",
        "service": "lms-integration-api",
        "timestamp": datetime.now().isoformat()
    }
