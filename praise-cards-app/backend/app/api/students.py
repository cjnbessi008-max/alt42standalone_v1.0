from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Student
from ..schemas import StudentCreate, StudentResponse, StudentUpdate

router = APIRouter()


@router.post("/", response_model=StudentResponse, status_code=201)
def create_student(student_data: StudentCreate, db: Session = Depends(get_db)):
    """Create a new student"""

    # Check if email already exists
    existing = db.query(Student).filter(Student.email == student_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create student
    student = Student(
        name=student_data.name,
        email=student_data.email,
        grade_level=student_data.grade_level,
        profile_image=student_data.profile_image,
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return student


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    """Get student by ID"""

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return student


@router.get("/", response_model=List[StudentResponse])
def list_students(
    skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    """List all students"""

    students = db.query(Student).offset(skip).limit(limit).all()
    return students


@router.patch("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: str, student_data: StudentUpdate, db: Session = Depends(get_db)
):
    """Update student information"""

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Update fields if provided
    if student_data.name is not None:
        student.name = student_data.name
    if student_data.grade_level is not None:
        student.grade_level = student_data.grade_level
    if student_data.profile_image is not None:
        student.profile_image = student_data.profile_image

    db.commit()
    db.refresh(student)

    return student


@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: str, db: Session = Depends(get_db)):
    """Delete a student"""

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()

    return None
