"""
Focus Tracking Models
Database models for focus sessions, breaks, and mental alignment routines
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean,
    Numeric, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class FocusSession(Base):
    """학생의 학습 세션 집중도 추적"""
    __tablename__ = 'focus_sessions'

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(255), nullable=False, index=True)
    module_id = Column(String(255), nullable=False, index=True)
    session_start = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    session_end = Column(DateTime, nullable=True)
    total_duration_seconds = Column(Integer, nullable=True)
    active_duration_seconds = Column(Integer, default=0)
    idle_duration_seconds = Column(Integer, default=0)
    focus_score = Column(Numeric(5, 2), nullable=True)  # 0.00 to 100.00
    interaction_count = Column(Integer, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    breaks = relationship("FocusBreak", back_populates="session", cascade="all, delete-orphan")

    def calculate_focus_score(self) -> float:
        """Calculate focus score based on active time and interactions"""
        if not self.total_duration_seconds or self.total_duration_seconds == 0:
            return 0.0

        active_ratio = self.active_duration_seconds / self.total_duration_seconds
        idle_ratio = self.idle_duration_seconds / self.total_duration_seconds

        # Focus score formula: (active time * 0.6) + (low idle time * 0.3) + (interactions * 0.1)
        score = (active_ratio * 60) + ((1 - idle_ratio) * 30) + min(self.interaction_count / 10, 1) * 10
        return round(min(score, 100.0), 2)


class FocusBreak(Base):
    """집중력이 깨진 시점과 정신정렬 루틴 기록"""
    __tablename__ = 'focus_breaks'

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey('focus_sessions.id', ondelete='CASCADE'), nullable=False, index=True)
    student_id = Column(String(255), nullable=False, index=True)
    break_triggered_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    break_reason = Column(String(50), nullable=False)  # idle_timeout, wrong_answers, no_interaction, manual
    idle_duration_seconds = Column(Integer, nullable=True)
    routine_started_at = Column(DateTime, nullable=True)
    routine_completed_at = Column(DateTime, nullable=True)
    routine_skipped = Column(Boolean, default=False)
    routine_type = Column(String(50), default='breathing')  # breathing, stretching, eye_exercise
    effectiveness_rating = Column(Integer, nullable=True)  # 1-5 rating
    notes = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    session = relationship("FocusSession", back_populates="breaks")

    def is_completed(self) -> bool:
        """Check if the mental alignment routine was completed"""
        return self.routine_completed_at is not None and not self.routine_skipped

    def get_routine_duration(self) -> Optional[int]:
        """Get the actual duration of the routine in seconds"""
        if self.routine_started_at and self.routine_completed_at:
            delta = self.routine_completed_at - self.routine_started_at
            return int(delta.total_seconds())
        return None


class MentalAlignmentRoutine(Base):
    """10초 정신정렬 루틴 정의"""
    __tablename__ = 'mental_alignment_routines'

    id = Column(Integer, primary_key=True, index=True)
    routine_type = Column(String(50), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_seconds = Column(Integer, nullable=False, default=10)
    instructions = Column(JSON, nullable=False)  # Array of step-by-step instructions
    animation_config = Column(JSON, nullable=True)  # Configuration for visual animations
    audio_cues = Column(JSON, nullable=True)  # Audio guidance configuration
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    avg_effectiveness_rating = Column(Numeric(3, 2), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def increment_usage(self):
        """Increment usage count when routine is used"""
        self.usage_count += 1

    def update_effectiveness_rating(self, new_rating: int, total_ratings: int):
        """Update average effectiveness rating"""
        if self.avg_effectiveness_rating is None:
            self.avg_effectiveness_rating = new_rating
        else:
            current_avg = float(self.avg_effectiveness_rating)
            self.avg_effectiveness_rating = round(
                (current_avg * (total_ratings - 1) + new_rating) / total_ratings, 2
            )


class StudentFocusPreferences(Base):
    """학생별 집중도 추적 설정"""
    __tablename__ = 'student_focus_preferences'

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(255), unique=True, nullable=False, index=True)
    idle_timeout_seconds = Column(Integer, default=120)  # 2 minutes default
    enable_focus_tracking = Column(Boolean, default=True)
    enable_auto_breaks = Column(Boolean, default=True)
    preferred_routine_type = Column(String(50), default='breathing')
    break_frequency_minutes = Column(Integer, default=30)
    notifications_enabled = Column(Boolean, default=True)
    preferences = Column(JSON, nullable=True)  # Additional custom preferences
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class MoodleIntegrationLog(Base):
    """Moodle LMS 연동 로그"""
    __tablename__ = 'moodle_integration_log'

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String(255), nullable=False, index=True)
    moodle_user_id = Column(String(255), nullable=True)
    moodle_course_id = Column(String(255), nullable=True)
    event_type = Column(String(100), nullable=False)  # session_start, focus_break, routine_complete
    event_data = Column(JSON, nullable=True)
    sync_status = Column(String(50), default='pending', index=True)  # pending, synced, failed
    sync_attempted_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
