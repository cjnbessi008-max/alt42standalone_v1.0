"""
Attempt submission and progress tracking endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import json
from ..models import get_db, Attempt, Problem, Student, StudentProgress
from ..schemas import AttemptCreate, AttemptResponse, StudentProgressResponse

router = APIRouter(prefix="/attempts", tags=["attempts"])


def calculate_score(
    is_correct: bool,
    base_points: int,
    time_spent: int,
    time_limit: int,
    attempt_number: int
) -> int:
    """Calculate score based on correctness, speed, and attempt number"""
    if not is_correct:
        return 0

    score = base_points

    # Time bonus (up to 50% extra for fast completion)
    if time_spent and time_limit:
        time_ratio = time_spent / time_limit
        if time_ratio < 0.5:
            score = int(score * 1.5)
        elif time_ratio < 0.75:
            score = int(score * 1.25)

    # Penalty for multiple attempts
    if attempt_number > 1:
        score = int(score * (1 - 0.1 * (attempt_number - 1)))

    return max(score, 0)


@router.post("/", response_model=AttemptResponse, status_code=status.HTTP_201_CREATED)
async def submit_attempt(attempt: AttemptCreate, db: Session = Depends(get_db)):
    """Submit an attempt for a problem"""
    # Verify student exists
    student = db.query(Student).filter(Student.id == attempt.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    # Verify problem exists
    problem = db.query(Problem).filter(Problem.id == attempt.problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    # Get attempt count for this student and problem
    attempt_count = db.query(Attempt).filter(
        Attempt.student_id == attempt.student_id,
        Attempt.problem_id == attempt.problem_id
    ).count()

    # Check if max attempts reached
    if attempt_count >= problem.max_attempts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum attempts ({problem.max_attempts}) reached for this problem"
        )

    # Check if answer is correct
    target_sequence = json.loads(problem.target_sequence)
    is_correct = attempt.submitted_sequence == target_sequence

    # Generate feedback
    if is_correct:
        feedback = "Correct! Well done!"
    else:
        feedback = f"Incorrect. You have {problem.max_attempts - attempt_count - 1} attempts remaining."

    # Calculate score
    score = calculate_score(
        is_correct,
        problem.points,
        attempt.time_spent_seconds or 0,
        problem.time_limit_seconds,
        attempt_count + 1
    )

    # Create attempt record
    db_attempt = Attempt(
        student_id=attempt.student_id,
        problem_id=attempt.problem_id,
        submitted_sequence=json.dumps(attempt.submitted_sequence),
        is_correct=is_correct,
        time_spent_seconds=attempt.time_spent_seconds,
        score=score,
        attempt_number=attempt_count + 1,
        feedback=feedback
    )

    db.add(db_attempt)

    # Update student progress
    progress = db.query(StudentProgress).filter(
        StudentProgress.student_id == attempt.student_id,
        StudentProgress.pattern_type_id == problem.pattern_type_id
    ).first()

    if not progress:
        progress = StudentProgress(
            student_id=attempt.student_id,
            pattern_type_id=problem.pattern_type_id,
            problems_attempted=1,
            problems_solved=1 if is_correct else 0,
            total_score=score,
            average_time_seconds=attempt.time_spent_seconds
        )
        db.add(progress)
    else:
        # Check if this is first attempt for this problem
        is_new_problem = db.query(Attempt).filter(
            Attempt.student_id == attempt.student_id,
            Attempt.problem_id == attempt.problem_id
        ).count() == 0

        if is_new_problem:
            progress.problems_attempted += 1

        if is_correct:
            # Only count as solved once
            already_solved = db.query(Attempt).filter(
                Attempt.student_id == attempt.student_id,
                Attempt.problem_id == attempt.problem_id,
                Attempt.is_correct == True
            ).count() > 0

            if not already_solved:
                progress.problems_solved += 1

        progress.total_score += score

        # Update average time
        if attempt.time_spent_seconds:
            if progress.average_time_seconds:
                progress.average_time_seconds = (
                    progress.average_time_seconds * (progress.problems_attempted - 1) +
                    attempt.time_spent_seconds
                ) / progress.problems_attempted
            else:
                progress.average_time_seconds = attempt.time_spent_seconds

    # Calculate mastery level
    if progress.problems_attempted > 0:
        progress.mastery_level = (progress.problems_solved / progress.problems_attempted) * 100

    db.commit()
    db.refresh(db_attempt)

    # Convert back for response
    response_dict = {
        "id": db_attempt.id,
        "student_id": db_attempt.student_id,
        "problem_id": db_attempt.problem_id,
        "submitted_sequence": json.loads(db_attempt.submitted_sequence),
        "is_correct": db_attempt.is_correct,
        "time_spent_seconds": db_attempt.time_spent_seconds,
        "score": db_attempt.score,
        "attempt_number": db_attempt.attempt_number,
        "feedback": db_attempt.feedback,
        "submitted_at": db_attempt.submitted_at
    }

    return AttemptResponse(**response_dict)


@router.get("/student/{student_id}", response_model=List[AttemptResponse])
async def get_student_attempts(
    student_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all attempts for a student"""
    attempts = db.query(Attempt).filter(
        Attempt.student_id == student_id
    ).order_by(Attempt.submitted_at.desc()).offset(skip).limit(limit).all()

    result = []
    for attempt in attempts:
        attempt_dict = {
            "id": attempt.id,
            "student_id": attempt.student_id,
            "problem_id": attempt.problem_id,
            "submitted_sequence": json.loads(attempt.submitted_sequence),
            "is_correct": attempt.is_correct,
            "time_spent_seconds": attempt.time_spent_seconds,
            "score": attempt.score,
            "attempt_number": attempt.attempt_number,
            "feedback": attempt.feedback,
            "submitted_at": attempt.submitted_at
        }
        result.append(AttemptResponse(**attempt_dict))

    return result


@router.get("/progress/{student_id}", response_model=List[StudentProgressResponse])
async def get_student_progress(student_id: int, db: Session = Depends(get_db)):
    """Get student progress across all pattern types"""
    progress_records = db.query(StudentProgress).filter(
        StudentProgress.student_id == student_id
    ).all()

    if not progress_records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No progress found for this student"
        )

    return progress_records
