"""Focus session model for tracking student learning sessions."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base, TimestampMixin


class FocusSession(Base, TimestampMixin):
    """Focus session representing a single learning session."""

    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Session metadata
    module_name = Column(String, nullable=True)  # Name of the learning module
    session_start = Column(DateTime, default=datetime.utcnow, nullable=False)
    session_end = Column(DateTime, nullable=True)
    total_duration_seconds = Column(Integer, nullable=True)  # Total session duration

    # Activity tracking
    active_time_seconds = Column(Integer, default=0)  # Time spent actively engaged
    idle_time_seconds = Column(Integer, default=0)  # Time spent idle
    interaction_count = Column(Integer, default=0)  # Number of interactions (clicks, inputs, etc.)
    context_switches = Column(Integer, default=0)  # Tab/window switches away from app

    # Focus metrics
    average_focus_score = Column(Float, nullable=True)  # 0-100 score
    engagement_score = Column(Float, nullable=True)  # 0-100 score

    # Time context
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    hour_of_day = Column(Integer, nullable=False)  # 0-23

    # Relationships
    user = relationship("User", back_populates="focus_sessions")
    metrics = relationship("FocusMetrics", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<FocusSession user_id={self.user_id} start={self.session_start}>"

    def calculate_duration(self):
        """Calculate total session duration if session has ended."""
        if self.session_end:
            delta = self.session_end - self.session_start
            self.total_duration_seconds = int(delta.total_seconds())
        return self.total_duration_seconds
