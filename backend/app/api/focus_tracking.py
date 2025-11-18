"""
Focus Tracking API Endpoints
FastAPI routes for focus tracking and mental alignment routines
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database.connection import get_db
from ..services.focus_tracking_service import FocusTrackingService
from ..schemas.focus_tracking import (
    FocusSessionCreate, FocusSessionUpdate, FocusSessionResponse,
    FocusBreakCreate, FocusBreakUpdate, FocusBreakResponse,
    MentalAlignmentRoutineResponse, StudentFocusPreferencesCreate,
    StudentFocusPreferencesUpdate, StudentFocusPreferencesResponse,
    MoodleIntegrationLogCreate, MoodleIntegrationLogResponse,
    FocusAnalytics, SessionSummary
)

router = APIRouter(prefix="/api/v1/focus", tags=["Focus Tracking"])


def get_focus_service(db: Session = Depends(get_db)) -> FocusTrackingService:
    """의존성: FocusTrackingService 인스턴스"""
    return FocusTrackingService(db)


# Focus Session Endpoints
@router.post("/sessions", response_model=FocusSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_focus_session(
    session_data: FocusSessionCreate,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """
    새로운 집중 세션 시작

    - **student_id**: 학생 ID
    - **module_id**: 학습 모듈 ID
    """
    # Check if there's already an active session
    active_session = service.get_active_session(session_data.student_id, session_data.module_id)
    if active_session:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Active session already exists with id: {active_session.id}"
        )

    session = service.create_session(session_data)

    # Log to Moodle if integration is enabled
    service.log_moodle_event(
        student_id=session_data.student_id,
        event_type="session_start",
        event_data={"session_id": session.id, "module_id": session_data.module_id}
    )

    return session


@router.get("/sessions/{session_id}", response_model=FocusSessionResponse)
async def get_focus_session(
    session_id: int,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """집중 세션 조회"""
    from ..models.focus_tracking import FocusSession
    session = service.db.query(FocusSession).filter(FocusSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.patch("/sessions/{session_id}", response_model=FocusSessionResponse)
async def update_focus_session(
    session_id: int,
    update_data: FocusSessionUpdate,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """집중 세션 업데이트"""
    session = service.update_session(session_id, update_data)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.post("/sessions/{session_id}/end", response_model=FocusSessionResponse)
async def end_focus_session(
    session_id: int,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """집중 세션 종료"""
    session = service.end_session(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found or already ended")
    return session


@router.post("/sessions/{session_id}/interact", response_model=FocusSessionResponse)
async def record_interaction(
    session_id: int,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """상호작용 기록 (클릭, 입력 등)"""
    session = service.increment_interaction(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.get("/sessions/student/{student_id}/active", response_model=Optional[FocusSessionResponse])
async def get_active_session(
    student_id: str,
    module_id: str = Query(..., description="모듈 ID"),
    service: FocusTrackingService = Depends(get_focus_service)
):
    """활성 세션 조회"""
    session = service.get_active_session(student_id, module_id)
    return session


# Focus Break Endpoints
@router.post("/breaks", response_model=FocusBreakResponse, status_code=status.HTTP_201_CREATED)
async def create_focus_break(
    break_data: FocusBreakCreate,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """
    집중 중단 기록 생성

    집중력이 깨졌을 때 자동으로 호출되어 10초 정신정렬 루틴을 제공합니다.
    """
    focus_break = service.create_break(break_data)

    # Log to Moodle
    service.log_moodle_event(
        student_id=break_data.student_id,
        event_type="focus_break",
        event_data={
            "break_id": focus_break.id,
            "reason": break_data.break_reason.value,
            "routine_type": break_data.routine_type.value
        }
    )

    return focus_break


@router.post("/breaks/{break_id}/start", response_model=FocusBreakResponse)
async def start_mental_routine(
    break_id: int,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """정신정렬 루틴 시작"""
    focus_break = service.start_routine(break_id)
    if not focus_break:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Break record not found")
    return focus_break


@router.post("/breaks/{break_id}/complete", response_model=FocusBreakResponse)
async def complete_mental_routine(
    break_id: int,
    effectiveness_rating: Optional[int] = Query(None, ge=1, le=5, description="효과성 평가 (1-5)"),
    service: FocusTrackingService = Depends(get_focus_service)
):
    """
    정신정렬 루틴 완료

    10초 루틴을 완료한 후 호출합니다.
    """
    focus_break = service.complete_routine(break_id, effectiveness_rating)
    if not focus_break:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Break record not found")

    # Log to Moodle
    service.log_moodle_event(
        student_id=focus_break.student_id,
        event_type="routine_complete",
        event_data={
            "break_id": break_id,
            "effectiveness_rating": effectiveness_rating,
            "duration": focus_break.get_routine_duration()
        }
    )

    return focus_break


@router.post("/breaks/{break_id}/skip", response_model=FocusBreakResponse)
async def skip_mental_routine(
    break_id: int,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """정신정렬 루틴 건너뛰기"""
    focus_break = service.skip_routine(break_id)
    if not focus_break:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Break record not found")
    return focus_break


@router.get("/breaks/check/{session_id}")
async def check_break_needed(
    session_id: int,
    student_id: str = Query(..., description="학생 ID"),
    service: FocusTrackingService = Depends(get_focus_service)
):
    """
    집중 중단이 필요한지 확인

    클라이언트에서 주기적으로 호출하여 자동 휴식이 필요한지 확인합니다.
    """
    should_break, reason = service.should_trigger_break(session_id, student_id)
    return {
        "should_trigger_break": should_break,
        "break_reason": reason.value if reason else None
    }


# Mental Alignment Routine Endpoints
@router.get("/routines", response_model=List[MentalAlignmentRoutineResponse])
async def get_all_routines(
    service: FocusTrackingService = Depends(get_focus_service)
):
    """모든 활성 정신정렬 루틴 조회"""
    routines = service.get_all_active_routines()
    return routines


@router.get("/routines/{routine_type}", response_model=MentalAlignmentRoutineResponse)
async def get_routine_by_type(
    routine_type: str,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """특정 타입의 루틴 조회"""
    routine = service.get_routine_by_type(routine_type)
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
    return routine


@router.get("/routines/recommend/{student_id}", response_model=MentalAlignmentRoutineResponse)
async def get_recommended_routine(
    student_id: str,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """학생에게 추천되는 루틴 조회"""
    routine = service.get_recommended_routine(student_id)
    if not routine:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No routine available")
    return routine


# Student Preferences Endpoints
@router.post("/preferences", response_model=StudentFocusPreferencesResponse, status_code=status.HTTP_201_CREATED)
async def create_student_preferences(
    prefs_data: StudentFocusPreferencesCreate,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """학생 집중도 설정 생성"""
    from ..models.focus_tracking import StudentFocusPreferences

    # Check if preferences already exist
    existing = service.db.query(StudentFocusPreferences).filter(
        StudentFocusPreferences.student_id == prefs_data.student_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Preferences already exist for this student"
        )

    prefs = StudentFocusPreferences(**prefs_data.model_dump())
    service.db.add(prefs)
    service.db.commit()
    service.db.refresh(prefs)
    return prefs


@router.get("/preferences/{student_id}", response_model=StudentFocusPreferencesResponse)
async def get_student_preferences(
    student_id: str,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """학생 집중도 설정 조회 (없으면 자동 생성)"""
    prefs = service.get_or_create_preferences(student_id)
    return prefs


@router.patch("/preferences/{student_id}", response_model=StudentFocusPreferencesResponse)
async def update_student_preferences(
    student_id: str,
    update_data: StudentFocusPreferencesUpdate,
    service: FocusTrackingService = Depends(get_focus_service)
):
    """학생 집중도 설정 업데이트"""
    from ..models.focus_tracking import StudentFocusPreferences

    prefs = service.db.query(StudentFocusPreferences).filter(
        StudentFocusPreferences.student_id == student_id
    ).first()

    if not prefs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preferences not found")

    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(prefs, key, value)

    prefs.updated_at = datetime.utcnow()
    service.db.commit()
    service.db.refresh(prefs)
    return prefs


# Analytics Endpoints
@router.get("/analytics/{student_id}", response_model=FocusAnalytics)
async def get_student_analytics(
    student_id: str,
    days: int = Query(30, ge=1, le=365, description="분석 기간 (일)"),
    service: FocusTrackingService = Depends(get_focus_service)
):
    """
    학생 집중도 분석 데이터 조회

    - 총 학습 시간
    - 평균 집중도 점수
    - 휴식 패턴
    - 선호하는 정신정렬 루틴
    """
    analytics = service.get_student_analytics(student_id, days)
    return analytics


# Health Check
@router.get("/health")
async def health_check():
    """API 상태 확인"""
    return {
        "status": "healthy",
        "service": "focus_tracking",
        "timestamp": datetime.utcnow().isoformat()
    }
