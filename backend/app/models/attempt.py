"""Student attempt and practice session models."""
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin


class StudentAttempt(Base, UUIDMixin, TimestampMixin):
    """Student's attempt at solving a problem with a specific strategy."""

    __tablename__ = "student_attempts"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "problem_id",
            "strategy_id",
            "attempt_number",
            name="uq_user_problem_strategy_attempt",
        ),
    )

    # Foreign keys
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    problem_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
    )
    strategy_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("solution_strategies.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Attempt details
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    student_answer: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    time_spent_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hints_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    confidence_level: Mapped[Optional[int]] = mapped_column(
        Integer,
        CheckConstraint("confidence_level >= 1 AND confidence_level <= 5"),
        nullable=True,
    )  # 1 (not confident) to 5 (very confident)

    attempted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="NOW()"
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="attempts")
    problem: Mapped["Problem"] = relationship("Problem", back_populates="attempts")
    strategy: Mapped[Optional["SolutionStrategy"]] = relationship(
        "SolutionStrategy", back_populates="attempts"
    )

    def __repr__(self) -> str:
        return f"<StudentAttempt(id={self.id}, user_id={self.user_id}, correct={self.is_correct})>"


class PracticeSession(Base, UUIDMixin, TimestampMixin):
    """Practice session tracking for a student."""

    __tablename__ = "practice_sessions"

    # Foreign key
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Session details
    session_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'guided', 'free_practice', 'challenge', 'review'
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="NOW()"
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Session statistics
    total_problems: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    problems_correct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    strategies_explored: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )  # Number of different strategies used

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="sessions")

    @property
    def duration_minutes(self) -> Optional[int]:
        """Calculate session duration in minutes."""
        if self.ended_at and self.started_at:
            return int((self.ended_at - self.started_at).total_seconds() / 60)
        return None

    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.total_problems == 0:
            return 0.0
        return (self.problems_correct / self.total_problems) * 100

    def __repr__(self) -> str:
        return f"<PracticeSession(id={self.id}, type={self.session_type}, problems={self.total_problems})>"
