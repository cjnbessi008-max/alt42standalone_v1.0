"""
FastAPI routes for emotion detection
"""
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from loguru import logger

from backend.schemas.emotion_schemas import (
    BehaviorEventCreate,
    BehaviorEventResponse,
    EmotionStateResponse,
    EmotionAnalysisRequest,
    EmotionPatternResponse,
    EmotionDashboardData,
    LMSIntegrationConfig,
)
from backend.services.emotion_analyzer import EmotionAnalyzer
from backend.services.lms_connector import LMSConnector, LMSConnectorFactory

router = APIRouter(prefix="/api/emotions", tags=["emotions"])

# Global instances (in production, use dependency injection)
emotion_analyzer = EmotionAnalyzer(use_ai=False)  # Set to True to enable Claude AI
lms_connector: Optional[LMSConnector] = None


@router.post("/behavior-events", response_model=BehaviorEventResponse, status_code=201)
async def track_behavior_event(
    event: BehaviorEventCreate,
    background_tasks: BackgroundTasks,
):
    """
    Track a student behavior event and analyze emotions

    This endpoint receives behavior events from the frontend tracking component
    and performs real-time emotion analysis.
    """
    try:
        # In production, save to database
        logger.info(f"Received behavior event: {event.event_type} from student {event.student_id}")

        # Trigger background emotion analysis
        background_tasks.add_task(
            analyze_emotion_async,
            str(event.student_id),
            str(event.session_id),
            str(event.module_id)
        )

        # Return response
        return BehaviorEventResponse(
            id=UUID("123e4567-e89b-12d3-a456-426614174000"),  # Mock ID
            student_id=event.student_id,
            session_id=event.session_id,
            module_id=event.module_id,
            event_type=event.event_type,
            timestamp=datetime.utcnow(),
        )

    except Exception as e:
        logger.error(f"Error tracking behavior event: {e}")
        raise HTTPException(status_code=500, detail="Failed to track behavior event")


@router.post("/analyze", response_model=EmotionStateResponse)
async def analyze_emotions(request: EmotionAnalysisRequest):
    """
    Analyze emotions for a learning session

    Analyzes behavior events within the specified time window and returns
    detected emotional states.
    """
    try:
        logger.info(f"Analyzing emotions for session {request.session_id}")

        # In production, fetch events from database
        # For now, use mock data
        mock_events = _generate_mock_events(request.student_id, request.session_id)

        # Analyze emotions
        analysis_result = emotion_analyzer.analyze_emotion(
            mock_events,
            window_minutes=request.window_minutes
        )

        # In production, save emotion state to database
        emotion_state = EmotionStateResponse(
            id=UUID("123e4567-e89b-12d3-a456-426614174100"),
            student_id=request.student_id,
            session_id=request.session_id,
            module_id=UUID("123e4567-e89b-12d3-a456-426614174002"),
            frustration_score=analysis_result['frustration_score'],
            concentration_score=analysis_result['concentration_score'],
            confusion_score=analysis_result['confusion_score'],
            primary_emotion=analysis_result['primary_emotion'],
            confidence=analysis_result['confidence'],
            events_analyzed=len(mock_events),
            detected_at=datetime.utcnow(),
            analysis_method=analysis_result['analysis_method'],
        )

        # Send alert to LMS if concerning emotion detected
        if lms_connector and analysis_result['confidence'] > 0.7:
            if analysis_result['primary_emotion'] in ['frustration', 'confusion']:
                await lms_connector.send_emotion_alert(
                    student_id=str(request.student_id),
                    session_id=str(request.session_id),
                    module_id="mock_module",
                    emotion_data=analysis_result,
                    severity='high' if analysis_result['confidence'] > 0.85 else 'medium'
                )

        return emotion_state

    except Exception as e:
        logger.error(f"Error analyzing emotions: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze emotions")


@router.get("/dashboard/{session_id}", response_model=EmotionDashboardData)
async def get_emotion_dashboard(
    session_id: UUID,
    student_id: UUID,
):
    """
    Get comprehensive emotion dashboard data for a session

    Returns current emotion state, history, pattern analysis, and recommendations.
    """
    try:
        logger.info(f"Fetching emotion dashboard for session {session_id}")

        # In production, fetch from database
        # Mock response
        dashboard = EmotionDashboardData(
            student_id=student_id,
            session_id=session_id,
            current_emotion=EmotionStateResponse(
                id=UUID("123e4567-e89b-12d3-a456-426614174100"),
                student_id=student_id,
                session_id=session_id,
                module_id=UUID("123e4567-e89b-12d3-a456-426614174002"),
                frustration_score=0.3,
                concentration_score=0.7,
                confusion_score=0.1,
                primary_emotion="concentration",
                confidence=0.85,
                events_analyzed=25,
                detected_at=datetime.utcnow(),
                analysis_method="rule_based",
            ),
            emotion_history=[],
            pattern_analysis=None,
            alerts=[],
            recommendations=["Student is concentrating well. Maintain current difficulty level."],
        )

        return dashboard

    except Exception as e:
        logger.error(f"Error fetching emotion dashboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")


@router.get("/patterns/{student_id}", response_model=List[EmotionPatternResponse])
async def get_emotion_patterns(
    student_id: UUID,
    days: int = 7,
):
    """
    Get emotion patterns for a student over time

    Returns aggregated emotion patterns for analysis and intervention planning.
    """
    try:
        logger.info(f"Fetching emotion patterns for student {student_id} (last {days} days)")

        # In production, fetch from database and analyze
        # Mock response
        patterns = []

        return patterns

    except Exception as e:
        logger.error(f"Error fetching emotion patterns: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch emotion patterns")


@router.post("/lms/configure")
async def configure_lms_integration(config: LMSIntegrationConfig):
    """
    Configure LMS integration settings

    Sets up connection to the Learning Management System for sending
    emotion alerts and recommendations.
    """
    try:
        global lms_connector

        logger.info(f"Configuring LMS integration: {config.lms_type}")

        lms_connector = LMSConnectorFactory.create_connector({
            "lms_type": config.lms_type,
            "lms_url": config.lms_url,
            "api_key": config.api_key,
            "webhook_url": config.webhook_url,
            "course_id": config.course_id,
        })

        # Test connection
        connection_ok = await lms_connector.test_connection()

        if not connection_ok:
            raise HTTPException(
                status_code=400,
                detail="Failed to connect to LMS. Please check configuration."
            )

        return {
            "status": "success",
            "message": f"LMS integration configured for {config.lms_type}",
            "connection_test": "passed",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error configuring LMS integration: {e}")
        raise HTTPException(status_code=500, detail="Failed to configure LMS integration")


@router.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "healthy",
        "service": "emotion-detection-api",
        "timestamp": datetime.utcnow().isoformat(),
        "emotion_analyzer": "active",
        "lms_connector": "active" if lms_connector else "not_configured",
    }


# Background tasks

async def analyze_emotion_async(student_id: str, session_id: str, module_id: str):
    """
    Background task to analyze emotions after receiving behavior events

    This allows the API to respond quickly while processing happens asynchronously.
    """
    try:
        logger.info(f"Background emotion analysis for session {session_id}")

        # In production:
        # 1. Fetch recent behavior events from database
        # 2. Run emotion analysis
        # 3. Save emotion state
        # 4. Check if intervention needed
        # 5. Send LMS alert if necessary

        await asyncio.sleep(1)  # Simulate processing
        logger.info(f"Background analysis complete for session {session_id}")

    except Exception as e:
        logger.error(f"Error in background emotion analysis: {e}")


# Helper functions

def _generate_mock_events(student_id: UUID, session_id: UUID) -> List[dict]:
    """
    Generate mock behavior events for testing

    In production, this would fetch real events from the database.
    """
    base_time = datetime.utcnow() - timedelta(minutes=5)

    events = []
    for i in range(10):
        events.append({
            'event_type': 'click' if i % 3 == 0 else 'keypress',
            'timestamp': base_time + timedelta(seconds=i * 20),
            'student_id': student_id,
            'session_id': session_id,
            'is_correct_answer': 'correct' if i % 2 == 0 else 'incorrect',
            'mouse_speed': 200 + (i * 50),
            'attempt_number': i + 1,
        })

    return events


# Import asyncio for background tasks
import asyncio
