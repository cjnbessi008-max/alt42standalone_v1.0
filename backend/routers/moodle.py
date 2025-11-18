"""
API routes for Moodle/LMS integration
Provides REST endpoints for external LMS systems to integrate with
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List
import logging

from ..database import get_db
from ..models import (
    StudentCreate,
    StudentResponse,
    ProblemResponse,
    AttemptResponse,
    LearningProgressResponse,
    ErrorResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/lms", tags=["lms-integration"])


# Simple API key authentication (for demonstration)
# In production, use proper OAuth2 or LTI authentication
def verify_api_key(x_api_key: Optional[str] = Header(None)):
    """
    Verify API key for LMS integration
    In production, implement proper authentication
    """
    # For now, just log the attempt
    if not x_api_key:
        logger.warning("LMS API call without API key")
    return x_api_key


@router.post(
    "/students/sync",
    response_model=StudentResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def sync_student(
    student: StudentCreate,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Sync student from external LMS (e.g., Moodle)

    Creates a new student or returns existing if external_id matches.
    This endpoint is idempotent.

    **Use case**: When a student accesses the system from Moodle,
    Moodle can call this endpoint to ensure the student exists in our system.
    """
    try:
        # Check if student with external_id already exists
        if student.external_id:
            existing = db.execute(
                text("SELECT id, name, email, grade_level, external_id, created_at FROM students WHERE external_id = :external_id"),
                {"external_id": student.external_id}
            ).fetchone()

            if existing:
                logger.info(f"Student with external_id {student.external_id} already exists")
                return StudentResponse(
                    id=existing.id,
                    name=existing.name,
                    email=existing.email,
                    grade_level=existing.grade_level,
                    external_id=existing.external_id,
                    created_at=existing.created_at
                )

        # Create new student
        result = db.execute(
            text("""
                INSERT INTO students (name, email, grade_level, external_id)
                VALUES (:name, :email, :grade_level, :external_id)
                RETURNING id, name, email, grade_level, external_id, created_at
            """),
            {
                "name": student.name,
                "email": student.email,
                "grade_level": student.grade_level,
                "external_id": student.external_id
            }
        )
        db.commit()

        row = result.fetchone()
        logger.info(f"Created new student with external_id {student.external_id}")

        return StudentResponse(
            id=row.id,
            name=row.name,
            email=row.email,
            grade_level=row.grade_level,
            external_id=row.external_id,
            created_at=row.created_at
        )

    except Exception as e:
        logger.error(f"Error syncing student: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync student: {str(e)}"
        )


@router.get(
    "/students/{external_id}/progress",
    response_model=List[LearningProgressResponse],
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_student_progress_by_external_id(
    external_id: str,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Get learning progress for a student by external LMS ID

    **Use case**: Moodle can fetch student progress to display in gradebook
    """
    try:
        # Get student by external_id
        student = db.execute(
            text("SELECT id FROM students WHERE external_id = :external_id"),
            {"external_id": external_id}
        ).fetchone()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with external_id {external_id} not found"
            )

        # Get progress
        result = db.execute(
            text("""
                SELECT id, student_id, problem_type, total_attempts, correct_attempts,
                       common_errors, last_attempt_at, mastery_level
                FROM learning_progress
                WHERE student_id = :student_id
                ORDER BY mastery_level DESC
            """),
            {"student_id": str(student.id)}
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
    "/students/{external_id}/grade",
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_student_grade(
    external_id: str,
    problem_type: Optional[str] = None,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Get student grade summary for LMS gradebook integration

    Returns overall accuracy as a percentage (0-100)

    **Use case**: Moodle can fetch this to populate gradebook
    """
    try:
        # Get student by external_id
        student = db.execute(
            text("SELECT id FROM students WHERE external_id = :external_id"),
            {"external_id": external_id}
        ).fetchone()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with external_id {external_id} not found"
            )

        # Get progress data
        query = """
            SELECT
                SUM(total_attempts) as total_attempts,
                SUM(correct_attempts) as correct_attempts,
                AVG(mastery_level) as avg_mastery
            FROM learning_progress
            WHERE student_id = :student_id
        """
        params = {"student_id": str(student.id)}

        if problem_type:
            query += " AND problem_type = :problem_type"
            params["problem_type"] = problem_type

        result = db.execute(text(query), params).fetchone()

        if not result or result.total_attempts == 0:
            return {
                "external_id": external_id,
                "grade_percentage": 0.0,
                "total_attempts": 0,
                "correct_attempts": 0,
                "mastery_level": 0.0,
                "problem_type": problem_type
            }

        accuracy = (float(result.correct_attempts) / float(result.total_attempts)) * 100

        return {
            "external_id": external_id,
            "grade_percentage": round(accuracy, 2),
            "total_attempts": int(result.total_attempts),
            "correct_attempts": int(result.correct_attempts),
            "mastery_level": round(float(result.avg_mastery), 2),
            "problem_type": problem_type
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student grade: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch student grade: {str(e)}"
        )


@router.get(
    "/students/{external_id}/recent-activity",
    response_model=List[AttemptResponse],
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_student_recent_activity(
    external_id: str,
    limit: int = 10,
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_api_key)
):
    """
    Get recent activity for a student

    **Use case**: Moodle can display recent activity in student profile
    """
    try:
        # Get student by external_id
        student = db.execute(
            text("SELECT id FROM students WHERE external_id = :external_id"),
            {"external_id": external_id}
        ).fetchone()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with external_id {external_id} not found"
            )

        # Get recent attempts
        result = db.execute(
            text("""
                SELECT id, student_id, problem_id, submitted_answer, is_correct,
                       time_spent_seconds, attempted_at
                FROM student_attempts
                WHERE student_id = :student_id
                ORDER BY attempted_at DESC
                LIMIT :limit
            """),
            {"student_id": str(student.id), "limit": limit}
        )

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

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recent activity: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch recent activity: {str(e)}"
        )


@router.get("/health", tags=["health"])
async def lms_integration_health():
    """
    Health check for LMS integration
    """
    return {
        "status": "healthy",
        "service": "LMS Integration API",
        "endpoints": {
            "sync_student": "POST /api/lms/students/sync",
            "get_progress": "GET /api/lms/students/{external_id}/progress",
            "get_grade": "GET /api/lms/students/{external_id}/grade",
            "recent_activity": "GET /api/lms/students/{external_id}/recent-activity"
        }
    }
