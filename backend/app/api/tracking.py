"""
Learning Activity Tracking API
학습 세션, 이벤트, 문제 시도를 실시간으로 추적
"""
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..models import LearningSession, LearningEvent, ProblemAttempt, Student, Module
from ..schemas import (
    LearningSessionCreate, LearningSessionUpdate, LearningSessionResponse,
    LearningEventCreate, LearningEventResponse,
    ProblemAttemptCreate, ProblemAttemptResponse
)

router = APIRouter(prefix="/api/tracking", tags=["Learning Tracking"])


@router.post("/sessions", response_model=LearningSessionResponse)
async def create_session(
    session_data: LearningSessionCreate,
    db: Session = Depends(get_db)
):
    """
    새로운 학습 세션 시작
    """
    # 학생과 모듈 존재 확인
    student = db.query(Student).filter(Student.id == session_data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    module = db.query(Module).filter(Module.id == session_data.module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # 세션 생성
    session = LearningSession(
        student_id=session_data.student_id,
        module_id=session_data.module_id,
        started_at=session_data.started_at or datetime.utcnow()
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.patch("/sessions/{session_id}", response_model=LearningSessionResponse)
async def update_session(
    session_id: UUID,
    update_data: LearningSessionUpdate,
    db: Session = Depends(get_db)
):
    """
    학습 세션 업데이트 (종료 시 호출)
    """
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 업데이트
    if update_data.ended_at is not None:
        session.ended_at = update_data.ended_at
        # 총 시간 계산
        session.total_duration_seconds = int((session.ended_at - session.started_at).total_seconds())

    if update_data.is_completed is not None:
        session.is_completed = update_data.is_completed

    if update_data.dropout_point is not None:
        session.dropout_point = update_data.dropout_point

    # Active duration 계산 (이벤트 기반)
    if session.ended_at:
        events = db.query(LearningEvent).filter(
            LearningEvent.session_id == session_id
        ).order_by(LearningEvent.timestamp).all()

        if events:
            active_time = 0
            for i in range(len(events) - 1):
                time_diff = (events[i + 1].timestamp - events[i].timestamp).total_seconds()
                # 5분 이상 차이나면 비활동으로 간주
                if time_diff < 300:
                    active_time += time_diff

            session.active_duration_seconds = int(active_time)

    db.commit()
    db.refresh(session)

    return session


@router.get("/sessions/{session_id}", response_model=LearningSessionResponse)
async def get_session(
    session_id: UUID,
    db: Session = Depends(get_db)
):
    """
    세션 정보 조회
    """
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return session


@router.post("/events", response_model=LearningEventResponse)
async def create_event(
    event_data: LearningEventCreate,
    db: Session = Depends(get_db)
):
    """
    학습 이벤트 기록
    """
    session = db.query(LearningSession).filter(
        LearningSession.id == event_data.session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 마지막 이벤트 조회
    last_event = db.query(LearningEvent).filter(
        LearningEvent.session_id == event_data.session_id
    ).order_by(LearningEvent.timestamp.desc()).first()

    timestamp = event_data.timestamp or datetime.utcnow()
    time_since_last = None

    if last_event:
        time_since_last = int((timestamp - last_event.timestamp).total_seconds() * 1000)

    # 이벤트 생성
    event = LearningEvent(
        session_id=event_data.session_id,
        event_type=event_data.event_type,
        event_data=event_data.event_data,
        timestamp=timestamp,
        time_since_last_event_ms=time_since_last
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return event


@router.get("/sessions/{session_id}/events", response_model=List[LearningEventResponse])
async def get_session_events(
    session_id: UUID,
    db: Session = Depends(get_db)
):
    """
    세션의 모든 이벤트 조회
    """
    events = db.query(LearningEvent).filter(
        LearningEvent.session_id == session_id
    ).order_by(LearningEvent.timestamp).all()

    return events


@router.post("/attempts", response_model=ProblemAttemptResponse)
async def create_attempt(
    attempt_data: ProblemAttemptCreate,
    db: Session = Depends(get_db)
):
    """
    문제 시도 기록
    """
    session = db.query(LearningSession).filter(
        LearningSession.id == attempt_data.session_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 시도 생성
    attempt = ProblemAttempt(
        session_id=attempt_data.session_id,
        problem_id=attempt_data.problem_id,
        problem_type=attempt_data.problem_type,
        difficulty_level=attempt_data.difficulty_level,
        attempt_number=attempt_data.attempt_number,
        answer_data=attempt_data.answer_data,
        is_correct=attempt_data.is_correct,
        time_spent_seconds=attempt_data.time_spent_seconds,
        hints_used=attempt_data.hints_used
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # 이벤트도 자동 생성
    event = LearningEvent(
        session_id=attempt_data.session_id,
        event_type='answer_submit',
        event_data={
            'problem_id': attempt_data.problem_id,
            'is_correct': attempt_data.is_correct,
            'attempt_id': str(attempt.id)
        }
    )
    db.add(event)
    db.commit()

    return attempt


@router.get("/sessions/{session_id}/attempts", response_model=List[ProblemAttemptResponse])
async def get_session_attempts(
    session_id: UUID,
    db: Session = Depends(get_db)
):
    """
    세션의 모든 문제 시도 조회
    """
    attempts = db.query(ProblemAttempt).filter(
        ProblemAttempt.session_id == session_id
    ).order_by(ProblemAttempt.attempted_at).all()

    return attempts


@router.get("/students/{student_id}/sessions", response_model=List[LearningSessionResponse])
async def get_student_sessions(
    student_id: UUID,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    학생의 최근 세션 목록 조회
    """
    sessions = db.query(LearningSession).filter(
        LearningSession.student_id == student_id
    ).order_by(LearningSession.started_at.desc()).limit(limit).all()

    return sessions
