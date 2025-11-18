"""
Student attempt model - records each problem-solving attempt.
"""
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class StudentAttempt(Base):
    """
    Record of a student attempting to solve a problem.
    This is the core data for TES calculation.
    """

    __tablename__ = "student_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Who, what, where
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False, index=True)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id"), nullable=False, index=True)

    # Attempt data
    student_answer = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False)

    # Time tracking (crucial for TES speed component)
    time_spent_seconds = Column(Integer, nullable=False)
    attempted_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Attempt metadata
    attempt_number = Column(Integer, default=1)  # 1 for first try, 2+ for retries
    hints_used = Column(Integer, default=0)

    # Problem type (denormalized for faster queries)
    problem_type = Column(String(50), nullable=False, index=True)

    # Relationships
    student = relationship("Student", back_populates="attempts")
    module = relationship("Module", back_populates="attempts")
    problem = relationship("Problem", back_populates="attempts")

    def __repr__(self):
        return f"<Attempt {self.student_id[:8]} - Problem {self.problem_id[:8]} - {'✓' if self.is_correct else '✗'}>"
