"""
User schemas for API validation.
"""
from pydantic import BaseModel, EmailStr, UUID4
from datetime import datetime
from typing import Optional


# Teacher schemas
class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = None


class TeacherResponse(BaseModel):
    id: UUID4
    name: str
    email: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2 (was orm_mode in v1)


# Student schemas
class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    password: Optional[str] = None
    cohort_id: Optional[str] = None


class StudentResponse(BaseModel):
    id: UUID4
    name: str
    email: str
    cohort_id: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
