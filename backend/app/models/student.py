"""
Student model
"""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_number = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    grade_level = Column(String(20), index=True)
    email = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    attempts = relationship("StudentAttempt", back_populates="student", cascade="all, delete-orphan")
    bottlenecks = relationship("BottleneckDetection", back_populates="student", cascade="all, delete-orphan")
    performance_metrics = relationship("PerformanceMetric", back_populates="student", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="student", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Student(id={self.id}, name={self.name}, student_number={self.student_number})>"
