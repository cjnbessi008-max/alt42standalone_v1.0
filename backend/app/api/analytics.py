"""Analytics API endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.progress_tracker import ProgressTracker

router = APIRouter()


class SessionStartRequest(BaseModel):
    """Request to start practice session."""

    user_id: UUID
    session_type: str = "free_practice"


class SessionEndRequest(BaseModel):
    """Request to end practice session."""

    total_problems: int
    problems_correct: int
    strategies_explored: int


@router.get("/user/{user_id}/statistics", response_model=dict)
async def get_statistics(
    user_id: UUID,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """Get comprehensive statistics for a student.

    Args:
        user_id: User ID
        days: Number of days to look back
        db: Database session

    Returns:
        Student statistics
    """
    tracker = ProgressTracker(db)
    stats = await tracker.get_student_statistics(user_id, days)
    return stats


@router.get("/user/{user_id}/insights", response_model=dict)
async def get_insights(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get AI-powered learning insights for a student.

    Args:
        user_id: User ID
        db: Database session

    Returns:
        Learning insights and recommendations
    """
    tracker = ProgressTracker(db)
    insights = await tracker.get_learning_insights(user_id)
    return insights


@router.post("/sessions", response_model=dict, status_code=201)
async def start_session(
    request: SessionStartRequest,
    db: AsyncSession = Depends(get_db),
):
    """Start a new practice session.

    Args:
        request: Session start request
        db: Database session

    Returns:
        Session ID
    """
    if request.session_type not in ["guided", "free_practice", "challenge", "review"]:
        raise HTTPException(
            status_code=400,
            detail="Session type must be 'guided', 'free_practice', 'challenge', or 'review'",
        )

    tracker = ProgressTracker(db)
    session_id = await tracker.start_practice_session(
        user_id=request.user_id,
        session_type=request.session_type,
    )

    return {"session_id": str(session_id)}


@router.patch("/sessions/{session_id}", response_model=dict)
async def end_session(
    session_id: UUID,
    request: SessionEndRequest,
    db: AsyncSession = Depends(get_db),
):
    """End a practice session.

    Args:
        session_id: Session ID
        request: Session end request
        db: Database session

    Returns:
        Success status
    """
    tracker = ProgressTracker(db)
    await tracker.end_practice_session(
        session_id=session_id,
        total_problems=request.total_problems,
        problems_correct=request.problems_correct,
        strategies_explored=request.strategies_explored,
    )

    return {"success": True, "session_id": str(session_id)}
