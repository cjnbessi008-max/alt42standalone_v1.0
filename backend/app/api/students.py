"""
Student endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..models import get_db, Student
from ..schemas import StudentCreate, StudentUpdate, StudentResponse
from ..utils import moodle_client

router = APIRouter(prefix="/students", tags=["students"])


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """Create a new student (usually synced from Moodle)"""
    # Check if student already exists
    existing = db.query(Student).filter(Student.moodle_user_id == student.moodle_user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student with this Moodle user ID already exists"
        )

    db_student = Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get student by ID"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    return student


@router.get("/moodle/{moodle_user_id}", response_model=StudentResponse)
async def get_student_by_moodle_id(moodle_user_id: int, db: Session = Depends(get_db)):
    """Get student by Moodle user ID"""
    student = db.query(Student).filter(Student.moodle_user_id == moodle_user_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    return student


@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_update: StudentUpdate,
    db: Session = Depends(get_db)
):
    """Update student information"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    update_data = student_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)
    return student


@router.post("/sync/{moodle_user_id}", response_model=StudentResponse)
async def sync_student_from_moodle(moodle_user_id: int, db: Session = Depends(get_db)):
    """Sync student data from Moodle"""
    try:
        moodle_user = await moodle_client.get_user_info(moodle_user_id)
        if not moodle_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in Moodle"
            )

        # Check if student exists
        student = db.query(Student).filter(Student.moodle_user_id == moodle_user_id).first()

        student_data = {
            "moodle_user_id": moodle_user_id,
            "username": moodle_user.get("username", ""),
            "email": moodle_user.get("email"),
            "full_name": moodle_user.get("fullname"),
        }

        if student:
            # Update existing
            for field, value in student_data.items():
                setattr(student, field, value)
        else:
            # Create new
            student = Student(**student_data)
            db.add(student)

        db.commit()
        db.refresh(student)
        return student

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error syncing from Moodle: {str(e)}"
        )
