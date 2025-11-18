"""
User Model
"""
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, UUID, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration"""
    STUDENT = "student"
    TEACHER = "teacher"
    COUNSELOR = "counselor"
    ADMIN = "admin"


class User(Base):
    """User model for students, teachers, counselors, and administrators"""

    __tablename__ = "users"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, index=True)

    # LMS Integration
    lms_user_id = Column(String(255), index=True)
    institution_id = Column(PG_UUID(as_uuid=True), ForeignKey("institutions.id"))

    # Authentication
    password_hash = Column(String(255))  # For non-SSO users

    # Preferences
    preferences = Column(JSON, default={
        "language": "ko",
        "notification_email": True,
        "notification_app": True,
        "digest_time": "09:00"
    })

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)

    # Status
    is_active = Column(Boolean, default=True)

    # Relationships
    institution = relationship("Institution", back_populates="users")
    enrollments = relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")
    worry_notes = relationship("WorryNote", back_populates="student", foreign_keys="WorryNote.student_id")
    responses = relationship("Response", back_populates="responder")
    assigned_notes = relationship("WorryNote", back_populates="assigned_user", foreign_keys="WorryNote.assigned_to")

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

    @property
    def is_student(self) -> bool:
        return self.role == UserRole.STUDENT

    @property
    def is_teacher(self) -> bool:
        return self.role == UserRole.TEACHER

    @property
    def is_counselor(self) -> bool:
        return self.role == UserRole.COUNSELOR

    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN
