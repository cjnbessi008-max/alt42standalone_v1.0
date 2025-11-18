"""
Student and Session models
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base


class Student(Base):
    """Student model"""
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    moodle_user_id = Column(Integer, unique=True, nullable=False, index=True)
    username = Column(String(255), nullable=False, index=True)
    email = Column(String(255))
    full_name = Column(String(255))
    grade_level = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    attempts = relationship("Attempt", back_populates="student", cascade="all, delete-orphan")
    progress = relationship("StudentProgress", back_populates="student", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="student", cascade="all, delete-orphan")


class Session(Base):
    """Learning session model"""
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    session_token = Column(String(255), unique=True, nullable=False, index=True)
    moodle_session_id = Column(String(255))
    started_at = Column(DateTime, server_default=func.now())
    last_active_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    ended_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, index=True)

    # Relationships
    student = relationship("Student", back_populates="sessions")
