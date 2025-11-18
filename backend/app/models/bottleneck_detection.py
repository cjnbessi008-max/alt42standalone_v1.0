"""
Bottleneck Detection model
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, CheckConstraint, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class BottleneckDetection(Base):
    __tablename__ = "bottleneck_detections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_type_id = Column(UUID(as_uuid=True), ForeignKey("problem_types.id", ondelete="CASCADE"), nullable=False, index=True)

    # Detection metrics
    accuracy_rate = Column(Numeric(5, 2))  # 0-100
    avg_solve_time_seconds = Column(Integer)
    avg_attempts = Column(Numeric(5, 2))
    abandonment_rate = Column(Numeric(5, 2))  # 0-100
    difficulty_score = Column(Numeric(5, 2))  # 0-100

    # Detection details
    total_attempts = Column(Integer, nullable=False)
    correct_attempts = Column(Integer, nullable=False)
    detection_reason = Column(Text)
    severity = Column(String(20), index=True)  # 'low', 'medium', 'high', 'critical'

    # Timestamps
    detected_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime)
    is_active = Column(Boolean, default=True, index=True)

    # Recommendations
    recommended_actions = Column(JSONB)

    # Relationships
    student = relationship("Student", back_populates="bottlenecks")
    problem_type = relationship("ProblemType", back_populates="bottlenecks")
    notifications = relationship("Notification", back_populates="bottleneck")

    __table_args__ = (
        CheckConstraint("severity IN ('low', 'medium', 'high', 'critical')", name='check_severity'),
    )

    def __repr__(self):
        return f"<BottleneckDetection(id={self.id}, student_id={self.student_id}, severity={self.severity})>"
