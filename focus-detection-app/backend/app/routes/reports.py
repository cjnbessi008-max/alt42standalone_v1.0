from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.utils.database import get_db
from app.models.schemas import ApiResponse
from app.services.focus_service import FocusService
from app.services.session_service import SessionService

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/{session_id}", response_model=ApiResponse)
async def get_session_report(
    session_id: str,
    db: AsyncSession = Depends(get_db)
):
    """세션 리포트 생성"""
    try:
        # 세션 정보 조회
        session = await SessionService.get_session(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

        # 통계 계산
        stats = await FocusService.calculate_session_stats(db, session_id)

        # 집중도 데이터 조회
        focus_data = await FocusService.get_session_focus_data(db, session_id)

        report = {
            "session": session.to_dict(),
            "stats": stats,
            "focusData": [d.to_dict() for d in focus_data],
        }

        return ApiResponse(
            success=True,
            data=report
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
