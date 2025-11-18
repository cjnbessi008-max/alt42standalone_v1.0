from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class Solution(Base):
    __tablename__ = "solutions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Problem reference
    problem_id = Column(String, ForeignKey("problems.id"), nullable=False)

    # Student reference (null for model solutions)
    student_id = Column(String, ForeignKey("users.id"), nullable=True)

    # Solution content
    content = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)  # Step-by-step explanation

    # Metadata
    is_model_solution = Column(Boolean, default=False)  # True if this is the reference solution
    score = Column(Integer, nullable=True)

    # Timestamps
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    problem = relationship("Problem", back_populates="solutions")
    student = relationship("User", back_populates="solutions")
    comparisons = relationship("Comparison", back_populates="student_solution", cascade="all, delete-orphan")
