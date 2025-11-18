"""
Student Pydantic schemas
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class StudentBase(BaseModel):
    """Base student schema"""
    name: str
    email: Optional[EmailStr] = None
    grade_level: Optional[str] = None


class StudentCreate(StudentBase):
    """Schema for creating a student"""
    is_teacher: bool = False


class StudentResponse(StudentBase):
    """Schema for student response"""
    id: str
    is_teacher: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
