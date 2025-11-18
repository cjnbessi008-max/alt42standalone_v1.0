"""
Growth insight model - AI-generated metacognitive growth points
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from ..database import Base


class GrowthInsight(Base):
    """
    AI-generated metacognitive growth insights for students
    """
    __tablename__ = "growth_insights"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String, ForeignKey("students.id"), nullable=False)

    # Insight period
    insight_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    period_type = Column(String(20), default="daily")  # daily, weekly, monthly

    # Growth dimensions
    dimension = Column(String(50), nullable=False)  # self_regulation, efficiency, learning_from_errors, etc.

    # Insight content
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)

    # Metrics
    improvement_percentage = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)  # AI confidence in this insight

    # Supporting data
    evidence_data = Column(JSON, nullable=True)  # Raw data supporting this insight

    # AI metadata
    ai_model = Column(String(50), nullable=True)
    ai_prompt_version = Column(String(20), nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="insights")

    def __repr__(self):
        return f"<GrowthInsight(id={self.id}, dimension={self.dimension}, date={self.insight_date})>"
