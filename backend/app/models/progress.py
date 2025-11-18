from sqlalchemy import Column, String, Boolean, Integer, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.db.database import Base


class StageType(str, enum.Enum):
    """Stage type enumeration"""
    READING = "reading"
    SOLVING = "solving"
    COMPLETED = "completed"


class StudentProgress(Base):
    """Tracks student progress through problem stages"""
    __tablename__ = "student_progress"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    problem_id = Column(String, ForeignKey("problems.id"), nullable=False)

    # Stage tracking
    current_stage = Column(Enum(StageType), default=StageType.READING, nullable=False)
    reading_completed = Column(Boolean, default=False)
    solving_completed = Column(Boolean, default=False)

    # Time tracking
    reading_started_at = Column(DateTime, nullable=True)
    reading_completed_at = Column(DateTime, nullable=True)
    solving_started_at = Column(DateTime, nullable=True)
    solving_completed_at = Column(DateTime, nullable=True)

    # Duration in seconds
    reading_duration_seconds = Column(Integer, default=0)
    solving_duration_seconds = Column(Integer, default=0)

    # Understanding confirmation
    reading_confirmed = Column(Boolean, default=False)  # "이해했어요" button clicked

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="progress")
    problem = relationship("Problem", back_populates="progress_records")
    attempts = relationship("StudentAttempt", back_populates="progress", cascade="all, delete-orphan")


class StudentAttempt(Base):
    """Records student's attempts at solving a problem"""
    __tablename__ = "student_attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    problem_id = Column(String, ForeignKey("problems.id"), nullable=False)
    progress_id = Column(String, ForeignKey("student_progress.id"), nullable=False)

    # Attempt data
    attempt_number = Column(Integer, nullable=False)  # 1st attempt, 2nd attempt, etc.
    submitted_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)

    # Time tracking
    time_spent_seconds = Column(Integer, nullable=True)
    attempted_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("User", back_populates="attempts")
    problem = relationship("Problem", back_populates="attempts")
    progress = relationship("StudentProgress", back_populates="attempts")
