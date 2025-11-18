"""Recommendation and strategy mastery models."""
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    CheckConstraint,
    Computed,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin


class Recommendation(Base, UUIDMixin, TimestampMixin):
    """AI-generated recommendations for students to try alternative strategies."""

    __tablename__ = "recommendations"

    # Foreign keys
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    problem_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("problems.id", ondelete="CASCADE"),
        nullable=False,
    )
    recommended_strategy_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("solution_strategies.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Recommendation details
    reason: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # AI-generated explanation of why this is recommended
    priority: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("priority >= 1 AND priority <= 5"),
        default=1,
        nullable=False,
    )  # 1 (highest) to 5 (lowest)
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # 'pending', 'accepted', 'skipped', 'completed'

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="recommendations")
    problem: Mapped["Problem"] = relationship("Problem", back_populates="recommendations")
    recommended_strategy: Mapped["SolutionStrategy"] = relationship(
        "SolutionStrategy", back_populates="recommendations"
    )

    def __repr__(self) -> str:
        return f"<Recommendation(id={self.id}, user_id={self.user_id}, status={self.status})>"


class StrategyMastery(Base, UUIDMixin):
    """Tracks student's mastery level for each strategy type and topic."""

    __tablename__ = "strategy_mastery"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "strategy_type", "topic", name="uq_user_strategy_topic"
        ),
    )

    # Foreign key
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Strategy and topic
    strategy_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'algebraic', 'graphical', 'numerical', etc.
    topic: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )  # 'algebra', 'geometry', etc.

    # Statistics
    attempts_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    success_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Computed success rate
    success_rate: Mapped[float] = mapped_column(
        Numeric(5, 2),
        Computed(
            """
            CASE WHEN attempts_count > 0
            THEN (success_count::DECIMAL / attempts_count * 100)
            ELSE 0 END
            """,
            persisted=True,
        ),
        nullable=True,
    )

    # Mastery level
    mastery_level: Mapped[str] = mapped_column(
        String(20), default="novice", nullable=False
    )  # 'novice', 'developing', 'proficient', 'expert'

    last_practiced_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="strategy_mastery")

    def update_mastery_level(self) -> None:
        """Update mastery level based on success rate and attempt count."""
        if self.attempts_count < 3:
            self.mastery_level = "novice"
        elif self.success_rate < 50:
            self.mastery_level = "developing"
        elif self.success_rate < 80:
            self.mastery_level = "proficient"
        else:
            self.mastery_level = "expert"

    def __repr__(self) -> str:
        return f"<StrategyMastery(user_id={self.user_id}, strategy={self.strategy_type}, level={self.mastery_level})>"
