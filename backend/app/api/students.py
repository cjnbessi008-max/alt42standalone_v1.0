"""
API endpoints for student management
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..models import schemas
from ..models.database import Student, StudentAttempt, Problem

router = APIRouter(prefix="/students", tags=["Students"])


@router.post("/", response_model=schemas.StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db)
):
    """Create a new student"""
    # Check if email already exists
    existing = db.query(Student).filter(Student.email == student.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student with email {student.email} already exists"
        )

    db_student = Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    return schemas.StudentResponse.from_orm(db_student)


@router.get("/{student_id}", response_model=schemas.StudentResponse)
async def get_student(
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """Get student by ID"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )

    return schemas.StudentResponse.from_orm(student)


@router.put("/{student_id}", response_model=schemas.StudentResponse)
async def update_student(
    student_id: UUID,
    student_update: schemas.StudentUpdate,
    db: Session = Depends(get_db)
):
    """Update student information"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID {student_id} not found"
        )

    update_data = student_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)

    return schemas.StudentResponse.from_orm(student)


@router.post("/attempts/", response_model=schemas.StudentAttemptResponse, status_code=status.HTTP_201_CREATED)
async def submit_attempt(
    attempt: schemas.StudentAttemptCreate,
    db: Session = Depends(get_db)
):
    """
    Submit a student's answer to a problem

    This endpoint:
    1. Records the student's attempt
    2. Checks if the answer is correct
    3. Updates mistake patterns if incorrect
    """
    # Verify problem exists
    problem = db.query(Problem).filter(Problem.id == attempt.problem_id).first()
    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Problem with ID {attempt.problem_id} not found"
        )

    # Check if answer is correct (simple JSON comparison)
    is_correct = attempt.submitted_answer == problem.correct_answer

    # Count previous attempts for this problem by this student
    attempt_count = db.query(StudentAttempt).filter(
        StudentAttempt.student_id == attempt.student_id,
        StudentAttempt.problem_id == attempt.problem_id
    ).count()

    # Create attempt record
    db_attempt = StudentAttempt(
        **attempt.dict(),
        is_correct=is_correct,
        attempt_number=attempt_count + 1
    )

    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)

    return schemas.StudentAttemptResponse.from_orm(db_attempt)


@router.get("/{student_id}/attempts", response_model=List[schemas.StudentAttemptResponse])
async def get_student_attempts(
    student_id: UUID,
    module_id: UUID = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all attempts for a student"""
    query = db.query(StudentAttempt).filter(StudentAttempt.student_id == student_id)

    if module_id:
        query = query.filter(StudentAttempt.module_id == module_id)

    attempts = query.order_by(StudentAttempt.attempted_at.desc()).limit(limit).all()

    return [schemas.StudentAttemptResponse.from_orm(a) for a in attempts]
