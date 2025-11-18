"""
Student API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel
from uuid import UUID

from ..database import get_db
from ..models import Student

router = APIRouter(prefix="/api/students", tags=["students"])


# Pydantic schemas
class StudentCreate(BaseModel):
    student_number: str
    name: str
    grade_level: str | None = None
    email: str | None = None


class StudentResponse(BaseModel):
    id: UUID
    student_number: str
    name: str
    grade_level: str | None
    email: str | None

    class Config:
        from_attributes = True


@router.get("", response_model=List[StudentResponse])
async def list_students(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Get list of all students"""
    query = select(Student).offset(skip).limit(limit)
    result = await db.execute(query)
    students = result.scalars().all()
    return students


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific student by ID"""
    query = select(Student).where(Student.id == student_id)
    result = await db.execute(query)
    student = result.scalar_one_or_none()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student {student_id} not found"
        )

    return student


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new student"""
    # Check if student number already exists
    query = select(Student).where(Student.student_number == student_data.student_number)
    result = await db.execute(query)
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student with number {student_data.student_number} already exists"
        )

    student = Student(**student_data.dict())
    db.add(student)
    await db.commit()
    await db.refresh(student)

    return student
