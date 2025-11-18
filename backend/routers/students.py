"""
API routes for student management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import UUID
from typing import List
import logging

from ..database import get_db
from ..models import (
    StudentCreate,
    StudentResponse,
    ErrorResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/students", tags=["students"])


@router.post(
    "/",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new student record.

    Can be used for Moodle integration by providing external_id.
    """
    try:
        # Check if external_id already exists (if provided)
        if student.external_id:
            existing = db.execute(
                text("SELECT id FROM students WHERE external_id = :external_id"),
                {"external_id": student.external_id}
            ).fetchone()

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Student with external_id {student.external_id} already exists"
                )

        # Create student
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

        return StudentResponse(
            id=row.id,
            name=row.name,
            email=row.email,
            grade_level=row.grade_level,
            external_id=row.external_id,
            created_at=row.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating student: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create student: {str(e)}"
        )


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_student(
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get student details by ID
    """
    try:
        result = db.execute(
            text("""
                SELECT id, name, email, grade_level, external_id, created_at
                FROM students
                WHERE id = :student_id
            """),
            {"student_id": str(student_id)}
        )

        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with id {student_id} not found"
            )

        return StudentResponse(
            id=row.id,
            name=row.name,
            email=row.email,
            grade_level=row.grade_level,
            external_id=row.external_id,
            created_at=row.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch student: {str(e)}"
        )


@router.get(
    "/external/{external_id}",
    response_model=StudentResponse,
    responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def get_student_by_external_id(
    external_id: str,
    db: Session = Depends(get_db)
):
    """
    Get student details by external ID (e.g., Moodle user ID)
    """
    try:
        result = db.execute(
            text("""
                SELECT id, name, email, grade_level, external_id, created_at
                FROM students
                WHERE external_id = :external_id
            """),
            {"external_id": external_id}
        )

        row = result.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with external_id {external_id} not found"
            )

        return StudentResponse(
            id=row.id,
            name=row.name,
            email=row.email,
            grade_level=row.grade_level,
            external_id=row.external_id,
            created_at=row.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching student: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch student: {str(e)}"
        )


@router.get(
    "/",
    response_model=List[StudentResponse],
    responses={500: {"model": ErrorResponse}}
)
async def list_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List all students with pagination
    """
    try:
        result = db.execute(
            text("""
                SELECT id, name, email, grade_level, external_id, created_at
                FROM students
                ORDER BY created_at DESC
                LIMIT :limit OFFSET :skip
            """),
            {"limit": limit, "skip": skip}
        )

        rows = result.fetchall()

        return [
            StudentResponse(
                id=row.id,
                name=row.name,
                email=row.email,
                grade_level=row.grade_level,
                external_id=row.external_id,
                created_at=row.created_at
            )
            for row in rows
        ]

    except Exception as e:
        logger.error(f"Error listing students: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list students: {str(e)}"
        )
