"""
Student attempt API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ...database import get_db
from ...models.attempt import StudentAttempt
from ...models.module import Problem
from ...schemas.attempt import AttemptCreate, AttemptResponse

router = APIRouter()


@router.post("/", response_model=AttemptResponse, status_code=201)
def submit_attempt(attempt: AttemptCreate, db: Session = Depends(get_db)):
    """
    Submit a student's attempt to solve a problem.
    This is the core endpoint that feeds data into TES calculation.
    """
    # Get the problem to check correct answer
    problem = db.query(Problem).filter(Problem.id == attempt.problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Check if answer is correct
    is_correct = attempt.student_answer.strip().lower() == problem.correct_answer.strip().lower()

    # Count previous attempts for this student-problem pair
    previous_attempts = db.query(StudentAttempt).filter(
        StudentAttempt.student_id == attempt.student_id,
        StudentAttempt.problem_id == attempt.problem_id
    ).count()

    attempt_number = previous_attempts + 1

    # Create attempt record
    db_attempt = StudentAttempt(
        student_id=attempt.student_id,
        module_id=attempt.module_id,
        problem_id=attempt.problem_id,
        student_answer=attempt.student_answer,
        is_correct=is_correct,
        time_spent_seconds=attempt.time_spent_seconds,
        attempt_number=attempt_number,
        hints_used=attempt.hints_used,
        problem_type=problem.problem_type,  # Denormalized for performance
    )

    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)

    return db_attempt


@router.get("/student/{student_id}/module/{module_id}", response_model=List[AttemptResponse])
def get_student_attempts(
    student_id: UUID,
    module_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all attempts for a student in a specific module."""
    attempts = db.query(StudentAttempt).filter(
        StudentAttempt.student_id == student_id,
        StudentAttempt.module_id == module_id
    ).order_by(StudentAttempt.attempted_at.desc()).all()

    return attempts


@router.get("/student/{student_id}", response_model=List[AttemptResponse])
def get_all_student_attempts(
    student_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all attempts for a student across all modules."""
    attempts = db.query(StudentAttempt).filter(
        StudentAttempt.student_id == student_id
    ).order_by(StudentAttempt.attempted_at.desc()).offset(skip).limit(limit).all()

    return attempts
