"""
Behavior Tracking API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
import logging

from app.db.database import get_db
from app.models.behavior import BehaviorEvent, LearningSession
from app.services.mind_wandering_detector import MindWanderingDetector

router = APIRouter()
logger = logging.getLogger(__name__)


class BehaviorEventCreate(BaseModel):
    """Request model for creating behavior events"""
    student_id: UUID
    module_id: UUID
    session_id: UUID
    event_type: str = Field(..., description="Type of event: mouse_move, click, scroll, focus, blur, etc.")
    event_data: Optional[dict] = None
    mouse_x: Optional[int] = None
    mouse_y: Optional[int] = None
    scroll_x: Optional[int] = None
    scroll_y: Optional[int] = None
    time_since_last_event: Optional[float] = None
    page_url: Optional[str] = None
    page_title: Optional[str] = None


class BehaviorEventBatch(BaseModel):
    """Batch of behavior events"""
    events: List[BehaviorEventCreate]


class SessionCreate(BaseModel):
    """Request model for creating learning sessions"""
    student_id: UUID
    module_id: UUID
    user_agent: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None


class SessionEnd(BaseModel):
    """Request model for ending a session"""
    session_id: UUID


@router.post("/events", status_code=201)
async def track_behavior_event(
    event: BehaviorEventCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Track a single behavior event

    This endpoint receives individual behavior events from the frontend
    and stores them for analysis.
    """
    try:
        behavior_event = BehaviorEvent(
            student_id=event.student_id,
            module_id=event.module_id,
            session_id=event.session_id,
            event_type=event.event_type,
            event_data=event.event_data,
            mouse_x=event.mouse_x,
            mouse_y=event.mouse_y,
            scroll_x=event.scroll_x,
            scroll_y=event.scroll_y,
            time_since_last_event=event.time_since_last_event,
            page_url=event.page_url,
            page_title=event.page_title
        )

        db.add(behavior_event)
        db.commit()
        db.refresh(behavior_event)

        # Trigger mind wandering analysis in background
        background_tasks.add_task(
            analyze_for_mind_wandering,
            db,
            str(event.student_id),
            str(event.session_id),
            str(event.module_id)
        )

        return {
            "success": True,
            "event_id": str(behavior_event.id),
            "message": "Behavior event tracked successfully"
        }

    except Exception as e:
        logger.error(f"Error tracking behavior event: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/events/batch", status_code=201)
async def track_behavior_events_batch(
    batch: BehaviorEventBatch,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Track multiple behavior events in a batch

    More efficient for tracking many events at once
    """
    try:
        behavior_events = []
        for event_data in batch.events:
            event = BehaviorEvent(
                student_id=event_data.student_id,
                module_id=event_data.module_id,
                session_id=event_data.session_id,
                event_type=event_data.event_type,
                event_data=event_data.event_data,
                mouse_x=event_data.mouse_x,
                mouse_y=event_data.mouse_y,
                scroll_x=event_data.scroll_x,
                scroll_y=event_data.scroll_y,
                time_since_last_event=event_data.time_since_last_event,
                page_url=event_data.page_url,
                page_title=event_data.page_title
            )
            behavior_events.append(event)

        db.bulk_save_objects(behavior_events)
        db.commit()

        # Trigger analysis for the latest event's session
        if batch.events:
            latest = batch.events[-1]
            background_tasks.add_task(
                analyze_for_mind_wandering,
                db,
                str(latest.student_id),
                str(latest.session_id),
                str(latest.module_id)
            )

        return {
            "success": True,
            "events_tracked": len(behavior_events),
            "message": "Batch behavior events tracked successfully"
        }

    except Exception as e:
        logger.error(f"Error tracking batch events: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/start", status_code=201)
async def start_learning_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db)
):
    """
    Start a new learning session

    Should be called when a student begins working on a module
    """
    try:
        session = LearningSession(
            student_id=session_data.student_id,
            module_id=session_data.module_id,
            user_agent=session_data.user_agent,
            device_type=session_data.device_type,
            browser=session_data.browser
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return {
            "success": True,
            "session_id": str(session.id),
            "started_at": session.started_at.isoformat(),
            "message": "Learning session started"
        }

    except Exception as e:
        logger.error(f"Error starting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/end")
async def end_learning_session(
    session_end: SessionEnd,
    db: Session = Depends(get_db)
):
    """
    End a learning session

    Should be called when a student finishes or leaves a module
    """
    try:
        session = db.query(LearningSession).filter(
            LearningSession.id == session_end.session_id
        ).first()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        session.ended_at = datetime.utcnow()
        session.duration_seconds = (
            session.ended_at - session.started_at
        ).total_seconds()

        # Count total events in this session
        event_count = db.query(BehaviorEvent).filter(
            BehaviorEvent.session_id == session_end.session_id
        ).count()

        session.total_events = event_count

        db.commit()
        db.refresh(session)

        return {
            "success": True,
            "session_id": str(session.id),
            "duration_seconds": session.duration_seconds,
            "total_events": session.total_events,
            "mind_wandering_count": session.mind_wandering_count,
            "engagement_score": session.engagement_score,
            "message": "Learning session ended"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error ending session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session_details(
    session_id: UUID,
    db: Session = Depends(get_db)
):
    """Get details about a learning session"""
    session = db.query(LearningSession).filter(
        LearningSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": str(session.id),
        "student_id": str(session.student_id),
        "module_id": str(session.module_id),
        "started_at": session.started_at.isoformat(),
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
        "duration_seconds": session.duration_seconds,
        "total_events": session.total_events,
        "mind_wandering_count": session.mind_wandering_count,
        "engagement_score": session.engagement_score
    }


def analyze_for_mind_wandering(
    db: Session,
    student_id: str,
    session_id: str,
    module_id: str
):
    """
    Background task to analyze behavior for mind wandering

    This runs asynchronously after behavior events are tracked
    """
    try:
        detector = MindWanderingDetector(db)
        result = detector.analyze_recent_behavior(student_id, session_id)

        if result and result.get("detected"):
            # Record the detection
            detector.record_detection(
                student_id=student_id,
                module_id=module_id,
                session_id=session_id,
                detection_result=result
            )
            logger.info(
                f"Mind wandering detected for student {student_id}: "
                f"confidence={result['confidence']:.2f}"
            )

    except Exception as e:
        logger.error(f"Error in mind wandering analysis: {str(e)}")
