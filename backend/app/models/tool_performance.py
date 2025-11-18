"""Tool Performance model."""
from sqlalchemy import Column, Integer, DateTime, Numeric, String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from ..database import Base


class ToolPerformance(Base):
    """Student performance on specific tools."""

    __tablename__ = "tool_performance"
    __table_args__ = (
        UniqueConstraint('student_id', 'tool_id', name='uq_student_tool'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.id', ondelete='CASCADE'), index=True)
    tool_id = Column(UUID(as_uuid=True), ForeignKey('concept_tools.id', ondelete='CASCADE'), index=True)
    attempts_count = Column(Integer, default=0)
    success_count = Column(Integer, default=0)
    average_score = Column(Numeric(5, 2))
    total_time_spent_seconds = Column(Integer, default=0)
    last_used = Column(DateTime(timezone=True))
    mastery_level = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<ToolPerformance(student='{self.student_id}', tool='{self.tool_id}', mastery='{self.mastery_level}')>"
