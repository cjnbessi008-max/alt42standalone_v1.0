"""
Student Attempt model
"""
from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class StudentAttempt(Base):
    __tablename__ = "student_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_type_id = Column(UUID(as_uuid=True), ForeignKey("problem_types.id"), nullable=False, index=True)

    # Attempt details
    submitted_answer = Column(JSONB, nullable=False)
    is_correct = Column(Boolean, nullable=False, index=True)
    attempt_number = Column(Integer, default=1)  # Which attempt number

    # Time tracking
    started_at = Column(DateTime, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, index=True)
    # time_spent_seconds is computed in the database as a GENERATED column

    # Additional data
    hints_used = Column(Integer, default=0)
    gave_up = Column(Boolean, default=False)
    confidence_level = Column(Integer)  # 1-5
    metadata = Column(JSONB)  # Additional tracking data

    # Relationships
    student = relationship("Student", back_populates="attempts")
    problem = relationship("Problem", back_populates="attempts")
    problem_type = relationship("ProblemType", back_populates="attempts")

    __table_args__ = (
        CheckConstraint('confidence_level BETWEEN 1 AND 5', name='check_confidence_level'),
    )

    def __repr__(self):
        return f"<StudentAttempt(id={self.id}, student_id={self.student_id}, is_correct={self.is_correct})>"

    @property
    def time_spent_seconds(self):
        """Calculate time spent on this attempt"""
        if self.started_at and self.submitted_at:
            delta = self.submitted_at - self.started_at
            return int(delta.total_seconds())
        return 0
