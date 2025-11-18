"""
Emotion Refresh Routine - API Routes
====================================
FastAPI routes for emotion tracking and refresh routines.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from typing import Optional
from uuid import UUID

from models.emotion import (
    EmotionCheckInRequest,
    EmotionCheckInResponse,
    GenerateActivityRequest,
    GenerateActivityResponse,
    CompleteSessionRequest,
    CompleteSessionResponse,
    StudentEmotionHistoryResponse,
    EmotionAnalyticsResponse,
    ErrorResponse,
)
from services.emotion_service import EmotionService
from services.routine_generator import RoutineGeneratorService


# Router instance
router = APIRouter(prefix="/api", tags=["emotions"])


# Dependency injection (to be configured in main.py)
async def get_emotion_service() -> EmotionService:
    """Get emotion service instance"""
    # This will be overridden in main.py with actual dependency
    raise NotImplementedError("Emotion service dependency not configured")


async def get_routine_generator() -> RoutineGeneratorService:
    """Get routine generator service instance"""
    # This will be overridden in main.py with actual dependency
    raise NotImplementedError("Routine generator dependency not configured")


# ============================================================================
# Emotion Check-in Endpoints
# ============================================================================

@router.post(
    "/emotions/check-in",
    response_model=EmotionCheckInResponse,
    status_code=201,
    summary="Create emotion check-in",
    description="Record a student's current emotional state"
)
async def create_emotion_check_in(
    request: EmotionCheckInRequest,
    service: EmotionService = Depends(get_emotion_service)
) -> EmotionCheckInResponse:
    """
    Create a new emotion check-in for a student.

    This endpoint records the student's current emotional state and may
    suggest a refresh activity if appropriate.

    Returns:
        EmotionCheckInResponse with check-in ID and optional activity suggestion
    """
    try:
        return await service.create_check_in(request)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create check-in: {str(e)}"
        )


@router.get(
    "/emotions/student/{student_id}",
    response_model=StudentEmotionHistoryResponse,
    summary="Get student emotion history",
    description="Retrieve a student's emotion history and trends"
)
async def get_student_emotion_history(
    student_id: UUID,
    days: int = Query(default=7, ge=1, le=90, description="Number of days to look back"),
    service: EmotionService = Depends(get_emotion_service)
) -> StudentEmotionHistoryResponse:
    """
    Get emotion history for a specific student.

    Args:
        student_id: UUID of the student
        days: Number of days to look back (1-90, default 7)

    Returns:
        StudentEmotionHistoryResponse with emotion trends and statistics
    """
    try:
        return await service.get_student_history(student_id, days)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get student history: {str(e)}"
        )


@router.get(
    "/emotions/analytics/{module_id}",
    response_model=EmotionAnalyticsResponse,
    summary="Get module emotion analytics",
    description="Get aggregated emotion analytics for teacher dashboard"
)
async def get_module_analytics(
    module_id: UUID,
    date: Optional[str] = Query(
        default=None,
        description="Date in YYYY-MM-DD format (default: today)",
        regex=r"^\d{4}-\d{2}-\d{2}$"
    ),
    service: EmotionService = Depends(get_emotion_service)
) -> EmotionAnalyticsResponse:
    """
    Get emotion analytics for a module (teacher dashboard).

    This provides aggregated, anonymized data about student emotions
    and refresh routine participation.

    Args:
        module_id: UUID of the module
        date: Date to get analytics for (YYYY-MM-DD format)

    Returns:
        EmotionAnalyticsResponse with aggregated analytics
    """
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d") if date else None
        return await service.get_module_analytics(module_id, date_obj)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get analytics: {str(e)}"
        )


# ============================================================================
# Refresh Activity Endpoints
# ============================================================================

@router.post(
    "/refresh/generate",
    response_model=GenerateActivityResponse,
    status_code=201,
    summary="Generate refresh activity",
    description="Generate a personalized 1-minute refresh activity using AI"
)
async def generate_refresh_activity(
    request: GenerateActivityRequest,
    service: RoutineGeneratorService = Depends(get_routine_generator)
) -> GenerateActivityResponse:
    """
    Generate a personalized refresh activity using Claude AI.

    The activity is customized based on:
    - Student's current emotion
    - Grade level
    - Past activity preferences
    - Current learning context

    Returns:
        GenerateActivityResponse with activity content and session ID
    """
    try:
        return await service.generate_activity(request)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate activity: {str(e)}"
        )


@router.post(
    "/refresh/complete",
    response_model=CompleteSessionResponse,
    summary="Complete refresh session",
    description="Mark a refresh session as completed and record outcomes"
)
async def complete_refresh_session(
    request: CompleteSessionRequest,
    service: RoutineGeneratorService = Depends(get_routine_generator)
) -> CompleteSessionResponse:
    """
    Complete a refresh session and record the outcomes.

    This endpoint:
    - Records post-activity emotional state
    - Calculates improvement score
    - Updates activity statistics
    - Generates encouraging feedback
    - Checks for earned badges

    Returns:
        CompleteSessionResponse with improvement metrics and feedback
    """
    try:
        return await service.complete_session(request)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete session: {str(e)}"
        )


# ============================================================================
# Health Check Endpoint
# ============================================================================

@router.get(
    "/health",
    summary="Health check",
    description="Check if the emotion API is healthy"
)
async def health_check():
    """
    Health check endpoint.

    Returns:
        Status message
    """
    return {
        "status": "healthy",
        "service": "emotion-refresh-routine",
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# Error Handlers
# ============================================================================

# These would typically be registered in main.py
"""
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            detail=None
        ).dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc)
        ).dict()
    )
"""
