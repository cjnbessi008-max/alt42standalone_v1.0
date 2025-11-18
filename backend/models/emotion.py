"""
Emotion state and pattern models
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Float, DateTime, Integer, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()


class EmotionState(Base):
    """
    Represents the detected emotional state of a student at a specific moment.

    Emotions detected: frustration, concentration, confusion (답답함/좌절/집중)
    """
    __tablename__ = "emotion_states"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Student and session identification
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Emotion scores (0.0 - 1.0)
    frustration_score = Column(Float, default=0.0)  # 좌절
    concentration_score = Column(Float, default=0.0)  # 집중
    confusion_score = Column(Float, default=0.0)  # 답답함/혼란

    # Primary detected emotion
    primary_emotion = Column(String(50), nullable=False)  # frustration, concentration, confusion, neutral
    confidence = Column(Float)  # Confidence in detection (0.0 - 1.0)

    # Analysis metadata
    behavior_window_start = Column(DateTime)  # Start of behavior window analyzed
    behavior_window_end = Column(DateTime)  # End of behavior window analyzed
    events_analyzed = Column(Integer)  # Number of events in the analysis window

    # AI analysis details
    analysis_method = Column(String(50))  # 'rule_based', 'ml_model', 'claude_ai', etc.
    analysis_metadata = Column(JSON)  # Additional details from analysis

    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f"<EmotionState(id={self.id}, emotion={self.primary_emotion}, confidence={self.confidence})>"


class EmotionPattern(Base):
    """
    Aggregated emotion patterns over time for a student in a learning session.

    Used for longer-term analysis and intervention triggering.
    """
    __tablename__ = "emotion_patterns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Student and session identification
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Pattern analysis window
    window_start = Column(DateTime, nullable=False)
    window_end = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer)

    # Emotion frequency counts
    frustration_count = Column(Integer, default=0)
    concentration_count = Column(Integer, default=0)
    confusion_count = Column(Integer, default=0)
    neutral_count = Column(Integer, default=0)

    # Emotion duration (in seconds)
    frustration_duration_sec = Column(Integer, default=0)
    concentration_duration_sec = Column(Integer, default=0)
    confusion_duration_sec = Column(Integer, default=0)

    # Pattern insights
    dominant_emotion = Column(String(50))  # Most frequent emotion in the window
    emotion_transitions = Column(Integer)  # Number of emotion changes
    is_concerning = Column(String(20))  # 'yes', 'no', 'monitor' - requires intervention

    # Performance correlation
    avg_accuracy = Column(Float)  # Average answer accuracy in this window
    completion_rate = Column(Float)  # Tasks completed / tasks attempted

    # Recommendations
    intervention_suggested = Column(String(20))  # 'yes', 'no'
    intervention_type = Column(Text)  # Suggested intervention (break, hint, simplify, etc.)

    # Metadata
    pattern_metadata = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<EmotionPattern(id={self.id}, student={self.student_id}, dominant={self.dominant_emotion})>"
