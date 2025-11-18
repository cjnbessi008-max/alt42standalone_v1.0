"""
Notification model
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, CheckConstraint, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    bottleneck_id = Column(UUID(as_uuid=True), ForeignKey("bottleneck_detections.id", ondelete="SET NULL"), nullable=True)

    type = Column(String(50), nullable=False)  # 'bottleneck_detected', 'improvement_noted', etc.
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20))  # 'info', 'warning', 'critical'

    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    metadata = Column(JSONB)

    # Relationships
    student = relationship("Student", back_populates="notifications")
    bottleneck = relationship("BottleneckDetection", back_populates="notifications")

    __table_args__ = (
        CheckConstraint("severity IN ('info', 'warning', 'critical')", name='check_notification_severity'),
    )

    def __repr__(self):
        return f"<Notification(id={self.id}, type={self.type}, is_read={self.is_read})>"
