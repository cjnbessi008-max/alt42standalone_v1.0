"""
API routes for learning progress and analytics
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import UUID
from typing import List, Dict, Any
import logging

from ..database import get_db
from ..models import (
    LearningProgressResponse,
    StudentDashboard,
    StudentResponse,
    AttemptResponse,
    ErrorResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get(
    "/student/{student_id}",
    response_model=List[LearningProgressResponse],
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_student_progress(
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get learning progress for a specific student across all problem types
    """
    try:
        # Verify student exists
        student_check = db.execute(
            text("SELECT id FROM students WHERE id = :student_id"),
            {"student_id": str(student_id)}
        ).fetchone()

        if not student_check:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with id {student_id} not found"
            )

        # Get progress records
        result = db.execute(
            text("""
                SELECT id, student_id, problem_type, total_attempts, correct_attempts,
                       common_errors, last_attempt_at, mastery_level
                FROM learning_progress
                WHERE student_id = :student_id
                ORDER BY mastery_level DESC
            """),
            {"student_id": str(student_id)}
        )

        rows = result.fetchall()

        return [
            LearningProgressResponse(
                id=row.id,
                student_id=row.student_id,
                problem_type=row.problem_type,
                total_attempts=row.total_attempts,
                correct_attempts=row.correct_attempts,
                common_errors=row.common_errors,
                last_attempt_at=row.last_attempt_at,
                mastery_level=float(row.mastery_level),
                accuracy_rate=float(row.correct_attempts) / float(row.total_attempts)
                    if row.total_attempts > 0 else 0.0
            )
            for row in rows
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student progress: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch student progress: {str(e)}"
        )


@router.get(
    "/student/{student_id}/dashboard",
    response_model=StudentDashboard,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_student_dashboard(
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard for a student including:
    - Basic info
    - Progress by problem type
    - Recent attempts
    - Overall statistics
    - Strengths and areas for improvement
    """
    try:
        # Get student info
        student_row = db.execute(
            text("""
                SELECT id, name, email, grade_level, external_id, created_at
                FROM students
                WHERE id = :student_id
            """),
            {"student_id": str(student_id)}
        ).fetchone()

        if not student_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with id {student_id} not found"
            )

        student = StudentResponse(
            id=student_row.id,
            name=student_row.name,
            email=student_row.email,
            grade_level=student_row.grade_level,
            external_id=student_row.external_id,
            created_at=student_row.created_at
        )

        # Get progress by problem type
        progress_rows = db.execute(
            text("""
                SELECT id, student_id, problem_type, total_attempts, correct_attempts,
                       common_errors, last_attempt_at, mastery_level
                FROM learning_progress
                WHERE student_id = :student_id
            """),
            {"student_id": str(student_id)}
        ).fetchall()

        overall_progress = {}
        for row in progress_rows:
            overall_progress[row.problem_type] = LearningProgressResponse(
                id=row.id,
                student_id=row.student_id,
                problem_type=row.problem_type,
                total_attempts=row.total_attempts,
                correct_attempts=row.correct_attempts,
                common_errors=row.common_errors,
                last_attempt_at=row.last_attempt_at,
                mastery_level=float(row.mastery_level),
                accuracy_rate=float(row.correct_attempts) / float(row.total_attempts)
                    if row.total_attempts > 0 else 0.0
            )

        # Get recent attempts
        recent_rows = db.execute(
            text("""
                SELECT id, student_id, problem_id, submitted_answer, is_correct,
                       time_spent_seconds, attempted_at
                FROM student_attempts
                WHERE student_id = :student_id
                ORDER BY attempted_at DESC
                LIMIT 10
            """),
            {"student_id": str(student_id)}
        ).fetchall()

        recent_attempts = [
            AttemptResponse(
                id=row.id,
                student_id=row.student_id,
                problem_id=row.problem_id,
                submitted_answer=row.submitted_answer,
                is_correct=row.is_correct,
                time_spent_seconds=row.time_spent_seconds,
                attempted_at=row.attempted_at
            )
            for row in recent_rows
        ]

        # Calculate overall statistics
        total_problems_attempted = sum(p.total_attempts for p in overall_progress.values())
        total_problems_correct = sum(p.correct_attempts for p in overall_progress.values())
        overall_accuracy = (
            total_problems_correct / total_problems_attempted
            if total_problems_attempted > 0 else 0.0
        )

        # Identify strengths and areas for improvement
        strengths = []
        areas_for_improvement = []

        for problem_type, progress in overall_progress.items():
            if progress.mastery_level >= 0.8:
                strengths.append(problem_type)
            elif progress.mastery_level < 0.6 and progress.total_attempts >= 3:
                areas_for_improvement.append(problem_type)

        return StudentDashboard(
            student=student,
            overall_progress=overall_progress,
            recent_attempts=recent_attempts,
            total_problems_attempted=total_problems_attempted,
            total_problems_correct=total_problems_correct,
            overall_accuracy=overall_accuracy,
            strengths=strengths,
            areas_for_improvement=areas_for_improvement
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student dashboard: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch student dashboard: {str(e)}"
        )


@router.get(
    "/student/{student_id}/attempts",
    response_model=List[AttemptResponse],
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_student_attempts(
    student_id: UUID,
    problem_type: str = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get attempt history for a student, optionally filtered by problem type
    """
    try:
        query = """
            SELECT a.id, a.student_id, a.problem_id, a.submitted_answer,
                   a.is_correct, a.time_spent_seconds, a.attempted_at
            FROM student_attempts a
        """

        if problem_type:
            query += """
                JOIN problems p ON a.problem_id = p.id
                WHERE a.student_id = :student_id AND p.problem_type = :problem_type
            """
            params = {"student_id": str(student_id), "problem_type": problem_type, "limit": limit}
        else:
            query += " WHERE a.student_id = :student_id"
            params = {"student_id": str(student_id), "limit": limit}

        query += " ORDER BY a.attempted_at DESC LIMIT :limit"

        result = db.execute(text(query), params)
        rows = result.fetchall()

        return [
            AttemptResponse(
                id=row.id,
                student_id=row.student_id,
                problem_id=row.problem_id,
                submitted_answer=row.submitted_answer,
                is_correct=row.is_correct,
                time_spent_seconds=row.time_spent_seconds,
                attempted_at=row.attempted_at
            )
            for row in rows
        ]

    except Exception as e:
        logger.error(f"Error fetching student attempts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch student attempts: {str(e)}"
        )
