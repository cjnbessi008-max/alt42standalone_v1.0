"""
Submission API Routes with Vibration Alert Support

Handles student answer submissions and provides vibration feedback
for high-risk wrong answer scenarios.
"""

from typing import Optional
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field

from services.vibration_service import (
    VibrationService,
    VibrationConfig,
    create_vibration_service
)


# Router instance
router = APIRouter(prefix="/api/modules", tags=["submissions"])


# Request/Response Models

class AnswerSubmission(BaseModel):
    """Student answer submission request"""
    student_id: UUID = Field(description="UUID of the student")
    problem_id: UUID = Field(description="UUID of the problem")
    answer_numerator: Optional[int] = Field(None, description="Numerator of fraction answer")
    answer_denominator: Optional[int] = Field(None, description="Denominator of fraction answer")
    time_spent_seconds: Optional[int] = Field(None, description="Time spent on problem")
    device_info: Optional[dict] = Field(None, description="Device information")

    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "550e8400-e29b-41d4-a716-446655440000",
                "problem_id": "550e8400-e29b-41d4-a716-446655440001",
                "answer_numerator": 3,
                "answer_denominator": 4,
                "time_spent_seconds": 120,
                "device_info": {
                    "vibration_supported": True,
                    "user_agent": "Mozilla/5.0..."
                }
            }
        }


class FeedbackResponse(BaseModel):
    """Feedback response for student submission"""
    is_correct: bool = Field(description="Whether answer was correct")
    feedback_text: str = Field(description="Textual feedback message")
    next_action: str = Field(description="Next action: retry, continue, review")
    attempt_number: int = Field(description="Current attempt number")
    risk_level: Optional[str] = Field(None, description="Risk level: low, medium, high")
    vibration: Optional[VibrationConfig] = Field(None, description="Vibration configuration")
    assessment_details: Optional[dict] = Field(None, description="Additional assessment info")
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "is_correct": False,
                "feedback_text": "Not quite right. Try thinking about the relationship between the numerator and denominator.",
                "next_action": "retry",
                "attempt_number": 2,
                "risk_level": "medium",
                "vibration": {
                    "trigger": True,
                    "pattern": "double_pulse",
                    "duration_ms": 250,
                    "intensity": 5,
                    "pulses": [100, 50, 100]
                },
                "assessment_details": {
                    "attempt_count": 2,
                    "concept_importance": 0.8,
                    "time_spent_seconds": 120
                },
                "timestamp": "2025-11-18T10:30:00Z"
            }
        }


class VibrationEventLog(BaseModel):
    """Vibration event logging request"""
    student_id: UUID
    problem_id: UUID
    module_id: UUID
    pattern: str
    device_supported: bool
    user_agent: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Dependency injection
async def get_vibration_service():
    """Get vibration service instance (placeholder for actual DB connection)"""
    # In production: db = get_database_connection()
    db = None  # Placeholder
    return create_vibration_service(db)


# API Endpoints

@router.post(
    "/{module_id}/submit",
    response_model=FeedbackResponse,
    summary="Submit student answer with vibration support",
    description="""
    Submit a student's answer to a problem and receive feedback with optional
    vibration alert for high-risk wrong answers.

    The endpoint:
    1. Validates the submitted answer
    2. Assesses risk level based on attempt history and problem metadata
    3. Generates appropriate feedback
    4. Returns vibration configuration if applicable
    """
)
async def submit_answer(
    module_id: UUID,
    submission: AnswerSubmission,
    user_agent: Optional[str] = Header(None),
    vibration_service: VibrationService = Depends(get_vibration_service)
):
    """
    Submit student answer and receive feedback with vibration alert

    Args:
        module_id: UUID of the module
        submission: Answer submission data
        user_agent: User agent string from request header
        vibration_service: Injected vibration service

    Returns:
        FeedbackResponse with feedback and optional vibration config
    """
    try:
        # Step 1: Validate answer against correct answer
        is_correct = await validate_answer(
            submission.problem_id,
            submission.answer_numerator,
            submission.answer_denominator
        )

        # Step 2: Get attempt count
        attempt_number = await get_attempt_number(
            submission.student_id,
            submission.problem_id
        )

        # Step 3: Assess risk level
        risk_level, assessment_details = await vibration_service.assess_risk_level(
            student_id=submission.student_id,
            problem_id=submission.problem_id,
            module_id=module_id,
            is_correct=is_correct
        )

        # Step 4: Generate vibration config if needed
        vibration_config = None
        device_supported = submission.device_info.get("vibration_supported", False) if submission.device_info else False

        if device_supported:
            vibration_config = await vibration_service.generate_vibration_config(
                student_id=submission.student_id,
                problem_id=submission.problem_id,
                module_id=module_id,
                is_correct=is_correct
            )

        # Step 5: Generate feedback text
        feedback_text = generate_feedback_text(
            is_correct=is_correct,
            risk_level=risk_level,
            attempt_number=attempt_number
        )

        # Step 6: Determine next action
        next_action = determine_next_action(
            is_correct=is_correct,
            attempt_number=attempt_number
        )

        # Step 7: Record attempt in database
        attempt_id = await record_student_attempt(
            student_id=submission.student_id,
            module_id=module_id,
            problem_id=submission.problem_id,
            answer_numerator=submission.answer_numerator,
            answer_denominator=submission.answer_denominator,
            is_correct=is_correct,
            time_spent_seconds=submission.time_spent_seconds,
            attempt_number=attempt_number
        )

        # Step 8: Update attempt with vibration data
        if vibration_config and vibration_config.trigger:
            await vibration_service.update_student_attempt(
                attempt_id=attempt_id,
                vibration_triggered=True,
                vibration_pattern=vibration_config.pattern.value,
                risk_level=risk_level
            )

            # Step 9: Log vibration event
            await vibration_service.log_vibration_event(
                student_id=submission.student_id,
                problem_id=submission.problem_id,
                module_id=module_id,
                is_correct=is_correct,
                vibration_config=vibration_config,
                device_supported=device_supported,
                user_agent=user_agent or "Unknown",
                risk_level=risk_level,
                attempt_number=attempt_number
            )

        # Step 10: Build and return response
        return FeedbackResponse(
            is_correct=is_correct,
            feedback_text=feedback_text,
            next_action=next_action,
            attempt_number=attempt_number,
            risk_level=risk_level.value,
            vibration=vibration_config,
            assessment_details=assessment_details
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing submission: {str(e)}"
        )


@router.post(
    "/{module_id}/vibration/event",
    summary="Log vibration event from client",
    description="Log vibration event for analytics when triggered on client side"
)
async def log_vibration_event(
    module_id: UUID,
    event: VibrationEventLog,
    vibration_service: VibrationService = Depends(get_vibration_service)
):
    """
    Log vibration event from client for analytics

    Args:
        module_id: UUID of the module
        event: Vibration event data
        vibration_service: Injected vibration service

    Returns:
        Success confirmation
    """
    try:
        # Note: This is called from client after vibration is actually triggered
        # to confirm the vibration occurred and track device compatibility

        return {
            "status": "logged",
            "event_id": str(UUID('00000000-0000-0000-0000-000000000000')),  # Placeholder
            "timestamp": datetime.utcnow()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error logging vibration event: {str(e)}"
        )


@router.get(
    "/{module_id}/vibration/settings",
    summary="Get vibration settings for module",
    description="Retrieve vibration configuration for a specific module"
)
async def get_vibration_settings(
    module_id: UUID,
    vibration_service: VibrationService = Depends(get_vibration_service)
):
    """
    Get vibration settings for module

    Args:
        module_id: UUID of the module
        vibration_service: Injected vibration service

    Returns:
        Vibration settings configuration
    """
    try:
        settings = await vibration_service._get_vibration_settings(module_id)
        return settings.dict()

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching vibration settings: {str(e)}"
        )


@router.put(
    "/{module_id}/vibration/settings",
    summary="Update vibration settings for module",
    description="Update vibration configuration (teacher/admin only)"
)
async def update_vibration_settings(
    module_id: UUID,
    settings: dict,
    vibration_service: VibrationService = Depends(get_vibration_service)
):
    """
    Update vibration settings for module

    Args:
        module_id: UUID of the module
        settings: New settings configuration
        vibration_service: Injected vibration service

    Returns:
        Updated settings
    """
    try:
        # TODO: Add authentication/authorization check
        # Validate settings
        # Update database

        return {
            "status": "updated",
            "module_id": str(module_id),
            "settings": settings,
            "updated_at": datetime.utcnow()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error updating vibration settings: {str(e)}"
        )


# Helper functions (to be implemented with actual logic)

async def validate_answer(
    problem_id: UUID,
    answer_numerator: Optional[int],
    answer_denominator: Optional[int]
) -> bool:
    """Validate student answer against correct answer"""
    # TODO: Implement actual validation logic
    # Query correct answer from database
    # Compare with submitted answer
    # Handle edge cases (equivalent fractions, etc.)
    return False  # Placeholder


async def get_attempt_number(student_id: UUID, problem_id: UUID) -> int:
    """Get current attempt number for this problem"""
    # TODO: Query database for attempt count
    return 1  # Placeholder


def generate_feedback_text(
    is_correct: bool,
    risk_level: str,
    attempt_number: int
) -> str:
    """Generate appropriate feedback text based on context"""
    if is_correct:
        return "Excellent work! That's correct."

    if attempt_number == 1:
        return "Not quite right. Take another look at the problem."
    elif attempt_number == 2:
        return "That's still not correct. Try breaking the problem into smaller steps."
    elif attempt_number >= 3:
        if risk_level == "high":
            return "This is a challenging problem. Consider reviewing the concept before trying again."
        else:
            return "Let's try a different approach. Think about what each part represents."

    return "Keep trying! You're making progress."


def determine_next_action(is_correct: bool, attempt_number: int) -> str:
    """Determine next action for student"""
    if is_correct:
        return "continue"
    elif attempt_number >= 5:
        return "review"  # Suggest reviewing concept
    else:
        return "retry"


async def record_student_attempt(
    student_id: UUID,
    module_id: UUID,
    problem_id: UUID,
    answer_numerator: Optional[int],
    answer_denominator: Optional[int],
    is_correct: bool,
    time_spent_seconds: Optional[int],
    attempt_number: int
) -> UUID:
    """Record student attempt in database"""
    # TODO: Insert into student_attempts table
    return UUID('00000000-0000-0000-0000-000000000000')  # Placeholder
