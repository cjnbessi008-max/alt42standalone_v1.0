"""
Analysis result model
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class AnalysisResult(Base):
    """Results of code analysis"""

    __tablename__ = "analysis_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String, ForeignKey("submissions.id"), nullable=False, unique=True, index=True)

    # Overall metrics
    total_loops = Column(Integer, default=0)
    inefficient_loops = Column(Integer, default=0)
    efficiency_score = Column(Float, default=100.0)  # 0-100

    # Analysis details
    total_issues = Column(Integer, default=0)
    critical_issues = Column(Integer, default=0)
    warning_issues = Column(Integer, default=0)
    info_issues = Column(Integer, default=0)

    # Processing time
    analysis_duration_ms = Column(Integer)

    # Summary
    summary = Column(JSON, nullable=True)  # Overall analysis summary
    recommendations = Column(JSON, nullable=True)  # List of recommendations

    analyzed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    submission = relationship("Submission", back_populates="analysis_result")
    inefficiencies = relationship("Inefficiency", back_populates="analysis_result", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<AnalysisResult {self.id} - Score: {self.efficiency_score}>"
