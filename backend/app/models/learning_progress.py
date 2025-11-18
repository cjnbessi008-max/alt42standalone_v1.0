"""
학습 진행 모델
"""
from sqlalchemy import Column, String, Integer, DECIMAL, TIMESTAMP, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..core.database import Base


class LearningProgress(Base):
    """학습 진행 상황"""
    __tablename__ = "learning_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(100), nullable=False, index=True)
    topic = Column(String(200), nullable=False)
    completion_rate = Column(DECIMAL(5, 2), default=0.00)
    score = Column(DECIMAL(5, 2))
    time_spent_minutes = Column(Integer, default=0)
    last_activity_at = Column(TIMESTAMP)
    metadata = Column(JSONB, default={})
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"), index=True)

    # Relationships
    student = relationship("Student", back_populates="learning_progress")
