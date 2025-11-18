"""
SQLAlchemy models for impairment detection analytics database.

This module defines the PostgreSQL database models for storing
student behavior sessions, interactions, impairment assessments, and alerts.
"""

from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from sqlalchemy import (
    Column, String, Integer, Boolean, TIMESTAMP, ForeignKey,
    CheckConstraint, UniqueConstraint, Index, Numeric, Text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


class BehaviorSession(Base):
    """
    Represents a student learning session.
    Groups student interactions into logical time windows for analysis.
    """
    __tablename__ = 'behavior_sessions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    moodle_user_id = Column(Integer, nullable=False, index=True)
    moodle_course_id = Column(Integer, nullable=False, index=True)
    session_start = Column(TIMESTAMP, nullable=False, index=True)
    session_end = Column(TIMESTAMP, nullable=True)
    total_interactions = Column(Integer, default=0)
    quiz_attempts = Column(Integer, default=0)
    avg_response_time_ms = Column(Integer, nullable=True)
    accuracy_rate = Column(Numeric(5, 4), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    interactions = relationship("StudentInteraction", back_populates="session", cascade="all, delete-orphan")
    assessments = relationship("ImpairmentAssessment", back_populates="session", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint('session_end IS NULL OR session_end >= session_start', name='check_session_times'),
        Index('idx_behavior_sessions_user_active', 'moodle_user_id', 'is_active'),
    )

    def __repr__(self):
        return f"<BehaviorSession(id={self.id}, user={self.moodle_user_id}, course={self.moodle_course_id}, start={self.session_start})>"

    @property
    def duration_seconds(self) -> Optional[int]:
        """Calculate session duration in seconds."""
        if self.session_end:
            return int((self.session_end - self.session_start).total_seconds())
        elif self.is_active:
            return int((datetime.utcnow() - self.session_start).total_seconds())
        return None


class StudentInteraction(Base):
    """
    Represents a single student interaction (quiz answer, click, page view, etc.).
    Granular data for behavioral analysis.
    """
    __tablename__ = 'student_interactions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey('behavior_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    moodle_user_id = Column(Integer, nullable=False, index=True)
    interaction_type = Column(String(50), nullable=False, index=True)  # quiz_answer, page_view, click, navigation
    moodle_context_id = Column(Integer, nullable=True)  # quiz_id, question_id, etc.
    moodle_context_type = Column(String(50), nullable=True)  # quiz, question, course, module
    response_time_ms = Column(Integer, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    is_careless_error = Column(Boolean, default=False)
    metadata = Column(JSONB, nullable=True)  # Flexible additional data
    timestamp = Column(TIMESTAMP, nullable=False, index=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    # Relationships
    session = relationship("BehaviorSession", back_populates="interactions")

    __table_args__ = (
        CheckConstraint('response_time_ms IS NULL OR response_time_ms >= 0', name='check_response_time'),
        Index('idx_interactions_user_time', 'moodle_user_id', 'timestamp'),
        Index('idx_interactions_session_time', 'session_id', 'timestamp'),
    )

    def __repr__(self):
        return f"<StudentInteraction(id={self.id}, type={self.interaction_type}, user={self.moodle_user_id}, time={self.timestamp})>"


class ImpairmentAssessment(Base):
    """
    Represents a calculated impairment assessment for a session.
    Contains the impairment score, status, triggers, and recommendations.
    """
    __tablename__ = 'impairment_assessments'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey('behavior_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    moodle_user_id = Column(Integer, nullable=False, index=True)
    impairment_score = Column(Numeric(5, 2), nullable=False)  # 0-100
    confidence = Column(Numeric(3, 2), nullable=False)  # 0-1
    status = Column(String(20), nullable=False, index=True)  # optimal, early_warning, moderate, severe
    triggers = Column(JSONB, nullable=True)  # Array of trigger descriptions
    recommendation = Column(Text, nullable=True)
    assessment_window_start = Column(TIMESTAMP, nullable=False)
    assessment_window_end = Column(TIMESTAMP, nullable=False)
    assessed_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)

    # Relationships
    session = relationship("BehaviorSession", back_populates="assessments")
    alerts = relationship("ImpairmentAlert", back_populates="assessment", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint('impairment_score >= 0 AND impairment_score <= 100', name='check_impairment_score'),
        CheckConstraint('confidence >= 0 AND confidence <= 1', name='check_confidence'),
        CheckConstraint("status IN ('optimal', 'early_warning', 'moderate', 'severe')", name='check_status'),
        CheckConstraint('assessment_window_end >= assessment_window_start', name='check_assessment_window'),
        Index('idx_assessments_user_recent', 'moodle_user_id', 'assessed_at'),
    )

    def __repr__(self):
        return f"<ImpairmentAssessment(id={self.id}, user={self.moodle_user_id}, score={self.impairment_score}, status={self.status})>"


class ImpairmentAlert(Base):
    """
    Represents an alert sent to a teacher when impairment is detected.
    Tracks acknowledgment status and teacher notes.
    """
    __tablename__ = 'impairment_alerts'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey('impairment_assessments.id', ondelete='CASCADE'), nullable=False, index=True)
    moodle_user_id = Column(Integer, nullable=False, index=True)
    moodle_teacher_id = Column(Integer, nullable=False, index=True)
    moodle_course_id = Column(Integer, nullable=False, index=True)
    alert_level = Column(String(20), nullable=False)  # info, warning, critical
    message = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False, index=True)
    acknowledged_at = Column(TIMESTAMP, nullable=True)
    acknowledged_by = Column(Integer, nullable=True)
    teacher_notes = Column(Text, nullable=True)
    sent_at = Column(TIMESTAMP, default=datetime.utcnow, index=True)

    # Relationships
    assessment = relationship("ImpairmentAssessment", back_populates="alerts")

    __table_args__ = (
        CheckConstraint("alert_level IN ('info', 'warning', 'critical')", name='check_alert_level'),
        Index('idx_alerts_teacher_unack', 'moodle_teacher_id', 'is_acknowledged'),
    )

    def __repr__(self):
        return f"<ImpairmentAlert(id={self.id}, student={self.moodle_user_id}, teacher={self.moodle_teacher_id}, level={self.alert_level})>"


class StudentBaseline(Base):
    """
    Stores baseline performance metrics for each student and activity type.
    Used to detect deviations from normal performance.
    """
    __tablename__ = 'student_baselines'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    moodle_user_id = Column(Integer, nullable=False, index=True)
    moodle_course_id = Column(Integer, nullable=True, index=True)
    activity_type = Column(String(50), nullable=False)  # quiz, forum, assignment
    question_type = Column(String(50), nullable=True)  # multiple_choice, short_answer, etc.
    avg_accuracy = Column(Numeric(5, 4), nullable=True)
    std_accuracy = Column(Numeric(5, 4), nullable=True)
    avg_response_time_ms = Column(Integer, nullable=True)
    std_response_time_ms = Column(Integer, nullable=True)
    avg_hesitation_time_ms = Column(Integer, nullable=True)
    careless_error_rate = Column(Numeric(5, 4), nullable=True)
    sample_size = Column(Integer, nullable=False)
    first_recorded = Column(TIMESTAMP, nullable=True)
    last_updated = Column(TIMESTAMP, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('moodle_user_id', 'moodle_course_id', 'activity_type', 'question_type', name='uq_student_baseline'),
        CheckConstraint('sample_size > 0', name='check_sample_size'),
        Index('idx_baselines_user_course', 'moodle_user_id', 'moodle_course_id'),
    )

    def __repr__(self):
        return f"<StudentBaseline(user={self.moodle_user_id}, course={self.moodle_course_id}, type={self.activity_type}, n={self.sample_size})>"
