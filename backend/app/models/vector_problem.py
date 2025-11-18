"""SQLAlchemy models for vector transformation problems."""
from sqlalchemy import Column, String, Numeric, Integer, Boolean, DateTime, CheckConstraint, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from ..database import Base


class Module(Base):
    """Educational module."""
    __tablename__ = "modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    module_type = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)


class VectorProblem(Base):
    """Vector transformation problem."""
    __tablename__ = "vector_problems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    problem_type = Column(String(50), nullable=False)  # 'rotation', 'scaling', 'combined'

    # Initial vector
    initial_x = Column(Numeric(10, 2), nullable=False)
    initial_y = Column(Numeric(10, 2), nullable=False)

    # Transformation parameters
    rotation_angle = Column(Numeric(10, 2))  # degrees
    scale_x = Column(Numeric(10, 2))  # x-axis scaling factor
    scale_y = Column(Numeric(10, 2))  # y-axis scaling factor

    # Expected result vector
    expected_x = Column(Numeric(10, 2), nullable=False)
    expected_y = Column(Numeric(10, 2), nullable=False)

    # Metadata
    difficulty_level = Column(Integer, CheckConstraint('difficulty_level BETWEEN 1 AND 5'))
    animation_duration = Column(Integer, default=2000)  # milliseconds

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Student(Base):
    """Student account."""
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_number = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    grade_level = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class StudentAttempt(Base):
    """Student attempt tracking."""
    __tablename__ = "student_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("vector_problems.id", ondelete="CASCADE"), nullable=False)

    # Student's answer
    answer_x = Column(Numeric(10, 2))
    answer_y = Column(Numeric(10, 2))

    # Attempt metadata
    is_correct = Column(Boolean)
    time_spent_seconds = Column(Integer)
    attempts_count = Column(Integer, default=1)
    hint_used = Column(Boolean, default=False)

    attempted_at = Column(DateTime(timezone=True), server_default=func.now())
