"""Student attempts API endpoints."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.progress_tracker import ProgressTracker
from app.services.recommendation_engine import RecommendationEngine

router = APIRouter()


class AttemptCreate(BaseModel):
    """Attempt creation schema."""

    user_id: UUID
    problem_id: UUID
    strategy_id: Optional[UUID] = None
    student_answer: str
    is_correct: bool
    time_spent_seconds: int = Field(..., ge=0)
    hints_used: int = Field(default=0, ge=0)
    confidence_level: Optional[int] = Field(None, ge=1, le=5)


class AttemptResponse(BaseModel):
    """Attempt response schema."""

    attempt_id: str
    user_id: str
    problem_id: str
    strategy_id: Optional[str]
    is_correct: bool
    time_spent_seconds: int
    hints_used: int
    confidence_level: Optional[int]
    attempted_at: str


@router.post("", response_model=AttemptResponse, status_code=201)
async def record_attempt(
    attempt_data: AttemptCreate,
    db: AsyncSession = Depends(get_db),
):
    """Record a student's problem attempt.

    Args:
        attempt_data: Attempt data
        db: Database session

    Returns:
        Created attempt details
    """
    try:
        tracker = ProgressTracker(db)

        # Record the attempt
        attempt_id = await tracker.record_attempt(
            user_id=attempt_data.user_id,
            problem_id=attempt_data.problem_id,
            strategy_id=attempt_data.strategy_id,
            student_answer=attempt_data.student_answer,
            is_correct=attempt_data.is_correct,
            time_spent_seconds=attempt_data.time_spent_seconds,
            hints_used=attempt_data.hints_used,
            confidence_level=attempt_data.confidence_level,
        )

        # Update strategy mastery if strategy was used
        if attempt_data.strategy_id:
            from app.models import SolutionStrategy, Problem

            strategy = await db.get(SolutionStrategy, attempt_data.strategy_id)
            problem = await db.get(Problem, attempt_data.problem_id)

            if strategy and problem:
                rec_engine = RecommendationEngine(db)
                await rec_engine.update_strategy_mastery(
                    user_id=attempt_data.user_id,
                    strategy_type=strategy.strategy_type,
                    topic=problem.topic or "general",
                    is_correct=attempt_data.is_correct,
                )

        # Get the created attempt
        from app.models import StudentAttempt

        attempt = await db.get(StudentAttempt, attempt_id)

        return AttemptResponse(
            attempt_id=str(attempt.id),
            user_id=str(attempt.user_id),
            problem_id=str(attempt.problem_id),
            strategy_id=str(attempt.strategy_id) if attempt.strategy_id else None,
            is_correct=attempt.is_correct,
            time_spent_seconds=attempt.time_spent_seconds,
            hints_used=attempt.hints_used,
            confidence_level=attempt.confidence_level,
            attempted_at=attempt.attempted_at.isoformat(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record attempt: {str(e)}")


@router.get("/user/{user_id}/problem/{problem_id}", response_model=list[dict])
async def get_problem_attempts(
    user_id: UUID,
    problem_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all attempts for a user on a specific problem.

    Args:
        user_id: User ID
        problem_id: Problem ID
        db: Database session

    Returns:
        List of attempts
    """
    tracker = ProgressTracker(db)
    attempts = await tracker.get_problem_attempts(user_id, problem_id)
    return attempts


@router.get("/user/{user_id}/recent", response_model=list[dict])
async def get_recent_activity(
    user_id: UUID,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    """Get recent practice activity for a user.

    Args:
        user_id: User ID
        limit: Maximum number of activities
        db: Database session

    Returns:
        List of recent activities
    """
    tracker = ProgressTracker(db)
    activity = await tracker.get_recent_activity(user_id, limit)
    return activity
