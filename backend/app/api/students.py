"""
Student API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from app.core.database import get_db
from app.schemas.student import StudentCreate, StudentResponse
from app.models.student import Student

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/students", tags=["students"])


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db)
):
    """Create a new student"""
    # Check if student already exists
    existing = db.query(Student).filter(
        (Student.moodle_id == student_data.moodle_id) |
        (Student.username == student_data.username)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this Moodle ID or username already exists"
        )

    student = Student(
        moodle_id=student_data.moodle_id,
        username=student_data.username,
        email=student_data.email,
        firstname=student_data.firstname,
        lastname=student_data.lastname
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return student


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    db: Session = Depends(get_db)
):
    """Get student by ID"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student {student_id} not found"
        )
    return student


@router.get("/moodle/{moodle_id}", response_model=StudentResponse)
async def get_student_by_moodle_id(
    moodle_id: int,
    db: Session = Depends(get_db)
):
    """Get student by Moodle ID"""
    student = db.query(Student).filter(Student.moodle_id == moodle_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with Moodle ID {moodle_id} not found"
        )
    return student


@router.get("/", response_model=List[StudentResponse])
async def list_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """List all students"""
    students = db.query(Student).offset(skip).limit(limit).all()
    return students


@router.get("/{student_id}/stats")
async def get_student_stats(
    student_id: str,
    db: Session = Depends(get_db)
):
    """Get statistics for a student"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student {student_id} not found"
        )

    total_submissions = len(student.submissions)
    analyzed_submissions = sum(1 for sub in student.submissions if sub.analysis_result is not None)

    avg_score = 0
    if analyzed_submissions > 0:
        scores = [sub.analysis_result.efficiency_score for sub in student.submissions if sub.analysis_result]
        avg_score = sum(scores) / len(scores) if scores else 0

    return {
        "student_id": student_id,
        "username": student.username,
        "total_submissions": total_submissions,
        "analyzed_submissions": analyzed_submissions,
        "average_efficiency_score": round(avg_score, 2),
        "latest_submission": student.submissions[-1].submitted_at if student.submissions else None
    }
