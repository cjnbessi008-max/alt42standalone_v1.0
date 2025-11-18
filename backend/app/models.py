"""
SQLAlchemy database models for LMS Dropout Analysis
"""
from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Integer,
    String, Text, CheckConstraint, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True)
    grade_level = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("LearningSession", back_populates="student", cascade="all, delete-orphan")
    profile = relationship("StudentLearningProfile", back_populates="student", uselist=False, cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    subject = Column(String(100))
    grade_level = Column(String(50))
    status = Column(String(50), default='active')
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sessions = relationship("LearningSession", back_populates="module", cascade="all, delete-orphan")
    analytics = relationship("ModuleAnalytics", back_populates="module", cascade="all, delete-orphan")
    hotspots = relationship("DropoutHotspot", back_populates="module", cascade="all, delete-orphan")


class LearningSession(Base):
    __tablename__ = "learning_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    ended_at = Column(DateTime)
    is_completed = Column(Boolean, default=False)
    dropout_point = Column(Text)
    total_duration_seconds = Column(Integer)
    active_duration_seconds = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="sessions")
    module = relationship("Module", back_populates="sessions")
    events = relationship("LearningEvent", back_populates="session", cascade="all, delete-orphan")
    attempts = relationship("ProblemAttempt", back_populates="session", cascade="all, delete-orphan")
    analysis = relationship("DropoutAnalysis", back_populates="session", uselist=False, cascade="all, delete-orphan")


class LearningEvent(Base):
    __tablename__ = "learning_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("learning_sessions.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)
    event_data = Column(JSONB)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    time_since_last_event_ms = Column(Integer)

    # Relationships
    session = relationship("LearningSession", back_populates="events")


class ProblemAttempt(Base):
    __tablename__ = "problem_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("learning_sessions.id", ondelete="CASCADE"), nullable=False)
    problem_id = Column(String(255), nullable=False)
    problem_type = Column(String(100))
    difficulty_level = Column(Integer, CheckConstraint('difficulty_level >= 1 AND difficulty_level <= 5'))
    attempt_number = Column(Integer, nullable=False, default=1)
    answer_data = Column(JSONB, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_spent_seconds = Column(Integer)
    hints_used = Column(Integer, default=0)
    attempted_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("LearningSession", back_populates="attempts")


class DropoutAnalysis(Base):
    __tablename__ = "dropout_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("learning_sessions.id", ondelete="CASCADE"), nullable=False, unique=True)
    primary_reason = Column(String(100), nullable=False)
    contributing_factors = Column(JSONB)
    confidence_score = Column(Float, CheckConstraint('confidence_score >= 0 AND confidence_score <= 1'))
    recommendations = Column(JSONB)
    metrics = Column(JSONB)
    analyzed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("LearningSession", back_populates="analysis")


class StudentLearningProfile(Base):
    __tablename__ = "student_learning_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, unique=True)
    total_sessions = Column(Integer, default=0)
    completed_sessions = Column(Integer, default=0)
    dropout_sessions = Column(Integer, default=0)
    avg_session_duration_minutes = Column(Float)
    preferred_time_of_day = Column(String(20))
    avg_problems_per_session = Column(Float)
    avg_accuracy_rate = Column(Float)
    dropout_frequency = Column(Float)
    strong_topics = Column(JSONB)
    weak_topics = Column(JSONB)
    common_dropout_reasons = Column(JSONB)
    engagement_trend = Column(String(20))
    last_session_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="profile")


class ModuleAnalytics(Base):
    __tablename__ = "module_analytics"
    __table_args__ = (
        UniqueConstraint('module_id', 'date', name='uq_module_date'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime, nullable=False, default=datetime.utcnow)
    total_sessions = Column(Integer, default=0)
    dropout_sessions = Column(Integer, default=0)
    dropout_rate = Column(Float)
    avg_session_duration_minutes = Column(Float)
    avg_completion_rate = Column(Float)
    dropout_hotspots = Column(JSONB)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    module = relationship("Module", back_populates="analytics")


class DropoutHotspot(Base):
    __tablename__ = "dropout_hotspots"
    __table_args__ = (
        UniqueConstraint('module_id', 'location_identifier', name='uq_module_location'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    location_identifier = Column(String(255), nullable=False)
    location_type = Column(String(50))
    dropout_count = Column(Integer, default=0)
    common_reason = Column(String(100))
    avg_time_before_dropout_seconds = Column(Integer)
    severity_score = Column(Float)
    last_occurred_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    module = relationship("Module", back_populates="hotspots")
