"""Student schemas."""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class StudentBase(BaseModel):
    """Base student schema."""
    student_id: str = Field(..., description="Unique student identifier")
    name: Optional[str] = Field(None, description="Student name")
    grade_level: Optional[str] = Field(None, description="Grade level (e.g., '3', '4', '5')")
    performance_level: Optional[str] = Field(None, description="Performance level: low, medium, high")
    gender: Optional[str] = Field(None, description="Student gender")


class StudentCreate(StudentBase):
    """Schema for creating a student."""
    pass


class StudentResponse(StudentBase):
    """Schema for student response."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
