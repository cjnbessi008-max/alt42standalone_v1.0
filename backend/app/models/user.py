"""User model for students and teachers."""
from typing import Optional

from sqlalchemy import Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin


class User(Base, UUIDMixin, TimestampMixin):
    """User model synced from Moodle."""

    __tablename__ = "users"

    # Moodle integration
    moodle_user_id: Mapped[int] = mapped_column(Integer, unique=True, nullable=False)

    # User info
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(
        String(50), nullable=False, default="student"
    )  # 'student', 'teacher', 'admin'

    # AI-analyzed learning profile
    learning_profile: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    # Example structure:
    # {
    #   "learning_style": "visual|analytical|kinesthetic",
    #   "mastery_level": "beginner|intermediate|advanced",
    #   "preferred_strategies": ["algebraic", "graphical"],
    #   "pace": "slow|medium|fast"
    # }

    # Relationships
    attempts: Mapped[list["StudentAttempt"]] = relationship(
        "StudentAttempt", back_populates="user", cascade="all, delete-orphan"
    )
    sessions: Mapped[list["PracticeSession"]] = relationship(
        "PracticeSession", back_populates="user", cascade="all, delete-orphan"
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(
        "Recommendation", back_populates="user", cascade="all, delete-orphan"
    )
    strategy_mastery: Mapped[list["StrategyMastery"]] = relationship(
        "StrategyMastery", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"
