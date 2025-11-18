from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.problem import Problem
from app.models.progress import StudentProgress, StudentAttempt, StageType
from app.schemas.progress import (
    StudentProgressResponse,
    ConfirmReadingRequest,
    StartSolvingRequest,
    StudentAttemptCreate,
    SubmitAnswerResponse,
)
from app.core.security import get_current_user

router = APIRouter(prefix="/api/progress", tags=["Student Progress"])


@router.post("/{problem_id}/start", response_model=StudentProgressResponse, status_code=status.HTTP_201_CREATED)
def start_problem(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Start a problem - initializes reading stage"""
    # Check if problem exists
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    # Check if student already has progress for this problem
    existing_progress = db.query(StudentProgress).filter(
        StudentProgress.student_id == current_user.id,
        StudentProgress.problem_id == problem_id
    ).first()

    if existing_progress:
        # Return existing progress
        return existing_progress

    # Create new progress record
    new_progress = StudentProgress(
        student_id=current_user.id,
        problem_id=problem_id,
        current_stage=StageType.READING,
        reading_started_at=datetime.utcnow(),
    )

    db.add(new_progress)
    db.commit()
    db.refresh(new_progress)

    return new_progress


@router.post("/{problem_id}/confirm-reading", response_model=StudentProgressResponse)
def confirm_reading(
    problem_id: str,
    request: ConfirmReadingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Confirm that student has read and understood the problem"""
    # Get student's progress
    progress = db.query(StudentProgress).filter(
        StudentProgress.student_id == current_user.id,
        StudentProgress.problem_id == problem_id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress not found. Please start the problem first."
        )

    if progress.current_stage != StageType.READING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not in reading stage"
        )

    # Minimum reading time check (5 seconds)
    if request.reading_duration_seconds < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please spend at least 5 seconds reading the problem"
        )

    # Update progress
    progress.reading_confirmed = True
    progress.reading_completed = True
    progress.reading_completed_at = datetime.utcnow()
    progress.reading_duration_seconds = request.reading_duration_seconds

    db.commit()
    db.refresh(progress)

    return progress


@router.post("/{problem_id}/start-solving", response_model=StudentProgressResponse)
def start_solving(
    problem_id: str,
    request: StartSolvingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Transition from reading stage to solving stage"""
    # Get student's progress
    progress = db.query(StudentProgress).filter(
        StudentProgress.student_id == current_user.id,
        StudentProgress.problem_id == problem_id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress not found. Please start the problem first."
        )

    if not progress.reading_completed or not progress.reading_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must complete reading stage first"
        )

    if progress.current_stage == StageType.SOLVING:
        # Already in solving stage
        return progress

    # Transition to solving stage
    progress.current_stage = StageType.SOLVING
    progress.solving_started_at = datetime.utcnow()

    db.commit()
    db.refresh(progress)

    return progress


@router.post("/{problem_id}/submit-answer", response_model=SubmitAnswerResponse)
def submit_answer(
    problem_id: str,
    attempt_data: StudentAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit an answer for the problem"""
    # Get student's progress
    progress = db.query(StudentProgress).filter(
        StudentProgress.student_id == current_user.id,
        StudentProgress.problem_id == problem_id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress not found. Please start the problem first."
        )

    if progress.current_stage != StageType.SOLVING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must be in solving stage to submit answer"
        )

    # Get the problem
    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    # Check if answer is correct
    is_correct = attempt_data.submitted_answer.strip().lower() == problem.correct_answer.strip().lower()

    # Get current attempt number
    total_attempts = db.query(StudentAttempt).filter(
        StudentAttempt.progress_id == progress.id
    ).count()
    attempt_number = total_attempts + 1

    # Create attempt record
    new_attempt = StudentAttempt(
        student_id=current_user.id,
        problem_id=problem_id,
        progress_id=progress.id,
        attempt_number=attempt_number,
        submitted_answer=attempt_data.submitted_answer,
        is_correct=is_correct,
        time_spent_seconds=attempt_data.time_spent_seconds,
    )

    db.add(new_attempt)

    # If correct, mark as completed
    if is_correct:
        progress.solving_completed = True
        progress.solving_completed_at = datetime.utcnow()
        progress.current_stage = StageType.COMPLETED

        if attempt_data.time_spent_seconds:
            progress.solving_duration_seconds = attempt_data.time_spent_seconds

    db.commit()
    db.refresh(new_attempt)

    return {
        "attempt": new_attempt,
        "is_correct": is_correct,
        "correct_answer": problem.correct_answer if is_correct else "Try again!",
        "explanation": problem.explanation if is_correct else None,
        "attempt_number": attempt_number,
        "total_attempts": attempt_number,
    }


@router.get("/{problem_id}", response_model=StudentProgressResponse)
def get_progress(
    problem_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get student's progress for a specific problem"""
    progress = db.query(StudentProgress).filter(
        StudentProgress.student_id == current_user.id,
        StudentProgress.problem_id == problem_id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No progress found for this problem"
        )

    return progress


@router.get("/", response_model=List[StudentProgressResponse])
def get_all_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all progress records for the current student"""
    progress_records = db.query(StudentProgress).filter(
        StudentProgress.student_id == current_user.id
    ).all()

    return progress_records
