from sqlalchemy import Column, String, Text, Integer, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.db.database import Base


class ProblemType(str, enum.Enum):
    """Problem type enumeration"""
    MULTIPLE_CHOICE = "multiple_choice"
    SHORT_ANSWER = "short_answer"
    ESSAY = "essay"
    MATH = "math"
    CODING = "coding"


class DifficultyLevel(str, enum.Enum):
    """Difficulty level enumeration"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Problem(Base):
    """Problem model - represents a learning problem/question"""
    __tablename__ = "problems"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    problem_type = Column(Enum(ProblemType), nullable=False)
    difficulty_level = Column(Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    subject = Column(String, nullable=False)  # e.g., "Mathematics", "Science"
    grade_level = Column(String, nullable=False)  # e.g., "3rd Grade"

    # Content
    reading_content = Column(Text, nullable=False)  # Content shown in reading stage
    reading_visual_url = Column(String, nullable=True)  # URL to image/diagram for reading stage
    question_text = Column(Text, nullable=False)  # Question shown in solving stage

    # Answer data
    correct_answer = Column(Text, nullable=False)
    answer_options = Column(JSON, nullable=True)  # For multiple choice: {"A": "...", "B": "..."}
    explanation = Column(Text, nullable=True)  # Explanation shown after answer

    # Metadata
    tags = Column(JSON, default=list)  # ["fractions", "addition", "visualization"]
    created_by = Column(String, nullable=True)  # Teacher ID
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    progress_records = relationship("StudentProgress", back_populates="problem", cascade="all, delete-orphan")
    attempts = relationship("StudentAttempt", back_populates="problem", cascade="all, delete-orphan")
