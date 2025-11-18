"""
Behavior event model for tracking student interactions
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()


class BehaviorEvent(Base):
    """
    Tracks individual behavior events from students during learning activities.

    These events are analyzed to detect emotional patterns such as frustration,
    concentration, and confusion.
    """
    __tablename__ = "behavior_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Student and session identification
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    # Event details
    event_type = Column(String(50), nullable=False)  # click, keypress, mouse_move, scroll, etc.
    event_data = Column(JSON)  # Additional event-specific data

    # Timing information
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    duration_ms = Column(Integer)  # Duration of the event (if applicable)

    # Interaction metrics
    mouse_speed = Column(Float)  # Pixels per second
    click_force = Column(Float)  # For devices that support pressure
    keypress_speed = Column(Float)  # Characters per minute

    # Context
    page_url = Column(Text)
    element_id = Column(String(255))
    element_type = Column(String(50))

    # Performance indicators
    is_correct_answer = Column(String(20))  # 'correct', 'incorrect', 'partial', 'na'
    attempt_number = Column(Integer)
    time_since_last_event_ms = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<BehaviorEvent(id={self.id}, type={self.event_type}, student={self.student_id})>"
