"""Time recommendation model for optimal learning time suggestions."""
from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base, TimestampMixin


class TimeRecommendation(Base, TimestampMixin):
    """Recommendations for optimal learning times based on focus analysis."""

    __tablename__ = "time_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Recommendation details
    recommended_day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    recommended_hour = Column(Integer, nullable=False)  # 0-23
    recommended_duration_minutes = Column(Integer, default=45)

    # Confidence and scoring
    confidence_score = Column(Float, nullable=False)  # 0-100
    average_focus_score = Column(Float, nullable=False)  # Historical average for this time
    sample_size = Column(Integer, nullable=False)  # Number of sessions analyzed

    # Supporting data
    analysis_data = Column(JSON, nullable=True)  # Detailed analysis results

    # Validity
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    valid_until = Column(DateTime, nullable=True)  # Recommendations expire
    is_active = Column(Integer, default=1)  # Boolean: is this recommendation current?

    # Relationships
    user = relationship("User", back_populates="time_recommendations")

    def __repr__(self):
        return f"<TimeRecommendation user_id={self.user_id} day={self.recommended_day_of_week} hour={self.recommended_hour}>"
