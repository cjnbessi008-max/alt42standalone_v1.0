from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.db.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class User(Base):
    """User model for students and teachers"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    grade_level = Column(String, nullable=True)  # For students
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    progress = relationship("StudentProgress", back_populates="student", cascade="all, delete-orphan")
    attempts = relationship("StudentAttempt", back_populates="student", cascade="all, delete-orphan")
