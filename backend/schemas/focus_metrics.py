"""Focus metrics schemas for API validation."""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class FocusMetricsCreate(BaseModel):
    """Schema for creating focus metrics."""

    session_id: int
    event_type: str = Field(..., description="Event type: click, input, focus, blur, scroll, etc.")
    event_data: Optional[Dict[str, Any]] = None
    time_since_last_event_seconds: Optional[float] = Field(None, ge=0)
    focus_score: Optional[float] = Field(None, ge=0, le=100)
    page_url: Optional[str] = None
    component_name: Optional[str] = None


class FocusMetricsResponse(BaseModel):
    """Schema for focus metrics response."""

    id: int
    session_id: int
    recorded_at: datetime
    event_type: str
    event_data: Optional[Dict[str, Any]] = None
    time_since_last_event_seconds: Optional[float] = None
    focus_score: Optional[float] = None
    page_url: Optional[str] = None
    component_name: Optional[str] = None

    class Config:
        from_attributes = True
