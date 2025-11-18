"""Usage Session API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models.usage_session import UsageSession
from ..schemas.usage_session import UsageSessionCreate, UsageSessionResponse

router = APIRouter()


@router.get("/", response_model=List[UsageSessionResponse])
def list_sessions(
    skip: int = 0,
    limit: int = 100,
    student_id: str = None,
    tool_id: str = None,
    context: str = None,
    start_date: datetime = None,
    end_date: datetime = None,
    db: Session = Depends(get_db)
):
    """List usage sessions with optional filters."""
    query = db.query(UsageSession)

    if student_id:
        query = query.filter(UsageSession.student_id == student_id)
    if tool_id:
        query = query.filter(UsageSession.tool_id == tool_id)
    if context:
        query = query.filter(UsageSession.context == context)
    if start_date:
        query = query.filter(UsageSession.session_start >= start_date)
    if end_date:
        query = query.filter(UsageSession.session_start <= end_date)

    sessions = query.order_by(UsageSession.session_start.desc()).offset(skip).limit(limit).all()
    return sessions


@router.post("/", response_model=UsageSessionResponse, status_code=201)
def create_session(session: UsageSessionCreate, db: Session = Depends(get_db)):
    """Create a new usage session."""
    db_session = UsageSession(**session.model_dump())
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.post("/bulk", status_code=201)
def create_sessions_bulk(sessions: List[UsageSessionCreate], db: Session = Depends(get_db)):
    """Create multiple usage sessions in bulk."""
    db_sessions = [UsageSession(**session.model_dump()) for session in sessions]
    db.add_all(db_sessions)
    db.commit()
    return {"message": f"Created {len(db_sessions)} sessions successfully"}


@router.get("/stats")
def get_session_stats(db: Session = Depends(get_db)):
    """Get overall session statistics."""
    from sqlalchemy import func

    total_sessions = db.query(func.count(UsageSession.id)).scalar()
    unique_students = db.query(func.count(func.distinct(UsageSession.student_id))).scalar()
    unique_tools = db.query(func.count(func.distinct(UsageSession.tool_id))).scalar()
    avg_duration = db.query(func.avg(UsageSession.duration_seconds)).scalar()

    return {
        "total_sessions": total_sessions,
        "unique_students": unique_students,
        "unique_tools": unique_tools,
        "average_duration_seconds": float(avg_duration) if avg_duration else 0
    }
