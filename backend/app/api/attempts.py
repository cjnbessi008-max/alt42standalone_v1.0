"""
Student Attempts API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from ..database import get_db
from ..models import StudentAttempt, Problem
from ..services import BottleneckDetector, PerformanceAnalyzer

router = APIRouter(prefix="/api/attempts", tags=["attempts"])


# Pydantic schemas
class AttemptCreate(BaseModel):
    student_id: UUID
    problem_id: UUID
    submitted_answer: Dict[str, Any]
    started_at: datetime
    attempt_number: int = 1
    hints_used: int = 0
    gave_up: bool = False
    confidence_level: int | None = None


class AttemptResponse(BaseModel):
    id: UUID
    student_id: UUID
    problem_id: UUID
    problem_type_id: UUID
    is_correct: bool
    time_spent_seconds: int
    submitted_at: datetime

    class Config:
        from_attributes = True


@router.post("", response_model=AttemptResponse, status_code=status.HTTP_201_CREATED)
async def submit_attempt(
    attempt_data: AttemptCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a student's attempt at a problem

    This will:
    1. Record the attempt
    2. Check if the answer is correct
    3. Update performance metrics
    4. Trigger bottleneck detection (in background)
    """
    # Get the problem to check the answer
    problem_query = select(Problem).where(Problem.id == attempt_data.problem_id)
    problem_result = await db.execute(problem_query)
    problem = problem_result.scalar_one_or_none()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem {attempt_data.problem_id} not found"
        )

    # Check if answer is correct
    is_correct = attempt_data.submitted_answer == problem.correct_answer

    # Create attempt record
    attempt = StudentAttempt(
        student_id=attempt_data.student_id,
        problem_id=attempt_data.problem_id,
        problem_type_id=problem.problem_type_id,
        submitted_answer=attempt_data.submitted_answer,
        is_correct=is_correct,
        started_at=attempt_data.started_at,
        submitted_at=datetime.utcnow(),
        attempt_number=attempt_data.attempt_number,
        hints_used=attempt_data.hints_used,
        gave_up=attempt_data.gave_up,
        confidence_level=attempt_data.confidence_level
    )

    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)

    # Update performance metrics
    analyzer = PerformanceAnalyzer(db)
    await analyzer.update_metrics_for_attempt(
        str(attempt_data.student_id),
        str(problem.problem_type_id),
        attempt
    )

    # Schedule bottleneck detection in background
    background_tasks.add_task(
        detect_bottlenecks_background,
        str(attempt_data.student_id),
        db
    )

    return attempt


async def detect_bottlenecks_background(student_id: str, db: AsyncSession):
    """Background task to detect bottlenecks"""
    detector = BottleneckDetector(db)
    await detector.analyze_student(student_id)
