"""Focus session API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..schemas.focus_session import FocusSessionCreate, FocusSessionUpdate, FocusSessionResponse
from ..schemas.focus_metrics import FocusMetricsCreate, FocusMetricsResponse
from ..models.focus_session import FocusSession
from ..models.focus_metrics import FocusMetrics
from ..services.focus_analyzer import FocusAnalyzer
from ..api.auth import oauth2_scheme
from ..services.auth_service import AuthService

router = APIRouter(prefix="/sessions", tags=["focus-sessions"])


@router.post("", response_model=FocusSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    session_data: FocusSessionCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Create a new focus session."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    session = FocusSession(
        user_id=user.id,
        module_name=session_data.module_name,
        day_of_week=session_data.day_of_week,
        hour_of_day=session_data.hour_of_day,
        session_start=datetime.utcnow()
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.get("", response_model=List[FocusSessionResponse])
def get_user_sessions(
    skip: int = 0,
    limit: int = 100,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get all sessions for current user."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    sessions = db.query(FocusSession).filter(
        FocusSession.user_id == user.id
    ).order_by(FocusSession.created_at.desc()).offset(skip).limit(limit).all()

    return sessions


@router.get("/{session_id}", response_model=FocusSessionResponse)
def get_session(
    session_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get a specific session."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    session = db.query(FocusSession).filter(
        FocusSession.id == session_id,
        FocusSession.user_id == user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    return session


@router.patch("/{session_id}", response_model=FocusSessionResponse)
def update_session(
    session_id: int,
    session_update: FocusSessionUpdate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Update a focus session."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    session = db.query(FocusSession).filter(
        FocusSession.id == session_id,
        FocusSession.user_id == user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Update fields
    update_data = session_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)

    # Calculate duration if session ended
    if session_update.session_end:
        session.calculate_duration()

    db.commit()
    db.refresh(session)

    return session


@router.post("/{session_id}/metrics", response_model=FocusMetricsResponse, status_code=status.HTTP_201_CREATED)
def create_metric(
    session_id: int,
    metric_data: FocusMetricsCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Add a focus metric to a session."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    # Verify session belongs to user
    session = db.query(FocusSession).filter(
        FocusSession.id == session_id,
        FocusSession.user_id == user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    metric = FocusMetrics(**metric_data.model_dump())
    db.add(metric)

    # Update session interaction count
    session.interaction_count += 1

    db.commit()
    db.refresh(metric)

    return metric


@router.get("/{session_id}/metrics", response_model=List[FocusMetricsResponse])
def get_session_metrics(
    session_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get all metrics for a session."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    # Verify session belongs to user
    session = db.query(FocusSession).filter(
        FocusSession.id == session_id,
        FocusSession.user_id == user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    metrics = db.query(FocusMetrics).filter(
        FocusMetrics.session_id == session_id
    ).order_by(FocusMetrics.recorded_at).all()

    return metrics


@router.post("/{session_id}/analyze")
def analyze_session(
    session_id: int,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Analyze a focus session and calculate scores."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    # Verify session belongs to user
    session = db.query(FocusSession).filter(
        FocusSession.id == session_id,
        FocusSession.user_id == user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    try:
        analysis = FocusAnalyzer.analyze_session(session_id, db)
        return analysis
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
