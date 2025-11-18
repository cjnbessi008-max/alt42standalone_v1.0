"""
Student API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ...database import get_db
from ...models.user import Student
from ...schemas.user import StudentCreate, StudentResponse

router = APIRouter()


@router.post("/", response_model=StudentResponse, status_code=201)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """Create a new student."""
    # Check if email already exists
    existing = db.query(Student).filter(Student.email == student.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create student
    db_student = Student(
        name=student.name,
        email=student.email,
        cohort_id=student.cohort_id,
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    return db_student


@router.get("/", response_model=List[StudentResponse])
def list_students(
    skip: int = 0,
    limit: int = 100,
    cohort_id: str = None,
    db: Session = Depends(get_db)
):
    """List all students."""
    query = db.query(Student)

    if cohort_id:
        query = query.filter(Student.cohort_id == cohort_id)

    students = query.offset(skip).limit(limit).all()
    return students


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: UUID, db: Session = Depends(get_db)):
    """Get a specific student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student
