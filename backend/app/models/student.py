"""
Student model
"""
from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class Student(Base):
    """Student information from Moodle"""

    __tablename__ = "students"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    moodle_id = Column(Integer, unique=True, nullable=False, index=True)
    username = Column(String(255), unique=True, nullable=False)
    email = Column(String(255), nullable=False)
    firstname = Column(String(255))
    lastname = Column(String(255))
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_sync = Column(DateTime)

    # Relationships
    submissions = relationship("Submission", back_populates="student")

    def __repr__(self):
        return f"<Student {self.username} (Moodle ID: {self.moodle_id})>"
