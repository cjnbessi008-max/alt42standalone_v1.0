"""User model for the application."""
from sqlalchemy import Column, String, Integer, Enum
from sqlalchemy.orm import relationship
import enum
from .base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    """User roles in the system."""

    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class User(Base, TimestampMixin):
    """User model representing students and teachers."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)

    # LMS Integration fields (for future use)
    lms_user_id = Column(String, unique=True, nullable=True, index=True)
    institution = Column(String, nullable=True)
    grade_level = Column(String, nullable=True)

    # Relationships
    focus_sessions = relationship("FocusSession", back_populates="user", cascade="all, delete-orphan")
    time_recommendations = relationship("TimeRecommendation", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
