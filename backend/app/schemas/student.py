"""
Student schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    """Schema for creating a student"""
    moodle_id: int
    username: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    firstname: Optional[str] = None
    lastname: Optional[str] = None


class StudentResponse(BaseModel):
    """Schema for student response"""
    id: str
    moodle_id: int
    username: str
    email: str
    firstname: Optional[str]
    lastname: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
