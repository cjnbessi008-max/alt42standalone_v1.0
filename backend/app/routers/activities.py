"""
Learning activity API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..models import LearningActivity, ProblemAttempt
from ..schemas import (
    LearningActivityCreate,
    LearningActivityResponse,
    LearningActivityUpdate,
    ProblemAttemptCreate,
    ProblemAttemptResponse
)

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.post("", response_model=LearningActivityResponse, status_code=201)
def create_activity(activity: LearningActivityCreate, db: Session = Depends(get_db)):
    """
    Create a new learning activity session
    """
    activity_data = activity.dict()
    if not activity_data.get("session_start"):
        activity_data["session_start"] = datetime.utcnow()

    db_activity = LearningActivity(**activity_data)
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)

    return db_activity


@router.get("/{activity_id}", response_model=LearningActivityResponse)
def get_activity(activity_id: str, db: Session = Depends(get_db)):
    """
    Get a learning activity by ID
    """
    activity = db.query(LearningActivity).filter(
        LearningActivity.id == activity_id
    ).first()

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    return activity


@router.patch("/{activity_id}", response_model=LearningActivityResponse)
def update_activity(
    activity_id: str,
    update_data: LearningActivityUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a learning activity (typically at session end)
    """
    activity = db.query(LearningActivity).filter(
        LearningActivity.id == activity_id
    ).first()

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(activity, field, value)

    db.commit()
    db.refresh(activity)

    return activity


@router.get("/student/{student_id}", response_model=List[LearningActivityResponse])
def get_student_activities(
    student_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get all learning activities for a student
    """
    activities = db.query(LearningActivity).filter(
        LearningActivity.student_id == student_id
    ).order_by(
        LearningActivity.session_start.desc()
    ).offset(skip).limit(limit).all()

    return activities


@router.post("/{activity_id}/attempts", response_model=ProblemAttemptResponse, status_code=201)
def create_problem_attempt(
    activity_id: str,
    attempt: ProblemAttemptCreate,
    db: Session = Depends(get_db)
):
    """
    Record a problem attempt within an activity
    """
    # Verify activity exists
    activity = db.query(LearningActivity).filter(
        LearningActivity.id == activity_id
    ).first()

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Create problem attempt
    db_attempt = ProblemAttempt(
        activity_id=activity_id,
        **attempt.dict()
    )
    db.add(db_attempt)

    # Update activity statistics
    activity.total_problems += 1
    if db_attempt.is_correct:
        activity.correct_answers += 1
    else:
        activity.incorrect_answers += 1
    activity.hints_used += db_attempt.hints_requested

    db.commit()
    db.refresh(db_attempt)

    return db_attempt


@router.get("/{activity_id}/attempts", response_model=List[ProblemAttemptResponse])
def get_activity_attempts(activity_id: str, db: Session = Depends(get_db)):
    """
    Get all problem attempts for an activity
    """
    attempts = db.query(ProblemAttempt).filter(
        ProblemAttempt.activity_id == activity_id
    ).order_by(ProblemAttempt.attempted_at).all()

    return attempts
