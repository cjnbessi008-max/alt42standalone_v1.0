"""
DMN Detection and Rest Recommendation API
FastAPI endpoints for monitoring student engagement and recommending breaks
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timedelta
from uuid import UUID, uuid4
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# Pydantic Models (Request/Response schemas)
# =============================================================================

class ActivityEventRequest(BaseModel):
    """Request model for submitting student activity events"""
    student_id: UUID
    session_id: UUID
    module_id: Optional[UUID] = None
    event_type: Literal["click", "submit", "scroll", "focus_loss", "idle", "navigation", "error"]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

    # Optional event-specific fields
    response_time_ms: Optional[int] = Field(None, ge=0)
    is_correct: Optional[bool] = None
    content_position: Optional[float] = Field(None, ge=0.0, le=1.0)
    idle_duration_seconds: Optional[int] = Field(None, ge=0)
    window_focus_status: Optional[bool] = None

    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "550e8400-e29b-41d4-a716-446655440000",
                "session_id": "660e8400-e29b-41d4-a716-446655440001",
                "module_id": "770e8400-e29b-41d4-a716-446655440002",
                "event_type": "submit",
                "timestamp": "2025-11-18T10:30:00Z",
                "response_time_ms": 1500,
                "is_correct": True,
                "content_position": 0.75,
                "metadata": {
                    "problem_id": "prob_123",
                    "attempt_number": 2
                }
            }
        }


class ActivityEventResponse(BaseModel):
    """Response after processing activity event"""
    event_id: UUID
    dmn_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    fatigue_level: Optional[str] = None
    recommendation_triggered: bool = False
    message: str = "Activity recorded successfully"


class DMNStatusResponse(BaseModel):
    """Current DMN status for a student"""
    student_id: UUID
    current_session: Optional[Dict[str, Any]] = None
    dmn_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    fatigue_level: Optional[str] = None
    last_activity: Optional[datetime] = None
    session_duration_minutes: Optional[float] = None
    breaks_taken: int = 0
    recommendation: Optional[Dict[str, Any]] = None


class BreakRecommendationRequest(BaseModel):
    """Request for generating break recommendation"""
    student_id: UUID
    session_id: UUID
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)

    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "550e8400-e29b-41d4-a716-446655440000",
                "session_id": "660e8400-e29b-41d4-a716-446655440001",
                "context": {
                    "current_module": "fractions",
                    "difficulty": "medium",
                    "time_of_day": "afternoon"
                }
            }
        }


class BreakActivity(BaseModel):
    """Individual break activity suggestion"""
    type: str
    name: str
    description: str
    instructions: List[str]
    duration_minutes: int


class BreakRecommendationResponse(BaseModel):
    """Break recommendation with personalized activities"""
    recommendation_id: UUID
    break_type: str
    duration_minutes: int
    urgency_level: str
    activities: List[BreakActivity]
    motivational_message: str
    return_time: datetime
    tips: Optional[List[str]] = None


class BreakAcknowledgmentRequest(BaseModel):
    """Student acknowledgment of break recommendation"""
    recommendation_id: UUID
    student_id: UUID
    action: Literal["accept", "defer", "dismiss"]
    defer_minutes: Optional[int] = Field(None, ge=1, le=30)
    feedback: Optional[str] = None


class BreakAcknowledgmentResponse(BaseModel):
    """Response after acknowledging break"""
    recommendation_id: UUID
    status: str
    message: str
    defer_until: Optional[datetime] = None


class BreakCompletionRequest(BaseModel):
    """Report break completion and effectiveness"""
    recommendation_id: UUID
    student_id: UUID
    actual_duration_minutes: int = Field(ge=0)
    effectiveness_rating: int = Field(ge=1, le=5)
    feedback: Optional[str] = None


class LMSWebhookRequest(BaseModel):
    """LMS webhook event payload"""
    source: Literal["canvas", "moodle", "blackboard", "custom"]
    event_type: str
    user_id: str  # LMS-specific user ID
    timestamp: datetime
    payload: Dict[str, Any]


class StudentPreferencesRequest(BaseModel):
    """Update student rest preferences"""
    preferred_break_duration: Optional[int] = Field(None, ge=1, le=30)
    break_notification_enabled: Optional[bool] = None
    preferred_break_activities: Optional[List[str]] = None
    dmn_detection_sensitivity: Optional[float] = Field(None, ge=0.5, le=2.0)
    study_session_target_minutes: Optional[int] = Field(None, ge=10, le=120)
    break_interval_minutes: Optional[int] = Field(None, ge=10, le=60)
    notification_sound_enabled: Optional[bool] = None
    auto_accept_urgent_breaks: Optional[bool] = None


class StudentPreferencesResponse(BaseModel):
    """Student rest preferences"""
    student_id: UUID
    preferred_break_duration: int
    break_notification_enabled: bool
    preferred_break_activities: List[str]
    dmn_detection_sensitivity: float
    study_session_target_minutes: int
    break_interval_minutes: int
    notification_sound_enabled: bool
    auto_accept_urgent_breaks: bool
    updated_at: datetime


class AnalyticsSummary(BaseModel):
    """Analytics summary for a student"""
    student_id: UUID
    period_start: datetime
    period_end: datetime
    total_study_time_minutes: int
    total_sessions: int
    avg_session_duration_minutes: float
    total_breaks_recommended: int
    total_breaks_accepted: int
    break_acceptance_rate: float
    avg_dmn_score: float
    avg_effectiveness_rating: Optional[float] = None
    most_effective_break_type: Optional[str] = None


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title="DMN Detection & Rest Recommendation API",
    description="API for monitoring student cognitive state and recommending breaks",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Dependency Injection
# =============================================================================

# Note: In production, implement proper database connection pooling
# and dependency injection for database sessions

async def get_db():
    """Database session dependency (placeholder)"""
    # TODO: Implement actual database connection
    # from database import SessionLocal
    # db = SessionLocal()
    # try:
    #     yield db
    # finally:
    #     db.close()
    pass


async def get_current_user():
    """Authentication dependency (placeholder)"""
    # TODO: Implement JWT authentication
    pass


# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/")
async def root():
    """API health check"""
    return {
        "service": "DMN Detection & Rest Recommendation API",
        "status": "operational",
        "version": "1.0.0",
        "timestamp": datetime.utcnow()
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected",  # TODO: Check actual DB connection
        "timestamp": datetime.utcnow(),
        "uptime_seconds": 0  # TODO: Track actual uptime
    }


# =============================================================================
# Activity Tracking Endpoints
# =============================================================================

@app.post(
    "/api/v1/dmn/activity",
    response_model=ActivityEventResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Activity Tracking"]
)
async def submit_activity_event(
    event: ActivityEventRequest,
    background_tasks: BackgroundTasks,
    db=Depends(get_db)
):
    """
    Submit student activity event for DMN analysis

    This endpoint receives real-time activity events from the student webapp
    and processes them to calculate DMN activation scores.
    """
    try:
        logger.info(f"Received activity event: {event.event_type} for student {event.student_id}")

        # TODO: Implement database insertion
        event_id = uuid4()

        # TODO: Call DMN detection service
        # from services.dmn_detection import DMNDetectionService
        # dmn_service = DMNDetectionService(db)
        # dmn_result = await dmn_service.analyze_activity(event)

        # Placeholder response
        dmn_score = None
        fatigue_level = None
        recommendation_triggered = False

        # Background task to update session statistics
        # background_tasks.add_task(update_session_stats, event.session_id)

        return ActivityEventResponse(
            event_id=event_id,
            dmn_score=dmn_score,
            fatigue_level=fatigue_level,
            recommendation_triggered=recommendation_triggered,
            message="Activity recorded and analyzed successfully"
        )

    except Exception as e:
        logger.error(f"Error processing activity event: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process activity event: {str(e)}"
        )


@app.post(
    "/api/v1/dmn/activity/batch",
    status_code=status.HTTP_201_CREATED,
    tags=["Activity Tracking"]
)
async def submit_activity_batch(
    events: List[ActivityEventRequest],
    background_tasks: BackgroundTasks,
    db=Depends(get_db)
):
    """
    Submit multiple activity events in batch for efficiency
    """
    try:
        logger.info(f"Received batch of {len(events)} activity events")

        # TODO: Implement batch insertion
        event_ids = [uuid4() for _ in events]

        return {
            "processed_count": len(events),
            "event_ids": event_ids,
            "message": "Batch processed successfully"
        }

    except Exception as e:
        logger.error(f"Error processing activity batch: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process activity batch: {str(e)}"
        )


# =============================================================================
# DMN Status Endpoints
# =============================================================================

@app.get(
    "/api/v1/dmn/status/{student_id}",
    response_model=DMNStatusResponse,
    tags=["DMN Status"]
)
async def get_dmn_status(
    student_id: UUID,
    db=Depends(get_db)
):
    """
    Get current DMN activation status for a student

    Returns the latest DMN score, fatigue level, and active recommendation if any.
    """
    try:
        logger.info(f"Fetching DMN status for student {student_id}")

        # TODO: Query database for latest session and DMN score
        # from services.dmn_detection import DMNDetectionService
        # dmn_service = DMNDetectionService(db)
        # status = await dmn_service.get_student_status(student_id)

        # Placeholder response
        return DMNStatusResponse(
            student_id=student_id,
            current_session=None,
            dmn_score=None,
            fatigue_level=None,
            last_activity=None,
            session_duration_minutes=None,
            breaks_taken=0,
            recommendation=None
        )

    except Exception as e:
        logger.error(f"Error fetching DMN status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch DMN status: {str(e)}"
        )


@app.get(
    "/api/v1/dmn/session/{session_id}/timeline",
    tags=["DMN Status"]
)
async def get_session_dmn_timeline(
    session_id: UUID,
    db=Depends(get_db)
):
    """
    Get DMN score timeline for a specific session

    Returns time-series data of DMN scores throughout the session.
    """
    try:
        logger.info(f"Fetching DMN timeline for session {session_id}")

        # TODO: Query time-series DMN scores

        return {
            "session_id": session_id,
            "timeline": [],
            "summary": {
                "max_dmn_score": 0.0,
                "avg_dmn_score": 0.0,
                "critical_fatigue_events": 0
            }
        }

    except Exception as e:
        logger.error(f"Error fetching DMN timeline: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch DMN timeline: {str(e)}"
        )


# =============================================================================
# Break Recommendation Endpoints
# =============================================================================

@app.post(
    "/api/v1/dmn/recommend-break",
    response_model=BreakRecommendationResponse,
    tags=["Break Recommendations"]
)
async def generate_break_recommendation(
    request: BreakRecommendationRequest,
    db=Depends(get_db)
):
    """
    Generate personalized break recommendation for a student

    Analyzes current DMN score, student preferences, and context
    to generate an optimal break recommendation.
    """
    try:
        logger.info(f"Generating break recommendation for student {request.student_id}")

        # TODO: Call break recommendation engine
        # from services.break_recommendation import BreakRecommendationEngine
        # rec_engine = BreakRecommendationEngine(db)
        # recommendation = await rec_engine.generate_recommendation(request)

        # Placeholder response
        recommendation_id = uuid4()

        return BreakRecommendationResponse(
            recommendation_id=recommendation_id,
            break_type="active_rest",
            duration_minutes=5,
            urgency_level="moderate",
            activities=[
                BreakActivity(
                    type="physical",
                    name="Desk Stretches",
                    description="Simple stretching routine",
                    instructions=[
                        "Stand up and reach arms overhead",
                        "Rotate shoulders backward 10 times",
                        "Tilt head side to side gently"
                    ],
                    duration_minutes=3
                ),
                BreakActivity(
                    type="cognitive",
                    name="Mindful Breathing",
                    description="Deep breathing exercise",
                    instructions=[
                        "Close eyes gently",
                        "Breathe in slowly for 4 counts",
                        "Exhale slowly for 6 counts",
                        "Repeat 5 times"
                    ],
                    duration_minutes=2
                )
            ],
            motivational_message="Great work! Take a short break to refresh your mind.",
            return_time=datetime.utcnow() + timedelta(minutes=5),
            tips=[
                "Step away from your screen",
                "Drink some water",
                "Move your body gently"
            ]
        )

    except Exception as e:
        logger.error(f"Error generating break recommendation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate break recommendation: {str(e)}"
        )


@app.post(
    "/api/v1/dmn/break/acknowledge",
    response_model=BreakAcknowledgmentResponse,
    tags=["Break Recommendations"]
)
async def acknowledge_break_recommendation(
    request: BreakAcknowledgmentRequest,
    db=Depends(get_db)
):
    """
    Student acknowledges break recommendation

    Actions:
    - accept: Student accepts and will take the break
    - defer: Student wants to defer the break (must specify defer_minutes)
    - dismiss: Student dismisses the recommendation
    """
    try:
        logger.info(f"Break acknowledgment: {request.action} for recommendation {request.recommendation_id}")

        # TODO: Update break_recommendations table

        defer_until = None
        if request.action == "defer" and request.defer_minutes:
            defer_until = datetime.utcnow() + timedelta(minutes=request.defer_minutes)

        messages = {
            "accept": "Break accepted. Enjoy your rest!",
            "defer": f"Break deferred for {request.defer_minutes} minutes.",
            "dismiss": "Break dismissed. Remember to take breaks regularly!"
        }

        return BreakAcknowledgmentResponse(
            recommendation_id=request.recommendation_id,
            status=request.action,
            message=messages[request.action],
            defer_until=defer_until
        )

    except Exception as e:
        logger.error(f"Error acknowledging break: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to acknowledge break: {str(e)}"
        )


@app.post(
    "/api/v1/dmn/break/complete",
    tags=["Break Recommendations"]
)
async def complete_break(
    request: BreakCompletionRequest,
    db=Depends(get_db)
):
    """
    Report break completion and effectiveness

    Students can rate how effective the break was (1-5 scale)
    and provide optional feedback.
    """
    try:
        logger.info(f"Break completed: {request.recommendation_id}")

        # TODO: Update break_recommendations table with completion data

        return {
            "recommendation_id": request.recommendation_id,
            "status": "completed",
            "message": "Thank you for the feedback! This helps us improve break recommendations.",
            "effectiveness_rating": request.effectiveness_rating
        }

    except Exception as e:
        logger.error(f"Error completing break: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete break: {str(e)}"
        )


@app.get(
    "/api/v1/dmn/break/activities",
    response_model=List[BreakActivity],
    tags=["Break Recommendations"]
)
async def get_break_activities(
    activity_type: Optional[str] = None,
    duration_max: Optional[int] = None,
    db=Depends(get_db)
):
    """
    Get available break activities from the template library
    """
    try:
        # TODO: Query break_activity_templates table

        return []

    except Exception as e:
        logger.error(f"Error fetching break activities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch break activities: {str(e)}"
        )


# =============================================================================
# LMS Integration Endpoints
# =============================================================================

@app.post(
    "/api/v1/dmn/lms/webhook",
    status_code=status.HTTP_202_ACCEPTED,
    tags=["LMS Integration"]
)
async def receive_lms_webhook(
    webhook: LMSWebhookRequest,
    background_tasks: BackgroundTasks,
    db=Depends(get_db)
):
    """
    Receive activity events from LMS platforms

    Supported LMS platforms:
    - Canvas LMS
    - Moodle
    - Blackboard
    - Custom LMS
    """
    try:
        logger.info(f"Received LMS webhook from {webhook.source}: {webhook.event_type}")

        # TODO: Insert into lms_integration_logs
        # Background task to process webhook and map to student activity
        # background_tasks.add_task(process_lms_webhook, webhook)

        return {
            "status": "accepted",
            "message": "Webhook received and queued for processing",
            "webhook_id": str(uuid4())
        }

    except Exception as e:
        logger.error(f"Error receiving LMS webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process LMS webhook: {str(e)}"
        )


@app.get(
    "/api/v1/dmn/lms/mapping/{lms_user_id}",
    tags=["LMS Integration"]
)
async def get_lms_user_mapping(
    lms_user_id: str,
    lms_source: str,
    db=Depends(get_db)
):
    """
    Get student ID mapping for LMS user
    """
    try:
        # TODO: Query user mapping table

        return {
            "lms_user_id": lms_user_id,
            "lms_source": lms_source,
            "student_id": None,
            "mapped": False
        }

    except Exception as e:
        logger.error(f"Error fetching LMS mapping: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch LMS mapping: {str(e)}"
        )


# =============================================================================
# Student Preferences Endpoints
# =============================================================================

@app.get(
    "/api/v1/dmn/preferences/{student_id}",
    response_model=StudentPreferencesResponse,
    tags=["Student Preferences"]
)
async def get_student_preferences(
    student_id: UUID,
    db=Depends(get_db)
):
    """
    Get student rest preferences
    """
    try:
        logger.info(f"Fetching preferences for student {student_id}")

        # TODO: Query student_rest_preferences table

        # Return defaults if no preferences found
        return StudentPreferencesResponse(
            student_id=student_id,
            preferred_break_duration=5,
            break_notification_enabled=True,
            preferred_break_activities=["stretch", "water", "walk"],
            dmn_detection_sensitivity=1.0,
            study_session_target_minutes=25,
            break_interval_minutes=25,
            notification_sound_enabled=True,
            auto_accept_urgent_breaks=False,
            updated_at=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error fetching preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch preferences: {str(e)}"
        )


@app.put(
    "/api/v1/dmn/preferences/{student_id}",
    response_model=StudentPreferencesResponse,
    tags=["Student Preferences"]
)
async def update_student_preferences(
    student_id: UUID,
    preferences: StudentPreferencesRequest,
    db=Depends(get_db)
):
    """
    Update student rest preferences
    """
    try:
        logger.info(f"Updating preferences for student {student_id}")

        # TODO: Update student_rest_preferences table

        return StudentPreferencesResponse(
            student_id=student_id,
            preferred_break_duration=preferences.preferred_break_duration or 5,
            break_notification_enabled=preferences.break_notification_enabled if preferences.break_notification_enabled is not None else True,
            preferred_break_activities=preferences.preferred_break_activities or ["stretch", "water", "walk"],
            dmn_detection_sensitivity=preferences.dmn_detection_sensitivity or 1.0,
            study_session_target_minutes=preferences.study_session_target_minutes or 25,
            break_interval_minutes=preferences.break_interval_minutes or 25,
            notification_sound_enabled=preferences.notification_sound_enabled if preferences.notification_sound_enabled is not None else True,
            auto_accept_urgent_breaks=preferences.auto_accept_urgent_breaks if preferences.auto_accept_urgent_breaks is not None else False,
            updated_at=datetime.utcnow()
        )

    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update preferences: {str(e)}"
        )


# =============================================================================
# Analytics Endpoints
# =============================================================================

@app.get(
    "/api/v1/dmn/analytics/{student_id}",
    response_model=AnalyticsSummary,
    tags=["Analytics"]
)
async def get_student_analytics(
    student_id: UUID,
    period_days: int = 7,
    db=Depends(get_db)
):
    """
    Get analytics summary for a student over a period
    """
    try:
        logger.info(f"Fetching analytics for student {student_id}")

        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=period_days)

        # TODO: Query analytics from database

        return AnalyticsSummary(
            student_id=student_id,
            period_start=period_start,
            period_end=period_end,
            total_study_time_minutes=0,
            total_sessions=0,
            avg_session_duration_minutes=0.0,
            total_breaks_recommended=0,
            total_breaks_accepted=0,
            break_acceptance_rate=0.0,
            avg_dmn_score=0.0,
            avg_effectiveness_rating=None,
            most_effective_break_type=None
        )

    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch analytics: {str(e)}"
        )


@app.get(
    "/api/v1/dmn/analytics/class/{class_id}",
    tags=["Analytics"]
)
async def get_class_analytics(
    class_id: str,
    period_days: int = 7,
    db=Depends(get_db)
):
    """
    Get aggregated analytics for a class (teacher view)
    """
    try:
        logger.info(f"Fetching class analytics for {class_id}")

        # TODO: Query aggregated analytics

        return {
            "class_id": class_id,
            "period_days": period_days,
            "total_students": 0,
            "avg_dmn_score": 0.0,
            "students_at_risk": [],
            "break_effectiveness": 0.0,
            "engagement_trends": []
        }

    except Exception as e:
        logger.error(f"Error fetching class analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch class analytics: {str(e)}"
        )


# =============================================================================
# WebSocket for Real-time Updates (Optional Enhancement)
# =============================================================================

# from fastapi import WebSocket, WebSocketDisconnect
# from typing import List
#
# class ConnectionManager:
#     def __init__(self):
#         self.active_connections: Dict[str, WebSocket] = {}
#
#     async def connect(self, student_id: str, websocket: WebSocket):
#         await websocket.accept()
#         self.active_connections[student_id] = websocket
#
#     def disconnect(self, student_id: str):
#         if student_id in self.active_connections:
#             del self.active_connections[student_id]
#
#     async def send_notification(self, student_id: str, message: dict):
#         if student_id in self.active_connections:
#             await self.active_connections[student_id].send_json(message)
#
# manager = ConnectionManager()
#
# @app.websocket("/ws/dmn/{student_id}")
# async def websocket_endpoint(websocket: WebSocket, student_id: str):
#     """
#     WebSocket connection for real-time DMN updates and break notifications
#     """
#     await manager.connect(student_id, websocket)
#     try:
#         while True:
#             # Keep connection alive and send real-time updates
#             data = await websocket.receive_json()
#             # Process incoming messages if needed
#     except WebSocketDisconnect:
#         manager.disconnect(student_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
