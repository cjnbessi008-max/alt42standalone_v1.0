"""Focus metrics model for detailed tracking of focus events."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base


class FocusMetrics(Base):
    """Detailed focus metrics captured during a session."""

    __tablename__ = "focus_metrics"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("focus_sessions.id"), nullable=False, index=True)

    # Timestamp
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Interaction metrics
    event_type = Column(String, nullable=False)  # 'click', 'input', 'focus', 'blur', 'scroll', etc.
    event_data = Column(JSON, nullable=True)  # Additional event-specific data

    # Focus indicators
    time_since_last_event_seconds = Column(Float, nullable=True)  # Idle time before this event
    focus_score = Column(Float, nullable=True)  # Instantaneous focus score (0-100)

    # Page/module context
    page_url = Column(String, nullable=True)
    component_name = Column(String, nullable=True)

    # Relationships
    session = relationship("FocusSession", back_populates="metrics")

    def __repr__(self):
        return f"<FocusMetrics session_id={self.session_id} type={self.event_type}>"
