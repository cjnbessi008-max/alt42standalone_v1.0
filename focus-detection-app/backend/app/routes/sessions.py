from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.database import get_db
from app.models.schemas import SessionCreate, ApiResponse
from app.services.session_service import SessionService
from typing import Optional

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=ApiResponse)
async def create_session(
    session_data: SessionCreate,
    db: AsyncSession = Depends(get_db)
):
    """새 학습 세션 시작"""
    try:
        session = await SessionService.create_session(db, session_data)
        return ApiResponse(
            success=True,
            data=session.to_dict(),
            message="세션이 성공적으로 생성되었습니다."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}", response_model=ApiResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """세션 정보 조회"""
    session = await SessionService.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    return ApiResponse(
        success=True,
        data=session.to_dict()
    )


@router.get("", response_model=ApiResponse)
async def get_all_sessions(
    limit: Optional[int] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """모든 세션 조회"""
    sessions = await SessionService.get_all_sessions(db, limit, status)
    return ApiResponse(
        success=True,
        data={
            "sessions": [s.to_dict() for s in sessions],
            "count": len(sessions)
        }
    )


@router.post("/{session_id}/end", response_model=ApiResponse)
async def end_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """세션 종료"""
    session = await SessionService.end_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    return ApiResponse(
        success=True,
        data=session.to_dict(),
        message="세션이 종료되었습니다."
    )


@router.post("/{session_id}/pause", response_model=ApiResponse)
async def pause_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """세션 일시정지"""
    session = await SessionService.pause_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    return ApiResponse(
        success=True,
        data=session.to_dict(),
        message="세션이 일시정지되었습니다."
    )


@router.post("/{session_id}/resume", response_model=ApiResponse)
async def resume_session(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """세션 재개"""
    session = await SessionService.resume_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    return ApiResponse(
        success=True,
        data=session.to_dict(),
        message="세션이 재개되었습니다."
    )
