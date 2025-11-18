"""
Database models for behavior tracking and mind wandering detection
"""
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, JSON, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class BehaviorEvent(Base):
    """Individual behavior tracking events"""
    __tablename__ = "behavior_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Event details
    event_type = Column(String(50), nullable=False)  # mouse_move, click, scroll, focus, blur, etc.
    event_data = Column(JSON)  # Additional event-specific data

    # Mouse tracking
    mouse_x = Column(Integer)
    mouse_y = Column(Integer)

    # Scroll tracking
    scroll_x = Column(Integer)
    scroll_y = Column(Integer)

    # Timing
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    time_since_last_event = Column(Float)  # Seconds since last event

    # Page context
    page_url = Column(String(500))
    page_title = Column(String(200))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_behavior_student_session', 'student_id', 'session_id'),
        Index('idx_behavior_module_timestamp', 'module_id', 'timestamp'),
    )


class MindWanderingEvent(Base):
    """Detected mind wandering events"""
    __tablename__ = "mind_wandering_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Detection details
    detected_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    duration_seconds = Column(Float)  # Duration of mind wandering episode
    confidence_score = Column(Float, nullable=False)  # 0-1 confidence score

    # Behavior pattern analysis
    behavior_pattern = Column(JSON)  # Details about what triggered detection
    contributing_factors = Column(JSON)  # Array of factors (inactivity, focus_loss, etc.)

    # Intervention
    intervention_shown = Column(Boolean, default=False)
    intervention_type = Column(String(50))  # gentle_reminder, break_suggestion, etc.
    student_response = Column(String(50))  # resumed, took_break, ignored, etc.

    # Context
    problem_id = Column(UUID(as_uuid=True))  # Which problem they were working on
    problem_attempt_count = Column(Integer)  # How many attempts on current problem

    # LMS sync
    synced_to_lms = Column(Boolean, default=False)
    synced_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_mw_student_detected', 'student_id', 'detected_at'),
        Index('idx_mw_module_session', 'module_id', 'session_id'),
    )


class LearningSession(Base):
    """Learning session tracking"""
    __tablename__ = "learning_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Session timing
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Float)

    # Activity metrics
    total_events = Column(Integer, default=0)
    active_time_seconds = Column(Float, default=0.0)  # Time actively engaged
    inactive_time_seconds = Column(Float, default=0.0)  # Time inactive/mind wandering

    # Mind wandering summary
    mind_wandering_count = Column(Integer, default=0)
    total_mind_wandering_duration = Column(Float, default=0.0)
    average_focus_duration = Column(Float)  # Average time between mind wandering episodes

    # Engagement score (0-100)
    engagement_score = Column(Float)

    # Device & browser info
    user_agent = Column(Text)
    device_type = Column(String(50))  # mobile, tablet, desktop
    browser = Column(String(50))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_session_student_started', 'student_id', 'started_at'),
    )


class BehaviorAnalyticsSummary(Base):
    """Aggregated analytics for behavior patterns"""
    __tablename__ = "behavior_analytics_summary"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Time period
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)

    # Aggregated metrics
    total_sessions = Column(Integer, default=0)
    total_time_seconds = Column(Float, default=0.0)
    total_active_time = Column(Float, default=0.0)
    total_mind_wandering_events = Column(Integer, default=0)

    # Averages
    avg_session_duration = Column(Float)
    avg_engagement_score = Column(Float)
    avg_focus_duration = Column(Float)

    # Patterns
    common_distraction_times = Column(JSON)  # Times of day when mind wandering is most common
    problem_areas = Column(JSON)  # Problem types that cause most mind wandering

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_analytics_student_period', 'student_id', 'period_start', 'period_end'),
    )
