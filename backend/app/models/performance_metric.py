"""
Performance Metric model
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, CheckConstraint, Numeric, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class PerformanceMetric(Base):
    __tablename__ = "performance_metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_type_id = Column(UUID(as_uuid=True), ForeignKey("problem_types.id", ondelete="CASCADE"), nullable=False, index=True)

    # Aggregated metrics
    total_attempts = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    # accuracy_rate is computed in the database as a GENERATED column

    avg_solve_time_seconds = Column(Integer)
    min_solve_time_seconds = Column(Integer)
    max_solve_time_seconds = Column(Integer)

    total_hints_used = Column(Integer, default=0)
    total_gave_up = Column(Integer, default=0)

    # Time windows
    last_attempt_at = Column(DateTime)
    first_attempt_at = Column(DateTime)

    # Progress tracking
    mastery_level = Column(Integer, default=0, index=True)  # 0-100
    trend = Column(String(20), default='unknown')  # 'improving', 'stable', 'declining', 'unknown'

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="performance_metrics")
    problem_type = relationship("ProblemType", back_populates="performance_metrics")

    __table_args__ = (
        UniqueConstraint('student_id', 'problem_type_id', name='uq_student_problem_type'),
        CheckConstraint('mastery_level BETWEEN 0 AND 100', name='check_mastery_level'),
        CheckConstraint("trend IN ('improving', 'stable', 'declining', 'unknown')", name='check_trend'),
    )

    def __repr__(self):
        return f"<PerformanceMetric(id={self.id}, student_id={self.student_id}, mastery={self.mastery_level})>"

    @property
    def accuracy_rate(self):
        """Calculate accuracy rate"""
        if self.total_attempts > 0:
            return round((self.correct_attempts / self.total_attempts) * 100, 2)
        return 0.0
