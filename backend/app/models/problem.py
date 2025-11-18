"""
Problem model
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class Problem(Base):
    __tablename__ = "problems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    problem_type_id = Column(UUID(as_uuid=True), ForeignKey("problem_types.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(JSONB, nullable=False)  # Problem content (text, image URLs, etc.)
    correct_answer = Column(JSONB, nullable=False)  # Correct answer
    difficulty_level = Column(Integer)  # 1-5
    points = Column(Integer, default=10)  # Points for solving
    hints = Column(JSONB)  # Array of hints
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    problem_type = relationship("ProblemType", back_populates="problems")
    attempts = relationship("StudentAttempt", back_populates="problem")

    def __repr__(self):
        return f"<Problem(id={self.id}, title={self.title})>"
