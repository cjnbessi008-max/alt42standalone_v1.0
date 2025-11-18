from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import LearningSession, Student
from ..schemas import LearningSessionCreate, LearningSessionResponse
from ..services.praise_card_service import PraiseCardService

router = APIRouter()


@router.post("/", response_model=LearningSessionResponse, status_code=201)
def create_learning_session(
    session_data: LearningSessionCreate, db: Session = Depends(get_db)
):
    """
    Create a new learning session and automatically detect achievements
    This endpoint triggers the praise card generation pipeline
    """

    # Verify student exists
    student = (
        db.query(Student).filter(Student.id == session_data.student_id).first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Calculate accuracy
    accuracy = 0.0
    if session_data.questions_attempted > 0:
        accuracy = (
            session_data.questions_correct / session_data.questions_attempted
        ) * 100

    # Create learning session
    learning_session = LearningSession(
        student_id=session_data.student_id,
        module_name=session_data.module_name,
        duration_minutes=session_data.duration_minutes,
        questions_attempted=session_data.questions_attempted,
        questions_correct=session_data.questions_correct,
        accuracy_percentage=accuracy,
        progress_percentage=session_data.progress_percentage,
        metadata=session_data.metadata,
        ended_at=datetime.utcnow(),
    )

    db.add(learning_session)
    db.commit()
    db.refresh(learning_session)

    # Update student stats
    student.total_learning_time += session_data.duration_minutes
    student.last_activity_at = datetime.utcnow()

    # Update consecutive days (simple logic)
    if student.last_activity_at:
        days_diff = (datetime.utcnow() - student.last_activity_at).days
        if days_diff <= 1:
            student.consecutive_days += 1
        else:
            student.consecutive_days = 1
    else:
        student.consecutive_days = 1

    # Update modules completed if progress is 100%
    if session_data.progress_percentage >= 100:
        student.total_modules_completed += 1

    # Update average accuracy
    all_sessions = (
        db.query(LearningSession)
        .filter(LearningSession.student_id == student.id)
        .all()
    )
    if all_sessions:
        avg_accuracy = sum(s.accuracy_percentage for s in all_sessions) / len(
            all_sessions
        )
        student.average_accuracy = int(avg_accuracy)

    db.commit()

    # Trigger achievement detection and praise card generation
    try:
        praise_card_service = PraiseCardService(db)
        praise_cards = praise_card_service.process_learning_session(
            str(student.id), str(learning_session.id)
        )

        # Log generated cards (in production, you might emit events here)
        if praise_cards:
            print(
                f"Generated {len(praise_cards)} praise card(s) for student {student.name}"
            )

    except Exception as e:
        # Don't fail the request if card generation fails
        print(f"Error generating praise cards: {e}")

    return learning_session


@router.get("/{session_id}", response_model=LearningSessionResponse)
def get_learning_session(session_id: str, db: Session = Depends(get_db)):
    """Get learning session by ID"""

    session = (
        db.query(LearningSession).filter(LearningSession.id == session_id).first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Learning session not found")

    return session


@router.get("/student/{student_id}", response_model=List[LearningSessionResponse])
def get_student_sessions(
    student_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)
):
    """Get all learning sessions for a student"""

    sessions = (
        db.query(LearningSession)
        .filter(LearningSession.student_id == student_id)
        .order_by(LearningSession.started_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return sessions
