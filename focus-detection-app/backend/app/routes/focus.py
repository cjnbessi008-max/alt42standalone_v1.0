from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.database import get_db
from app.models.schemas import FocusDataCreate, FocusDataBatchCreate, ApiResponse
from app.services.focus_service import FocusService

router = APIRouter(prefix="/api/focus-data", tags=["focus-data"])


@router.post("", response_model=ApiResponse)
async def save_focus_data(
    focus_data: FocusDataCreate,
    db: AsyncSession = Depends(get_db)
):
    """집중도 데이터 저장"""
    try:
        data_point = await FocusService.save_focus_data(db, focus_data)
        return ApiResponse(
            success=True,
            message="집중도 데이터가 저장되었습니다."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", response_model=ApiResponse)
async def save_focus_data_batch(
    batch_data: FocusDataBatchCreate,
    db: AsyncSession = Depends(get_db)
):
    """집중도 데이터 일괄 저장"""
    try:
        count = await FocusService.save_focus_data_batch(
            db,
            batch_data.session_id,
            batch_data.focus_data_list
        )
        return ApiResponse(
            success=True,
            data={"saved_count": count},
            message=f"{count}개의 데이터가 저장되었습니다."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{session_id}", response_model=ApiResponse)
async def get_session_focus_data(
    session_id: str,
    limit: int = None,
    db: AsyncSession = Depends(get_db)
):
    """세션별 집중도 데이터 조회"""
    try:
        focus_data = await FocusService.get_session_focus_data(db, session_id, limit)
        return ApiResponse(
            success=True,
            data={
                "focusData": [d.to_dict() for d in focus_data],
                "count": len(focus_data)
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
