"""
Growth insight Pydantic schemas
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List


class GrowthInsightResponse(BaseModel):
    """Schema for growth insight response"""
    id: str
    student_id: str
    insight_date: datetime
    period_type: str
    dimension: str
    title: str
    description: str
    recommendation: Optional[str] = None
    improvement_percentage: Optional[float] = None
    confidence_score: Optional[float] = None
    evidence_data: Optional[Dict[str, Any]] = None
    ai_model: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DailyGrowthReport(BaseModel):
    """Comprehensive daily growth report"""
    student_id: str
    report_date: datetime
    insights: List[GrowthInsightResponse]
    summary: str
    overall_improvement: float
    key_achievements: List[str]
    recommendations: List[str]
