"""Usage Session schemas."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class UsageSessionBase(BaseModel):
    """Base usage session schema."""
    student_id: UUID = Field(..., description="Student UUID")
    tool_id: UUID = Field(..., description="Tool UUID")
    teacher_id: Optional[UUID] = Field(None, description="Teacher UUID")
    session_start: datetime = Field(..., description="Session start timestamp")
    session_end: Optional[datetime] = Field(None, description="Session end timestamp")
    duration_seconds: Optional[int] = Field(None, description="Session duration in seconds")
    interactions_count: Optional[int] = Field(0, description="Number of interactions")
    completed: Optional[bool] = Field(False, description="Whether session was completed")
    success_rate: Optional[Decimal] = Field(None, description="Success rate (0-100)")
    context: Optional[str] = Field(None, description="Context: classroom, homework, self_study")
    device_type: Optional[str] = Field(None, description="Device type used")


class UsageSessionCreate(UsageSessionBase):
    """Schema for creating a usage session."""
    pass


class UsageSessionResponse(UsageSessionBase):
    """Schema for usage session response."""
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
