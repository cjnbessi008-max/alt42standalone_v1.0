"""Problem and SolutionStrategy models."""
from typing import Optional

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin, UUIDMixin


class Problem(Base, UUIDMixin, TimestampMixin):
    """Problem model imported from Moodle or AI-generated."""

    __tablename__ = "problems"

    # Moodle integration (NULL if AI-generated)
    moodle_question_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    course_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    quiz_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Problem details
    problem_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'math', 'coding', 'logic', 'physics', etc.
    difficulty_level: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("difficulty_level >= 1 AND difficulty_level <= 5"),
        nullable=False,
    )
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    original_solution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    topic: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )  # 'algebra', 'geometry', 'calculus', etc.

    # Additional metadata
    metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    # Example structure:
    # {
    #   "tags": ["linear_equations", "two_step"],
    #   "estimated_time_minutes": 5,
    #   "learning_objectives": ["solve linear equations"],
    #   "prerequisites": ["basic_algebra"],
    #   "images": ["url1", "url2"]
    # }

    # Relationships
    strategies: Mapped[list["SolutionStrategy"]] = relationship(
        "SolutionStrategy", back_populates="problem", cascade="all, delete-orphan"
    )
    attempts: Mapped[list["StudentAttempt"]] = relationship(
        "StudentAttempt", back_populates="problem", cascade="all, delete-orphan"
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(
        "Recommendation", back_populates="problem", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Problem(id={self.id}, type={self.problem_type}, difficulty={self.difficulty_level})>"


class SolutionStrategy(Base, UUIDMixin, TimestampMixin):
    """Alternative solving strategies for a problem."""

    __tablename__ = "solution_strategies"

    # Foreign key
    problem_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False
    )

    # Strategy details
    strategy_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'algebraic', 'graphical', 'numerical', 'visual', etc.
    strategy_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Step-by-step solution
    solution_steps: Mapped[dict] = mapped_column(JSONB, nullable=False)
    # Example structure:
    # {
    #   "steps": [
    #     {
    #       "step_number": 1,
    #       "instruction": "Subtract 5 from both sides",
    #       "equation": "2x + 5 - 5 = 13 - 5",
    #       "explanation": "To isolate x, we first remove the constant term"
    #     },
    #     ...
    #   ],
    #   "final_answer": "x = 4",
    #   "verification": "Substitute x=4: 2(4)+5 = 8+5 = 13 ✓"
    # }

    # Difficulty modifier relative to original problem
    difficulty_modifier: Mapped[int] = mapped_column(
        Integer,
        CheckConstraint("difficulty_modifier >= -2 AND difficulty_modifier <= 2"),
        default=0,
        nullable=False,
    )

    # Generation source
    generated_by: Mapped[str] = mapped_column(
        String(50), default="ai", nullable=False
    )  # 'ai' or 'teacher'

    # Relationships
    problem: Mapped["Problem"] = relationship("Problem", back_populates="strategies")
    attempts: Mapped[list["StudentAttempt"]] = relationship(
        "StudentAttempt", back_populates="strategy"
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(
        "Recommendation", back_populates="recommended_strategy"
    )

    def __repr__(self) -> str:
        return f"<SolutionStrategy(id={self.id}, type={self.strategy_type}, name={self.strategy_name})>"
