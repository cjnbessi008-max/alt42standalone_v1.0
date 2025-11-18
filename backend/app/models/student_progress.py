from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin, UUIDMixin
from datetime import datetime


class StudentProgress(Base, UUIDMixin, TimestampMixin):
    """
    Student progress model - tracks student progress on problems
    """
    __tablename__ = "student_progress"

    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False, index=True)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id"), nullable=False, index=True)

    # Progress tracking
    hints_used = Column(ARRAY(Integer), nullable=False, default=list)  # List of hint levels used
    attempts = Column(Integer, nullable=False, default=0)
    completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime, nullable=True)

    # Time tracking
    time_spent_seconds = Column(Integer, nullable=True)

    # Relationships
    problem = relationship("Problem", back_populates="student_progress")

    def __repr__(self):
        return f"<StudentProgress(student_id={self.student_id}, problem_id={self.problem_id}, completed={self.completed})>"
