from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid
from ..database import Base


def generate_uuid():
    """Generate UUID as string."""
    return str(uuid.uuid4())


class Student(Base):
    """Student model."""
    __tablename__ = "students"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    grade_level = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    progress = relationship("StudentProgress", back_populates="student")
    attempts = relationship("StudentAttempt", back_populates="student")


class Module(Base):
    """Educational module model."""
    __tablename__ = "modules"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    subject = Column(String(50), nullable=False, default="mathematics")
    grade_level = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="active")  # active, archived
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    problems = relationship("Problem", back_populates="module")
    progress = relationship("StudentProgress", back_populates="module")


class Problem(Base):
    """Problem model (e.g., math problems)."""
    __tablename__ = "problems"

    id = Column(String, primary_key=True, default=generate_uuid)
    module_id = Column(String, ForeignKey("modules.id"), nullable=False)
    problem_type = Column(String(50), nullable=False)  # visualization, addition, subtraction, etc.
    title = Column(String(200), nullable=False)
    description = Column(Text)
    difficulty_level = Column(Integer, nullable=False, default=1)  # 1-5
    problem_data = Column(JSON)  # Flexible field for problem-specific data
    answer_data = Column(JSON)   # Correct answer data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    module = relationship("Module", back_populates="problems")
    attempts = relationship("StudentAttempt", back_populates="problem")


class StudentProgress(Base):
    """Student progress tracking for modules."""
    __tablename__ = "student_progress"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    module_id = Column(String, ForeignKey("modules.id"), nullable=False)
    progress_percentage = Column(Float, default=0.0)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    last_accessed_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("Student", back_populates="progress")
    module = relationship("Module", back_populates="progress")


class StudentAttempt(Base):
    """Student attempt at solving a problem - core timeline data."""
    __tablename__ = "student_attempts"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    problem_id = Column(String, ForeignKey("problems.id"), nullable=False)

    # Answer data (flexible JSON for different problem types)
    answer_data = Column(JSON, nullable=False)

    # Validation
    is_correct = Column(Boolean, nullable=False)

    # Time tracking
    time_spent_seconds = Column(Integer)  # Time spent on this attempt
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Behavior tracking
    interaction_data = Column(JSON)  # Clicks, patterns, etc.

    # Feedback
    feedback_given = Column(Text)
    hint_used = Column(Boolean, default=False)

    # Relationships
    student = relationship("Student", back_populates="attempts")
    problem = relationship("Problem", back_populates="attempts")
