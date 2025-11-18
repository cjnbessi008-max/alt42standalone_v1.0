"""
SQLAlchemy database models for LMS Integration and Mistake Pattern Analysis
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Boolean, Column, DateTime, Integer, String, Text,
    ForeignKey, ARRAY, JSON, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, declarative_base
import uuid

Base = declarative_base()


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_lms_id = Column(String(255), unique=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    grade_level = Column(Integer)
    institution = Column(String(255))
    metadata = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    attempts = relationship("StudentAttempt", back_populates="student", cascade="all, delete-orphan")
    mistake_patterns = relationship("MistakePattern", back_populates="student", cascade="all, delete-orphan")
    warnings = relationship("MistakeWarning", back_populates="student", cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    subject = Column(String(100))
    grade_level = Column(Integer)
    teacher_id = Column(UUID(as_uuid=True))
    status = Column(String(50), default="active")
    metadata = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    problems = relationship("Problem", back_populates="module", cascade="all, delete-orphan")
    attempts = relationship("StudentAttempt", back_populates="module", cascade="all, delete-orphan")
    mistake_patterns = relationship("MistakePattern", back_populates="module", cascade="all, delete-orphan")


class Problem(Base):
    __tablename__ = "problems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_type = Column(String(100), nullable=False, index=True)
    content = Column(JSONB, nullable=False)
    difficulty_level = Column(Integer, CheckConstraint("difficulty_level BETWEEN 1 AND 5"))
    correct_answer = Column(JSONB, nullable=False)
    tags = Column(ARRAY(Text), default=[])
    metadata = Column(JSONB, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    module = relationship("Module", back_populates="problems")
    attempts = relationship("StudentAttempt", back_populates="problem", cascade="all, delete-orphan")
    warnings = relationship("MistakeWarning", back_populates="problem", cascade="all, delete-orphan")


class StudentAttempt(Base):
    __tablename__ = "student_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False, index=True)
    submitted_answer = Column(JSONB, nullable=False)
    is_correct = Column(Boolean, nullable=False, index=True)
    time_spent_seconds = Column(Integer)
    attempt_number = Column(Integer, default=1)
    attempted_at = Column(DateTime, default=datetime.utcnow, index=True)
    metadata = Column(JSONB, default={})

    # Relationships
    student = relationship("Student", back_populates="attempts")
    problem = relationship("Problem", back_populates="attempts")
    module = relationship("Module", back_populates="attempts")


class MistakePattern(Base):
    __tablename__ = "mistake_patterns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), index=True)
    pattern_type = Column(String(100), nullable=False, index=True)
    pattern_category = Column(String(100))
    description = Column(Text)
    frequency = Column(Integer, default=1)
    severity = Column(String(50), default="medium")
    problem_types = Column(ARRAY(Text), default=[])
    example_attempts = Column(ARRAY(UUID), default=[])
    pattern_data = Column(JSONB, default={})
    first_occurrence = Column(DateTime, default=datetime.utcnow)
    last_occurrence = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="mistake_patterns")
    module = relationship("Module", back_populates="mistake_patterns")
    warnings = relationship("MistakeWarning", back_populates="pattern", cascade="all, delete-orphan")


class MistakeWarning(Base):
    __tablename__ = "mistake_warnings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False, index=True)
    pattern_id = Column(UUID(as_uuid=True), ForeignKey("mistake_patterns.id", ondelete="CASCADE"), nullable=False)
    warning_type = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="medium")
    is_dismissed = Column(Boolean, default=False, index=True)
    shown_at = Column(DateTime, default=datetime.utcnow)
    dismissed_at = Column(DateTime)
    metadata = Column(JSONB, default={})

    # Relationships
    student = relationship("Student", back_populates="warnings")
    problem = relationship("Problem", back_populates="warnings")
    pattern = relationship("MistakePattern", back_populates="warnings")


class LMSSyncLog(Base):
    __tablename__ = "lms_sync_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sync_type = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    records_synced = Column(Integer, default=0)
    error_message = Column(Text)
    sync_data = Column(JSONB, default={})
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
