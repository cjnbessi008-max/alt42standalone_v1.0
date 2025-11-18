"""Focus session schemas for API validation."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class FocusSessionCreate(BaseModel):
    """Schema for creating a focus session."""

    module_name: Optional[str] = None
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    hour_of_day: int = Field(..., ge=0, le=23, description="Hour of day (0-23)")


class FocusSessionUpdate(BaseModel):
    """Schema for updating a focus session."""

    session_end: Optional[datetime] = None
    active_time_seconds: Optional[int] = Field(None, ge=0)
    idle_time_seconds: Optional[int] = Field(None, ge=0)
    interaction_count: Optional[int] = Field(None, ge=0)
    context_switches: Optional[int] = Field(None, ge=0)
    average_focus_score: Optional[float] = Field(None, ge=0, le=100)
    engagement_score: Optional[float] = Field(None, ge=0, le=100)


class FocusSessionResponse(BaseModel):
    """Schema for focus session response."""

    id: int
    user_id: int
    module_name: Optional[str] = None
    session_start: datetime
    session_end: Optional[datetime] = None
    total_duration_seconds: Optional[int] = None
    active_time_seconds: int
    idle_time_seconds: int
    interaction_count: int
    context_switches: int
    average_focus_score: Optional[float] = None
    engagement_score: Optional[float] = None
    day_of_week: int
    hour_of_day: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
