"""
Student model
"""
from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..database import Base


class Student(Base):
    """
    Student model representing a learner in the system
    """
    __tablename__ = "students"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    grade_level = Column(String(20), nullable=True)

    # User type
    is_teacher = Column(Boolean, default=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    activities = relationship("LearningActivity", back_populates="student", cascade="all, delete-orphan")
    insights = relationship("GrowthInsight", back_populates="student", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Student(id={self.id}, name={self.name})>"
