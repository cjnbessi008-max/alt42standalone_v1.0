"""Student model."""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from ..database import Base


class Student(Base):
    """Student entity."""

    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(200))
    grade_level = Column(String(50), index=True)
    performance_level = Column(String(50), index=True)
    gender = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Student(student_id='{self.student_id}', name='{self.name}', grade={self.grade_level})>"
