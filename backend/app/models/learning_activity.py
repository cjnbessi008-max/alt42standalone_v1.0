"""
Learning activity and problem attempt models
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..database import Base


class LearningActivity(Base):
    """
    Learning activity session representing a study period
    """
    __tablename__ = "learning_activities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String, ForeignKey("students.id"), nullable=False)

    # Session information
    session_start = Column(DateTime, nullable=False, default=datetime.utcnow)
    session_end = Column(DateTime, nullable=True)
    duration_minutes = Column(Float, nullable=True)

    # Subject and topic
    subject = Column(String(50), nullable=False, default="mathematics")
    topic = Column(String(100), nullable=True)

    # Session metrics
    total_problems = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    incorrect_answers = Column(Integer, default=0)
    hints_used = Column(Integer, default=0)

    # Self-assessment
    self_confidence_before = Column(Integer, nullable=True)  # 1-5 scale
    self_confidence_after = Column(Integer, nullable=True)   # 1-5 scale

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="activities")
    problem_attempts = relationship("ProblemAttempt", back_populates="activity", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LearningActivity(id={self.id}, student_id={self.student_id}, topic={self.topic})>"


class ProblemAttempt(Base):
    """
    Individual problem attempt within a learning session
    """
    __tablename__ = "problem_attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    activity_id = Column(String, ForeignKey("learning_activities.id"), nullable=False)

    # Problem information
    problem_id = Column(String, nullable=False)
    problem_type = Column(String(50), nullable=True)
    difficulty_level = Column(Integer, nullable=True)  # 1-5 scale

    # Attempt details
    attempt_number = Column(Integer, default=1)  # Track retries
    time_spent_seconds = Column(Float, nullable=True)
    is_correct = Column(Boolean, nullable=False)

    # Metacognitive data
    hints_requested = Column(Integer, default=0)
    gave_up = Column(Boolean, default=False)
    self_assessment_before = Column(Integer, nullable=True)  # Expected difficulty 1-5
    self_assessment_after = Column(Integer, nullable=True)   # Actual difficulty felt 1-5

    # Answer data
    student_answer = Column(JSON, nullable=True)
    correct_answer = Column(JSON, nullable=True)

    # Metadata
    attempted_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    activity = relationship("LearningActivity", back_populates="problem_attempts")

    def __repr__(self):
        return f"<ProblemAttempt(id={self.id}, problem_id={self.problem_id}, correct={self.is_correct})>"
