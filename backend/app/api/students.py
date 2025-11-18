"""
학생 API 엔드포인트
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.database import get_db
from ..models.student import Student
from ..models.routine_card import RoutineCard
from ..models.learning_progress import LearningProgress
from ..schemas.student import StudentCreate, StudentResponse, StudentDetail
from ..schemas.learning_progress import LearningProgressResponse

router = APIRouter(prefix="/api/v1/students", tags=["students"])


@router.post("", response_model=StudentResponse, status_code=201)
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db)
):
    """새 학생 등록"""
    # 중복 확인
    existing = db.query(Student).filter(
        Student.student_number == student.student_number
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="이미 존재하는 학생 번호입니다")

    db_student = Student(**student.model_dump())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)

    return db_student


@router.get("", response_model=List[StudentResponse])
def list_students(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """학생 목록 조회"""
    students = db.query(Student).offset(skip).limit(limit).all()
    return students


@router.get("/{student_id}", response_model=StudentDetail)
def get_student(
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """학생 상세 정보 조회"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다")

    # 통계 정보 추가
    total_cards = db.query(func.count(RoutineCard.id)).filter(
        RoutineCard.student_id == student_id
    ).scalar()

    total_time = db.query(func.sum(LearningProgress.time_spent_minutes)).filter(
        LearningProgress.student_id == student_id
    ).scalar() or 0

    avg_score = db.query(func.avg(LearningProgress.score)).filter(
        LearningProgress.student_id == student_id
    ).scalar()

    return StudentDetail(
        **student.__dict__,
        total_cards=total_cards,
        total_learning_time=total_time,
        average_score=float(avg_score) if avg_score else None
    )


@router.get("/{student_id}/progress", response_model=List[LearningProgressResponse])
def get_student_progress(
    student_id: UUID,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """학생의 학습 진행 현황 조회"""
    progress = db.query(LearningProgress).filter(
        LearningProgress.student_id == student_id
    ).order_by(
        LearningProgress.updated_at.desc()
    ).limit(limit).all()

    return progress


@router.delete("/{student_id}", status_code=204)
def delete_student(
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """학생 삭제"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="학생을 찾을 수 없습니다")

    db.delete(student)
    db.commit()

    return None
