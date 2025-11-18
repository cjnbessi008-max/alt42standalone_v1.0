"""
Module and Problem models.
"""
from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class Module(Base):
    """Educational module (e.g., Fractions, Decimals)."""

    __tablename__ = "modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Which teacher created this module
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=False, index=True)

    # Module status
    is_active = Column(Boolean, default=True)
    is_published = Column(Boolean, default=False)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    teacher = relationship("Teacher", back_populates="modules")
    problems = relationship("Problem", back_populates="module", cascade="all, delete-orphan")
    attempts = relationship("StudentAttempt", back_populates="module")
    efficiency_scores = relationship("EfficiencyScore", back_populates="module")

    def __repr__(self):
        return f"<Module {self.name}>"


class Problem(Base):
    """Individual problem within a module."""

    __tablename__ = "problems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False, index=True)

    # Problem type for consistency scoring
    problem_type = Column(String(50), nullable=False, index=True)  # e.g., "visualization", "addition"

    # Problem content
    question_text = Column(Text, nullable=False)
    correct_answer = Column(String(255), nullable=False)

    # Optional: hints, difficulty level
    hints = Column(Text, nullable=True)
    difficulty = Column(String(20), default="medium")  # easy, medium, hard

    # Order in module
    order_index = Column(Integer, default=0)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    module = relationship("Module", back_populates="problems")
    attempts = relationship("StudentAttempt", back_populates="problem")

    def __repr__(self):
        return f"<Problem {self.id} - {self.problem_type}>"
