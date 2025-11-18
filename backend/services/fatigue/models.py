"""
Database models for the Fatigue Monitoring System

SQLAlchemy ORM models matching the PostgreSQL schema.
"""

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey, Integer,
    String, Text, CheckConstraint, Index, ARRAY, Numeric
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class FatigueSession(Base):
    """Tracks individual learning sessions with fatigue metrics"""

    __tablename__ = 'fatigue_sessions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey('modules.id', ondelete='CASCADE'), nullable=False)
    session_start = Column(DateTime(timezone=True), nullable=False, default=func.now())
    session_end = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, default=0)
    active_learning_minutes = Column(Integer, default=0)
    idle_minutes = Column(Integer, default=0)
    fatigue_score = Column(Numeric(5, 2), default=0)
    peak_fatigue_score = Column(Numeric(5, 2), default=0)
    fatigue_level = Column(Integer, default=1)
    break_count = Column(Integer, default=0)
    total_break_minutes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # Relationships
    metrics = relationship('FatigueMetric', back_populates='session', cascade='all, delete-orphan')
    break_recommendations = relationship('BreakRecommendation', back_populates='session', cascade='all, delete-orphan')

    # Constraints
    __table_args__ = (
        CheckConstraint('fatigue_score >= 0 AND fatigue_score <= 100', name='check_fatigue_score_range'),
        CheckConstraint('peak_fatigue_score >= 0 AND peak_fatigue_score <= 100', name='check_peak_fatigue_range'),
        CheckConstraint('fatigue_level >= 1 AND fatigue_level <= 5', name='check_fatigue_level_range'),
        Index('idx_fatigue_sessions_student', 'student_id'),
        Index('idx_fatigue_sessions_module', 'module_id'),
        Index('idx_fatigue_sessions_start', 'session_start'),
    )

    def __repr__(self):
        return f"<FatigueSession(id={self.id}, student={self.student_id}, score={self.fatigue_score})>"

    @property
    def is_active(self) -> bool:
        """Check if session is currently active"""
        return self.session_end is None

    @property
    def current_duration_minutes(self) -> int:
        """Get current session duration"""
        if self.session_end:
            return self.duration_minutes
        return int((datetime.now() - self.session_start).total_seconds() / 60)


class FatigueMetric(Base):
    """Detailed fatigue measurements at regular intervals"""

    __tablename__ = 'fatigue_metrics'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey('fatigue_sessions.id', ondelete='CASCADE'), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=func.now())
    fatigue_score = Column(Numeric(5, 2), nullable=False)
    session_duration_minutes = Column(Integer, nullable=False)
    complexity_level = Column(Integer, nullable=True)
    error_rate = Column(Numeric(4, 3), nullable=True)
    problems_completed = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    response_time_avg_seconds = Column(Numeric(8, 2), nullable=True)
    interaction_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=func.now())

    # Relationships
    session = relationship('FatigueSession', back_populates='metrics')

    # Constraints
    __table_args__ = (
        CheckConstraint('fatigue_score >= 0 AND fatigue_score <= 100', name='check_metric_fatigue_range'),
        CheckConstraint('complexity_level >= 1 AND complexity_level <= 5', name='check_complexity_range'),
        CheckConstraint('error_rate >= 0 AND error_rate <= 1', name='check_error_rate_range'),
        Index('idx_fatigue_metrics_session', 'session_id', 'timestamp'),
        Index('idx_fatigue_metrics_student_time', 'student_id', 'timestamp'),
        Index('idx_fatigue_metrics_timestamp', 'timestamp'),
    )

    def __repr__(self):
        return f"<FatigueMetric(id={self.id}, score={self.fatigue_score}, timestamp={self.timestamp})>"


class BreakRecommendation(Base):
    """Break suggestions and tracking"""

    __tablename__ = 'break_recommendations'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey('fatigue_sessions.id', ondelete='CASCADE'), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    recommended_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    fatigue_score_at_recommendation = Column(Numeric(5, 2), nullable=False)
    break_type = Column(String(20), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default='pending')
    actual_break_start = Column(DateTime(timezone=True), nullable=True)
    actual_break_end = Column(DateTime(timezone=True), nullable=True)
    actual_duration_minutes = Column(Integer, nullable=True)
    activities_during_break = Column(JSONB, default=[])
    fatigue_score_after_break = Column(Numeric(5, 2), nullable=True)
    dismissal_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # Relationships
    session = relationship('FatigueSession', back_populates='break_recommendations')

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "break_type IN ('micro', 'short', 'medium', 'long')",
            name='check_break_type'
        ),
        CheckConstraint(
            "status IN ('pending', 'accepted', 'dismissed', 'deferred', 'expired')",
            name='check_break_status'
        ),
        CheckConstraint(
            'actual_break_end IS NULL OR actual_break_end > actual_break_start',
            name='check_break_duration'
        ),
        Index('idx_break_recommendations_session', 'session_id'),
        Index('idx_break_recommendations_student', 'student_id'),
        Index('idx_break_recommendations_status', 'status', 'recommended_at'),
    )

    def __repr__(self):
        return f"<BreakRecommendation(id={self.id}, type={self.break_type}, status={self.status})>"

    @property
    def is_pending(self) -> bool:
        """Check if recommendation is still pending"""
        return self.status == 'pending'

    @property
    def is_completed(self) -> bool:
        """Check if break was completed"""
        return self.status == 'accepted' and self.actual_break_end is not None


class StudentFatigueProfile(Base):
    """Personalized fatigue patterns for each student"""

    __tablename__ = 'student_fatigue_profiles'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.id', ondelete='CASCADE'), unique=True, nullable=False)
    optimal_session_duration = Column(Integer, default=45)
    average_fatigue_rate = Column(Numeric(6, 3), default=1.0)
    recovery_rate = Column(Numeric(6, 3), default=1.5)
    preferred_break_duration = Column(Integer, default=10)
    peak_performance_hours = Column(ARRAY(Integer), default=[9, 10, 11, 14, 15, 16])
    fatigue_threshold_level = Column(Numeric(5, 2), default=70.0)
    total_sessions = Column(Integer, default=0)
    total_learning_minutes = Column(Integer, default=0)
    total_break_minutes = Column(Integer, default=0)
    compliance_rate = Column(Numeric(5, 2), default=0)
    last_calibration_date = Column(DateTime(timezone=True), nullable=True)
    preferences = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint('compliance_rate >= 0 AND compliance_rate <= 100', name='check_compliance_rate'),
        Index('idx_student_fatigue_profile', 'student_id', unique=True),
    )

    def __repr__(self):
        return f"<StudentFatigueProfile(student={self.student_id}, compliance={self.compliance_rate}%)>"

    def update_compliance_rate(self, breaks_recommended: int, breaks_taken: int):
        """Update break compliance rate"""
        if breaks_recommended > 0:
            self.compliance_rate = round((breaks_taken / breaks_recommended) * 100, 2)
        else:
            self.compliance_rate = 0.0

    def is_peak_performance_time(self, hour: int) -> bool:
        """Check if given hour is in peak performance window"""
        return hour in (self.peak_performance_hours or [])


class FatigueAnalyticsSnapshot(Base):
    """Daily/weekly aggregated analytics for performance"""

    __tablename__ = 'fatigue_analytics_snapshots'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey('students.id', ondelete='CASCADE'), nullable=False)
    snapshot_date = Column(Date, nullable=False)
    period_type = Column(String(10), nullable=True)
    sessions_count = Column(Integer, default=0)
    total_learning_minutes = Column(Integer, default=0)
    total_break_minutes = Column(Integer, default=0)
    average_fatigue_score = Column(Numeric(5, 2), nullable=True)
    peak_fatigue_score = Column(Numeric(5, 2), nullable=True)
    breaks_recommended = Column(Integer, default=0)
    breaks_taken = Column(Integer, default=0)
    compliance_rate = Column(Numeric(5, 2), nullable=True)
    fatigue_by_hour = Column(JSONB, default={})
    most_fatiguing_module_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "period_type IN ('daily', 'weekly', 'monthly')",
            name='check_period_type'
        ),
        Index('idx_analytics_student_date', 'student_id', 'snapshot_date'),
        Index('idx_analytics_date', 'snapshot_date'),
    )

    def __repr__(self):
        return f"<FatigueAnalyticsSnapshot(student={self.student_id}, date={self.snapshot_date})>"

    @property
    def effective_compliance_rate(self) -> float:
        """Calculate compliance rate if not set"""
        if self.compliance_rate is not None:
            return float(self.compliance_rate)
        if self.breaks_recommended > 0:
            return round((self.breaks_taken / self.breaks_recommended) * 100, 2)
        return 0.0


# Pydantic schemas for API validation and serialization
from pydantic import BaseModel, Field, validator
from typing import Dict


class FatigueSessionCreate(BaseModel):
    """Schema for creating new fatigue session"""
    student_id: str
    module_id: str


class FatigueSessionResponse(BaseModel):
    """Schema for fatigue session response"""
    id: str
    student_id: str
    module_id: str
    session_start: datetime
    session_end: Optional[datetime]
    duration_minutes: int
    fatigue_score: float
    fatigue_level: int
    break_count: int
    is_active: bool

    class Config:
        from_attributes = True


class FatigueMetricCreate(BaseModel):
    """Schema for creating fatigue metric"""
    session_id: str
    complexity_level: int = Field(ge=1, le=5)
    problems_completed: int = Field(ge=0)
    correct_answers: int = Field(ge=0)
    response_times: List[float] = Field(default_factory=list)
    interaction_count: int = Field(ge=0, default=0)

    @validator('correct_answers')
    def validate_correct_answers(cls, v, values):
        if 'problems_completed' in values and v > values['problems_completed']:
            raise ValueError('correct_answers cannot exceed problems_completed')
        return v


class FatigueMetricResponse(BaseModel):
    """Schema for fatigue metric response"""
    id: str
    session_id: str
    timestamp: datetime
    fatigue_score: float
    fatigue_level: int
    recommendation: Optional[str]
    trend: str

    class Config:
        from_attributes = True


class BreakRecommendationResponse(BaseModel):
    """Schema for break recommendation response"""
    id: str
    session_id: str
    break_type: str
    duration_minutes: int
    reason: str
    status: str
    fatigue_score: float
    urgency: str

    class Config:
        from_attributes = True


class BreakCompleteRequest(BaseModel):
    """Schema for completing a break"""
    actual_duration_minutes: int = Field(gt=0)
    activities: List[str] = Field(default_factory=list)


class StudentFatigueProfileResponse(BaseModel):
    """Schema for student fatigue profile"""
    id: str
    student_id: str
    optimal_session_duration: int
    fatigue_threshold_level: float
    compliance_rate: float
    total_sessions: int
    peak_performance_hours: List[int]

    class Config:
        from_attributes = True


class FatigueAnalyticsResponse(BaseModel):
    """Schema for fatigue analytics"""
    student_id: str
    date_range: Dict[str, str]
    average_fatigue_score: float
    sessions_count: int
    break_compliance_rate: float
    optimal_learning_hours: List[int]
    fatigue_patterns_by_hour: Dict[str, float]
    recommendations: List[str]
