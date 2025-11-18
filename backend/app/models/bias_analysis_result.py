"""Bias Analysis Result model."""
from sqlalchemy import Column, String, DateTime, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid

from ..database import Base


class BiasAnalysisResult(Base):
    """Cached bias analysis results."""

    __tablename__ = "bias_analysis_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_type = Column(String(100), nullable=False, index=True)
    analysis_date = Column(DateTime(timezone=True), server_default=func.now())
    time_period_start = Column(DateTime(timezone=True))
    time_period_end = Column(DateTime(timezone=True))
    filters = Column(JSONB)
    results = Column(JSONB, nullable=False)
    statistical_significance = Column(JSONB)
    recommendations = Column(ARRAY(Text))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<BiasAnalysisResult(type='{self.analysis_type}', date='{self.analysis_date}')>"
