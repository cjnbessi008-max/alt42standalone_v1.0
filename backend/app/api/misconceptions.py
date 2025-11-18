"""
API routes for misconceptions tracking
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from datetime import datetime, timedelta
import logging

from ..database import get_db
from ..models import (
    TopMisconceptionsResponse,
    MisconceptionPattern,
    SeverityLevel
)

router = APIRouter(prefix="/api/misconceptions", tags=["misconceptions"])
logger = logging.getLogger(__name__)


def get_timeframe_cutoff(timeframe: str) -> datetime:
    """Calculate cutoff date based on timeframe"""
    now = datetime.utcnow()
    if timeframe == "week":
        return now - timedelta(days=7)
    elif timeframe == "month":
        return now - timedelta(days=30)
    else:  # all_time
        return datetime.min


@router.get("/students/{student_id}/modules/{module_id}/top", response_model=TopMisconceptionsResponse)
async def get_top_misconceptions(
    student_id: str,
    module_id: str,
    limit: int = Query(default=3, ge=1, le=10, description="Number of top misconceptions to return"),
    timeframe: str = Query(default="all_time", regex="^(week|month|all_time)$"),
    db: Session = Depends(get_db)
):
    """
    Get the top N most frequent misconceptions for a student in a specific module.

    This endpoint returns the misconceptions that the student has encountered most frequently,
    ordered by occurrence count. It's designed to power the "Top 3 Frequently Missed Concepts" popup.

    Args:
        student_id: UUID of the student
        module_id: UUID of the module
        limit: Maximum number of misconceptions to return (default: 3)
        timeframe: Time period to consider - "week", "month", or "all_time" (default: "all_time")
        db: Database session

    Returns:
        TopMisconceptionsResponse containing student info, module info, and list of misconceptions

    Raises:
        HTTPException: 404 if student or module not found
        HTTPException: 500 for database errors
    """
    try:
        cutoff_date = get_timeframe_cutoff(timeframe)

        # Query to get top misconceptions with related information
        query = text("""
            SELECT
                m.id as misconception_id,
                m.name as misconception_name,
                m.description,
                m.severity,
                m.correction_strategy,
                m.typical_wrong_pattern,
                c.name as concept_name,
                sm.occurrence_count,
                sm.last_occurred_at,
                s.name as student_name,
                s.grade_level as student_grade,
                mod.name as module_name,
                mod.subject as module_subject
            FROM student_misconceptions sm
            JOIN misconceptions m ON sm.misconception_id = m.id
            JOIN concepts c ON m.concept_id = c.id
            JOIN students s ON sm.student_id = s.id
            JOIN modules mod ON m.module_id = mod.id
            WHERE
                sm.student_id = :student_id
                AND m.module_id = :module_id
                AND sm.is_resolved = false
                AND sm.last_occurred_at >= :cutoff_date
            ORDER BY sm.occurrence_count DESC, sm.last_occurred_at DESC
            LIMIT :limit
        """)

        result = db.execute(
            query,
            {
                "student_id": student_id,
                "module_id": module_id,
                "cutoff_date": cutoff_date,
                "limit": limit
            }
        )

        rows = result.fetchall()

        if not rows:
            # Check if student and module exist
            student_check = db.execute(
                text("SELECT name FROM students WHERE id = :student_id"),
                {"student_id": student_id}
            ).fetchone()

            if not student_check:
                raise HTTPException(status_code=404, detail=f"Student with id {student_id} not found")

            module_check = db.execute(
                text("SELECT name FROM modules WHERE id = :module_id"),
                {"module_id": module_id}
            ).fetchone()

            if not module_check:
                raise HTTPException(status_code=404, detail=f"Module with id {module_id} not found")

            # Student and module exist but no misconceptions found
            return TopMisconceptionsResponse(
                student_id=student_id,
                student_name=student_check[0],
                module_id=module_id,
                module_name=module_check[0],
                misconceptions=[],
                total_count=0,
                generated_at=datetime.utcnow()
            )

        # Parse results into MisconceptionPattern objects
        misconceptions = []
        student_name = rows[0].student_name
        module_name = rows[0].module_name

        for row in rows:
            misconception = MisconceptionPattern(
                id=str(row.misconception_id),
                name=row.misconception_name,
                description=row.description,
                concept_name=row.concept_name,
                severity=SeverityLevel(row.severity),
                occurrence_count=row.occurrence_count,
                last_occurred_at=row.last_occurred_at,
                correction_strategy=row.correction_strategy,
                typical_wrong_pattern=row.typical_wrong_pattern
            )
            misconceptions.append(misconception)

        return TopMisconceptionsResponse(
            student_id=student_id,
            student_name=student_name,
            module_id=module_id,
            module_name=module_name,
            misconceptions=misconceptions,
            total_count=len(misconceptions),
            generated_at=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching top misconceptions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching misconceptions: {str(e)}"
        )


@router.get("/students/{student_id}/modules", response_model=List[dict])
async def get_student_modules(
    student_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all modules a student is enrolled in.

    Args:
        student_id: UUID of the student
        db: Database session

    Returns:
        List of modules with enrollment information
    """
    try:
        query = text("""
            SELECT
                m.id,
                m.name,
                m.description,
                m.subject,
                m.grade_level,
                se.enrolled_at,
                se.progress_percentage
            FROM student_enrollments se
            JOIN modules m ON se.module_id = m.id
            WHERE se.student_id = :student_id
            ORDER BY se.enrolled_at DESC
        """)

        result = db.execute(query, {"student_id": student_id})
        rows = result.fetchall()

        modules = []
        for row in rows:
            modules.append({
                "id": str(row.id),
                "name": row.name,
                "description": row.description,
                "subject": row.subject,
                "grade_level": row.grade_level,
                "enrolled_at": row.enrolled_at.isoformat(),
                "progress_percentage": float(row.progress_percentage)
            })

        return modules

    except Exception as e:
        logger.error(f"Error fetching student modules: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching modules: {str(e)}"
        )


@router.get("/students", response_model=List[dict])
async def get_all_students(db: Session = Depends(get_db)):
    """
    Get all students in the system.
    Useful for testing and demonstration purposes.

    Returns:
        List of all students
    """
    try:
        query = text("""
            SELECT
                s.id,
                s.name,
                s.grade_level,
                s.email,
                COUNT(DISTINCT se.module_id) as enrolled_modules_count
            FROM students s
            LEFT JOIN student_enrollments se ON s.id = se.student_id
            GROUP BY s.id, s.name, s.grade_level, s.email
            ORDER BY s.name
        """)

        result = db.execute(query)
        rows = result.fetchall()

        students = []
        for row in rows:
            students.append({
                "id": str(row.id),
                "name": row.name,
                "grade_level": row.grade_level,
                "email": row.email,
                "enrolled_modules_count": row.enrolled_modules_count
            })

        return students

    except Exception as e:
        logger.error(f"Error fetching students: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching students: {str(e)}"
        )
