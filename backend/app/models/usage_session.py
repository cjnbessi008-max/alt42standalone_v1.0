"""Usage Session model."""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from ..database import Base


class UsageSession(Base):
    """Tool usage session entity."""

    __tablename__ = "usage_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.id', ondelete='CASCADE'), index=True)
    tool_id = Column(UUID(as_uuid=True), ForeignKey('concept_tools.id', ondelete='CASCADE'), index=True)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey('teachers.id', ondelete='SET NULL'), index=True, nullable=True)
    session_start = Column(DateTime(timezone=True), nullable=False, index=True)
    session_end = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer)
    interactions_count = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    success_rate = Column(Numeric(5, 2))
    context = Column(String(100))  # 'classroom', 'homework', 'self_study'
    device_type = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<UsageSession(student_id='{self.student_id}', tool_id='{self.tool_id}', start='{self.session_start}')>"
