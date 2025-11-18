"""Application database models for analytics and caching"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, BigInteger, Boolean
from sqlalchemy.sql import func
from database import AppBase


class AnalysisCache(AppBase):
    """Cache for analysis results"""
    __tablename__ = "analysis_cache"

    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(255), unique=True, index=True)
    cache_type = Column(String(50))  # student_activity, top_performers, recommendations
    user_id = Column(BigInteger, nullable=True)
    course_id = Column(BigInteger, nullable=True)
    data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))


class ThinkingRoutine(AppBase):
    """Generated thinking routines"""
    __tablename__ = "thinking_routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, index=True)
    course_id = Column(BigInteger, index=True)
    routine_type = Column(String(50))  # personalized, top_performer, hybrid
    morning_routine = Column(Text)
    study_approach = Column(Text)
    problem_solving_steps = Column(Text)
    review_schedule = Column(Text)
    metadata = Column(JSON)
    effectiveness_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PerformanceSnapshot(AppBase):
    """Periodic snapshots of student performance"""
    __tablename__ = "performance_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, index=True)
    course_id = Column(BigInteger, index=True)
    snapshot_date = Column(DateTime(timezone=True))
    overall_grade = Column(Float)
    percentile_rank = Column(Float)
    total_time_spent = Column(Float)
    sessions_count = Column(Integer)
    completion_rate = Column(Float)
    engagement_score = Column(Float)
    learning_velocity = Column(Float)
    metrics = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AIInteraction(AppBase):
    """Log of AI interactions for audit and improvement"""
    __tablename__ = "ai_interactions"

    id = Column(Integer, primary_key=True, index=True)
    interaction_type = Column(String(50))  # analysis, recommendation, routine_generation
    user_id = Column(BigInteger, nullable=True)
    course_id = Column(BigInteger, nullable=True)
    prompt = Column(Text)
    response = Column(Text)
    model = Column(String(100))
    tokens_used = Column(Integer)
    latency_ms = Column(Integer)
    success = Column(Boolean)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LearningPattern(AppBase):
    """Identified learning patterns from top performers"""
    __tablename__ = "learning_patterns"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(BigInteger, index=True)
    pattern_type = Column(String(100))
    pattern_name = Column(String(255))
    description = Column(Text)
    frequency_among_top_performers = Column(Float)
    impact_score = Column(Float)
    evidence = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
