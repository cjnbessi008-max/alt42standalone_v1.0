"""Bias Analysis schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class BiasAnalysisRequest(BaseModel):
    """Request schema for bias analysis."""
    analysis_type: str = Field(..., description="Type: frequency, demographic, temporal, effectiveness")
    time_period_start: Optional[datetime] = Field(None, description="Analysis period start")
    time_period_end: Optional[datetime] = Field(None, description="Analysis period end")
    grade_levels: Optional[List[str]] = Field(None, description="Filter by grade levels")
    performance_levels: Optional[List[str]] = Field(None, description="Filter by performance levels")
    tool_categories: Optional[List[str]] = Field(None, description="Filter by tool categories")
    use_cache: Optional[bool] = Field(True, description="Use cached results if available")


class BiasMetrics(BaseModel):
    """Bias metrics."""
    chi_square_statistic: Optional[float] = None
    p_value: Optional[float] = None
    effect_size: Optional[float] = None
    gini_coefficient: Optional[float] = None
    shannon_entropy: Optional[float] = None
    bias_score: Optional[float] = Field(None, description="Overall bias score (0-100)")


class BiasAnalysisResponse(BaseModel):
    """Response schema for bias analysis."""
    id: UUID
    analysis_type: str
    analysis_date: datetime
    time_period_start: Optional[datetime]
    time_period_end: Optional[datetime]
    filters: Optional[Dict[str, Any]]
    results: Dict[str, Any] = Field(..., description="Analysis results")
    statistical_significance: Optional[BiasMetrics]
    recommendations: Optional[List[str]]
    summary: Optional[str] = Field(None, description="Human-readable summary")

    class Config:
        from_attributes = True
