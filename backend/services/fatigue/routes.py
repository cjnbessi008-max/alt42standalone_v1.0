"""
FastAPI routes for Fatigue Monitoring System

REST API endpoints for session management, metrics tracking, break recommendations,
and analytics.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from .models import (
    FatigueSession, FatigueMetric, BreakRecommendation,
    StudentFatigueProfile, FatigueAnalyticsSnapshot,
    FatigueSessionCreate, FatigueSessionResponse,
    FatigueMetricCreate, FatigueMetricResponse,
    BreakRecommendationResponse, BreakCompleteRequest,
    StudentFatigueProfileResponse, FatigueAnalyticsResponse
)
from .calculator import (
    FatigueCalculator, PersonalizedFatigueCalculator,
    FatigueInput, FatigueResult
)
from .websocket_manager import WebSocketManager

# Initialize router
router = APIRouter(prefix='/api/fatigue', tags=['Fatigue Monitoring'])

# WebSocket manager for real-time updates
ws_manager = WebSocketManager()


# Dependency for database session
def get_db():
    """Get database session (implement based on your DB setup)"""
    # This is a placeholder - implement based on your database configuration
    from backend.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# Session Management Endpoints
# ============================================================================

@router.post('/sessions', response_model=FatigueSessionResponse)
async def create_fatigue_session(
    session_data: FatigueSessionCreate,
    db: Session = Depends(get_db)
):
    """
    Start a new fatigue tracking session.

    Args:
        session_data: Student and module IDs
        db: Database session

    Returns:
        Created FatigueSession
    """
    # Check if student already has an active session
    active_session = db.query(FatigueSession).filter(
        and_(
            FatigueSession.student_id == UUID(session_data.student_id),
            FatigueSession.session_end.is_(None)
        )
    ).first()

    if active_session:
        raise HTTPException(
            status_code=400,
            detail=f"Student already has an active session: {active_session.id}"
        )

    # Create new session
    new_session = FatigueSession(
        student_id=UUID(session_data.student_id),
        module_id=UUID(session_data.module_id)
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Initialize or update student profile
    profile = db.query(StudentFatigueProfile).filter_by(
        student_id=UUID(session_data.student_id)
    ).first()

    if not profile:
        profile = StudentFatigueProfile(student_id=UUID(session_data.student_id))
        db.add(profile)

    profile.total_sessions += 1
    db.commit()

    return FatigueSessionResponse(
        id=str(new_session.id),
        student_id=str(new_session.student_id),
        module_id=str(new_session.module_id),
        session_start=new_session.session_start,
        session_end=new_session.session_end,
        duration_minutes=new_session.duration_minutes,
        fatigue_score=float(new_session.fatigue_score),
        fatigue_level=new_session.fatigue_level,
        break_count=new_session.break_count,
        is_active=new_session.is_active
    )


@router.get('/sessions/{session_id}', response_model=FatigueSessionResponse)
async def get_fatigue_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Get details of a specific fatigue session.

    Args:
        session_id: UUID of the session
        db: Database session

    Returns:
        FatigueSession details
    """
    session = db.query(FatigueSession).filter_by(id=UUID(session_id)).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return FatigueSessionResponse(
        id=str(session.id),
        student_id=str(session.student_id),
        module_id=str(session.module_id),
        session_start=session.session_start,
        session_end=session.session_end,
        duration_minutes=session.current_duration_minutes,
        fatigue_score=float(session.fatigue_score),
        fatigue_level=session.fatigue_level,
        break_count=session.break_count,
        is_active=session.is_active
    )


@router.put('/sessions/{session_id}/end', response_model=FatigueSessionResponse)
async def end_fatigue_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    End an active fatigue session.

    Args:
        session_id: UUID of the session
        db: Database session

    Returns:
        Updated FatigueSession with final metrics
    """
    session = db.query(FatigueSession).filter_by(id=UUID(session_id)).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.session_end:
        raise HTTPException(status_code=400, detail="Session already ended")

    # End session
    session.session_end = datetime.utcnow()
    session.duration_minutes = int((session.session_end - session.session_start).total_seconds() / 60)

    # Update student profile
    profile = db.query(StudentFatigueProfile).filter_by(
        student_id=session.student_id
    ).first()

    if profile:
        profile.total_learning_minutes += session.duration_minutes
        profile.total_break_minutes += session.total_break_minutes

        # Update compliance rate
        breaks_recommended = db.query(func.count(BreakRecommendation.id)).filter_by(
            student_id=session.student_id
        ).scalar()

        breaks_taken = db.query(func.count(BreakRecommendation.id)).filter(
            and_(
                BreakRecommendation.student_id == session.student_id,
                BreakRecommendation.status == 'accepted'
            )
        ).scalar()

        profile.update_compliance_rate(breaks_recommended, breaks_taken)

    db.commit()
    db.refresh(session)

    return FatigueSessionResponse(
        id=str(session.id),
        student_id=str(session.student_id),
        module_id=str(session.module_id),
        session_start=session.session_start,
        session_end=session.session_end,
        duration_minutes=session.duration_minutes,
        fatigue_score=float(session.fatigue_score),
        fatigue_level=session.fatigue_level,
        break_count=session.break_count,
        is_active=False
    )


@router.get('/sessions/active', response_model=List[FatigueSessionResponse])
async def get_active_sessions(
    student_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get all active sessions, optionally filtered by student.

    Args:
        student_id: Optional student UUID filter
        db: Database session

    Returns:
        List of active sessions
    """
    query = db.query(FatigueSession).filter(FatigueSession.session_end.is_(None))

    if student_id:
        query = query.filter(FatigueSession.student_id == UUID(student_id))

    sessions = query.all()

    return [
        FatigueSessionResponse(
            id=str(s.id),
            student_id=str(s.student_id),
            module_id=str(s.module_id),
            session_start=s.session_start,
            session_end=s.session_end,
            duration_minutes=s.current_duration_minutes,
            fatigue_score=float(s.fatigue_score),
            fatigue_level=s.fatigue_level,
            break_count=s.break_count,
            is_active=True
        )
        for s in sessions
    ]


# ============================================================================
# Metrics Tracking Endpoints
# ============================================================================

@router.post('/metrics', response_model=FatigueMetricResponse)
async def record_fatigue_metric(
    metric_data: FatigueMetricCreate,
    db: Session = Depends(get_db)
):
    """
    Record a new fatigue measurement and calculate current fatigue score.

    Args:
        metric_data: Metric data including complexity, performance, etc.
        db: Database session

    Returns:
        Calculated fatigue score and recommendation
    """
    # Get session
    session = db.query(FatigueSession).filter_by(id=UUID(metric_data.session_id)).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.session_end:
        raise HTTPException(status_code=400, detail="Cannot add metrics to ended session")

    # Calculate session duration
    session_duration = (datetime.utcnow() - session.session_start).total_seconds() / 60

    # Calculate error rate
    error_rate = 0.0
    if metric_data.problems_completed > 0:
        error_rate = 1 - (metric_data.correct_answers / metric_data.problems_completed)

    # Calculate average response time
    avg_response_time = 0.0
    if metric_data.response_times:
        avg_response_time = sum(metric_data.response_times) / len(metric_data.response_times)

    # Get student profile for personalization
    profile = db.query(StudentFatigueProfile).filter_by(
        student_id=session.student_id
    ).first()

    # Choose calculator
    if profile:
        calculator = PersonalizedFatigueCalculator(
            student_fatigue_rate=float(profile.average_fatigue_rate),
            student_recovery_rate=float(profile.recovery_rate),
            optimal_session_duration=profile.optimal_session_duration
        )
    else:
        calculator = FatigueCalculator()

    # Calculate fatigue
    fatigue_input = FatigueInput(
        session_duration_minutes=session_duration,
        complexity_level=metric_data.complexity_level,
        error_rate=error_rate,
        actual_pace=metric_data.problems_completed / max(session_duration, 1),
        expected_pace=0.5,  # TODO: Get from module settings
        time_of_day=datetime.utcnow().hour,
        interaction_count=metric_data.interaction_count,
        previous_fatigue_score=float(session.fatigue_score)
    )

    result = calculator.calculate(fatigue_input)

    # Create metric record
    new_metric = FatigueMetric(
        session_id=session.id,
        student_id=session.student_id,
        fatigue_score=result.fatigue_score,
        session_duration_minutes=int(session_duration),
        complexity_level=metric_data.complexity_level,
        error_rate=error_rate,
        problems_completed=metric_data.problems_completed,
        correct_answers=metric_data.correct_answers,
        response_time_avg_seconds=avg_response_time,
        interaction_count=metric_data.interaction_count
    )

    db.add(new_metric)

    # Update session
    session.fatigue_score = result.fatigue_score
    session.fatigue_level = result.fatigue_level
    session.active_learning_minutes = int(session_duration)

    if result.fatigue_score > float(session.peak_fatigue_score):
        session.peak_fatigue_score = result.fatigue_score

    db.commit()
    db.refresh(new_metric)

    # Check if break recommendation needed
    break_recommendation = None
    if result.recommendation and result.fatigue_level >= 3:
        # Check if there's already a pending recommendation
        pending = db.query(BreakRecommendation).filter(
            and_(
                BreakRecommendation.session_id == session.id,
                BreakRecommendation.status == 'pending'
            )
        ).first()

        if not pending:
            break_type, duration = calculator.recommend_break_duration(result.fatigue_score)

            break_recommendation = BreakRecommendation(
                session_id=session.id,
                student_id=session.student_id,
                fatigue_score_at_recommendation=result.fatigue_score,
                break_type=break_type,
                duration_minutes=duration,
                reason=result.recommendation
            )

            db.add(break_recommendation)
            session.break_count += 1
            db.commit()

    # Send WebSocket update
    await ws_manager.broadcast_to_session(
        str(session.id),
        {
            'event': 'fatigue_updated',
            'data': {
                'session_id': str(session.id),
                'fatigue_score': result.fatigue_score,
                'fatigue_level': result.fatigue_level,
                'trend': result.trend
            }
        }
    )

    # Send break recommendation if created
    if break_recommendation:
        await ws_manager.broadcast_to_student(
            str(session.student_id),
            {
                'event': 'break_recommended',
                'data': {
                    'recommendation_id': str(break_recommendation.id),
                    'break_type': break_recommendation.break_type,
                    'duration_minutes': break_recommendation.duration_minutes,
                    'reason': break_recommendation.reason,
                    'urgency': 'high' if result.fatigue_level >= 4 else 'medium'
                }
            }
        )

    return FatigueMetricResponse(
        id=str(new_metric.id),
        session_id=str(session.id),
        timestamp=new_metric.timestamp,
        fatigue_score=result.fatigue_score,
        fatigue_level=result.fatigue_level,
        recommendation=result.recommendation,
        trend=result.trend
    )


@router.get('/metrics/{session_id}', response_model=List[FatigueMetricResponse])
async def get_session_metrics(
    session_id: str,
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db)
):
    """
    Get all fatigue metrics for a session.

    Args:
        session_id: UUID of the session
        limit: Maximum number of metrics to return
        db: Database session

    Returns:
        List of fatigue metrics ordered by timestamp
    """
    metrics = db.query(FatigueMetric).filter_by(
        session_id=UUID(session_id)
    ).order_by(desc(FatigueMetric.timestamp)).limit(limit).all()

    return [
        FatigueMetricResponse(
            id=str(m.id),
            session_id=str(m.session_id),
            timestamp=m.timestamp,
            fatigue_score=float(m.fatigue_score),
            fatigue_level=1,  # Calculate from score
            recommendation=None,
            trend='stable'
        )
        for m in metrics
    ]


# ============================================================================
# Break Management Endpoints
# ============================================================================

@router.post('/breaks/recommend', response_model=BreakRecommendationResponse)
async def create_break_recommendation(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Manually request a break recommendation.

    Args:
        session_id: UUID of the session
        db: Database session

    Returns:
        BreakRecommendation
    """
    session = db.query(FatigueSession).filter_by(id=UUID(session_id)).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    calculator = FatigueCalculator()
    break_type, duration = calculator.recommend_break_duration(float(session.fatigue_score))

    recommendation = BreakRecommendation(
        session_id=session.id,
        student_id=session.student_id,
        fatigue_score_at_recommendation=session.fatigue_score,
        break_type=break_type,
        duration_minutes=duration,
        reason="Student-requested break"
    )

    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)

    return BreakRecommendationResponse(
        id=str(recommendation.id),
        session_id=str(recommendation.session_id),
        break_type=recommendation.break_type,
        duration_minutes=recommendation.duration_minutes,
        reason=recommendation.reason,
        status=recommendation.status,
        fatigue_score=float(recommendation.fatigue_score_at_recommendation),
        urgency='medium'
    )


@router.put('/breaks/{recommendation_id}/accept')
async def accept_break(
    recommendation_id: str,
    db: Session = Depends(get_db)
):
    """Accept a break recommendation and start the break."""
    recommendation = db.query(BreakRecommendation).filter_by(
        id=UUID(recommendation_id)
    ).first()

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    recommendation.status = 'accepted'
    recommendation.actual_break_start = datetime.utcnow()

    db.commit()

    return {"message": "Break accepted", "break_start": recommendation.actual_break_start}


@router.put('/breaks/{recommendation_id}/complete')
async def complete_break(
    recommendation_id: str,
    data: BreakCompleteRequest,
    db: Session = Depends(get_db)
):
    """Mark a break as completed."""
    recommendation = db.query(BreakRecommendation).filter_by(
        id=UUID(recommendation_id)
    ).first()

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    recommendation.actual_break_end = datetime.utcnow()
    recommendation.actual_duration_minutes = data.actual_duration_minutes
    recommendation.activities_during_break = data.activities

    # Update session break time
    session = db.query(FatigueSession).filter_by(id=recommendation.session_id).first()
    if session:
        session.total_break_minutes += data.actual_duration_minutes

    db.commit()

    return {"message": "Break completed", "total_break_time": session.total_break_minutes}


@router.put('/breaks/{recommendation_id}/dismiss')
async def dismiss_break(
    recommendation_id: str,
    reason: str = Query(...),
    db: Session = Depends(get_db)
):
    """Dismiss a break recommendation."""
    recommendation = db.query(BreakRecommendation).filter_by(
        id=UUID(recommendation_id)
    ).first()

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    recommendation.status = 'dismissed'
    recommendation.dismissal_reason = reason

    db.commit()

    return {"message": "Break dismissed"}


# ============================================================================
# WebSocket Endpoint for Real-time Updates
# ============================================================================

@router.websocket('/realtime/{session_id}')
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time fatigue updates.

    Args:
        websocket: WebSocket connection
        session_id: Session UUID to subscribe to
    """
    await ws_manager.connect(websocket, session_id)

    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_json()

            # Handle client events (e.g., break activity reporting)
            if data.get('event') == 'break_activity':
                # Process break activity
                pass

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, session_id)
