"""Time recommendation schemas for API validation."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class TimeRecommendationResponse(BaseModel):
    """Schema for time recommendation response."""

    id: int
    user_id: int
    recommended_day_of_week: int = Field(..., description="0=Monday, 6=Sunday")
    recommended_hour: int = Field(..., description="Hour of day (0-23)")
    recommended_duration_minutes: int
    confidence_score: float = Field(..., ge=0, le=100)
    average_focus_score: float = Field(..., ge=0, le=100)
    sample_size: int
    analysis_data: Optional[Dict[str, Any]] = None
    generated_at: datetime
    valid_until: Optional[datetime] = None
    is_active: int

    class Config:
        from_attributes = True


class TimeRecommendationSummary(BaseModel):
    """Summary of time recommendations for a user."""

    user_id: int
    total_recommendations: int
    top_recommendations: list[TimeRecommendationResponse]
    optimal_days: list[str]  # ["Monday", "Wednesday", "Friday"]
    optimal_hours: list[int]  # [9, 10, 14, 15]
    average_confidence: float
