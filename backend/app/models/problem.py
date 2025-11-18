from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.database import Base


class ProblemDifficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ProblemType(str, enum.Enum):
    MATH = "math"
    CODING = "coding"
    ESSAY = "essay"


class Problem(Base):
    __tablename__ = "problems"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    problem_type = Column(Enum(ProblemType), nullable=False, default=ProblemType.MATH)
    difficulty = Column(Enum(ProblemDifficulty), default=ProblemDifficulty.MEDIUM)

    # Author (teacher)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Problem metadata
    max_score = Column(Integer, default=100)
    time_limit_minutes = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    author = relationship("User", back_populates="problems")
    solutions = relationship("Solution", back_populates="problem", cascade="all, delete-orphan")
    model_solutions = relationship(
        "Solution",
        primaryjoin="and_(Problem.id==Solution.problem_id, Solution.is_model_solution==True)",
        viewonly=True
    )
