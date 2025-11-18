from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from ..database import Base


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)

    # Session details
    module_name = Column(String(200), nullable=False)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=0)

    # Performance metrics
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    accuracy_percentage = Column(Float, default=0.0)
    progress_percentage = Column(Float, default=0.0)

    # Additional data
    metadata = Column(JSON, nullable=True)  # Flexible field for module-specific data

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="learning_sessions")
    achievements = relationship("Achievement", back_populates="learning_session")

    def __repr__(self):
        return f"<LearningSession {self.module_name} - {self.accuracy_percentage}%>"
