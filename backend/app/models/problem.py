"""
Problem, Pattern, and Progress models
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, Numeric, func, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base
import enum


class DifficultyLevel(str, enum.Enum):
    """Difficulty levels enum"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class PatternType(Base):
    """Pattern type model"""
    __tablename__ = "pattern_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    difficulty_level = Column(Enum(DifficultyLevel), nullable=False, index=True)
    pattern_rule = Column(Text, nullable=False)  # JSON
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    problems = relationship("Problem", back_populates="pattern_type")
    student_progress = relationship("StudentProgress", back_populates="pattern_type")


class Problem(Base):
    """Problem model"""
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    moodle_question_id = Column(Integer, unique=True, index=True)
    pattern_type_id = Column(Integer, ForeignKey("pattern_types.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    initial_sequence = Column(Text, nullable=False)  # JSON array
    target_sequence = Column(Text, nullable=False)  # JSON array
    pattern_hint = Column(Text)
    difficulty_level = Column(Enum(DifficultyLevel), nullable=False, index=True)
    time_limit_seconds = Column(Integer, default=300)
    max_attempts = Column(Integer, default=3)
    points = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    pattern_type = relationship("PatternType", back_populates="problems")
    attempts = relationship("Attempt", back_populates="problem", cascade="all, delete-orphan")


class Attempt(Base):
    """Student attempt model"""
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False, index=True)
    submitted_sequence = Column(Text, nullable=False)  # JSON array
    is_correct = Column(Boolean, nullable=False)
    time_spent_seconds = Column(Integer)
    score = Column(Integer, default=0)
    attempt_number = Column(Integer, default=1)
    feedback = Column(Text)
    submitted_at = Column(DateTime, server_default=func.now(), index=True)

    # Relationships
    student = relationship("Student", back_populates="attempts")
    problem = relationship("Problem", back_populates="attempts")


class StudentProgress(Base):
    """Student progress tracking model"""
    __tablename__ = "student_progress"
    __table_args__ = (
        UniqueConstraint('student_id', 'pattern_type_id', name='unique_student_pattern'),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    pattern_type_id = Column(Integer, ForeignKey("pattern_types.id"), nullable=False)
    problems_attempted = Column(Integer, default=0)
    problems_solved = Column(Integer, default=0)
    total_score = Column(Integer, default=0)
    average_time_seconds = Column(Numeric(10, 2))
    mastery_level = Column(Numeric(5, 2), default=0.00, index=True)  # 0-100 percentage
    last_activity_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    student = relationship("Student", back_populates="progress")
    pattern_type = relationship("PatternType", back_populates="student_progress")
