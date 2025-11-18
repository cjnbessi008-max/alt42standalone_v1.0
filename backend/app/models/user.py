"""
User models: Teacher and Student.
"""
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class Teacher(Base):
    """Teacher model."""

    __tablename__ = "teachers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # For direct login

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    modules = relationship("Module", back_populates="teacher")

    def __repr__(self):
        return f"<Teacher {self.name} ({self.email})>"


class Student(Base):
    """Student model."""

    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)  # For direct login

    # Optional: cohort grouping for statistics
    cohort_id = Column(String(100), nullable=True, index=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    attempts = relationship("StudentAttempt", back_populates="student")
    efficiency_scores = relationship("EfficiencyScore", back_populates="student")

    def __repr__(self):
        return f"<Student {self.name} ({self.email})>"
