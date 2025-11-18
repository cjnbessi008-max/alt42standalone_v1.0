"""
Student API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Student
from ..schemas import StudentCreate, StudentResponse

router = APIRouter(prefix="/api/students", tags=["students"])


@router.post("", response_model=StudentResponse, status_code=201)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """
    Create a new student
    """
    # Check if email already exists
    if student.email:
        existing = db.query(Student).filter(Student.email == student.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

    db_student = Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    return db_student


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    """
    Get a student by ID
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return student


@router.get("", response_model=List[StudentResponse])
def list_students(
    skip: int = 0,
    limit: int = 100,
    is_teacher: bool = None,
    db: Session = Depends(get_db)
):
    """
    List all students with optional filtering
    """
    query = db.query(Student)

    if is_teacher is not None:
        query = query.filter(Student.is_teacher == is_teacher)

    students = query.offset(skip).limit(limit).all()
    return students


@router.delete("/{student_id}", status_code=204)
def delete_student(student_id: str, db: Session = Depends(get_db)):
    """
    Delete a student
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()

    return None
