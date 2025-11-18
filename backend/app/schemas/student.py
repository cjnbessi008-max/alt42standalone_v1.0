"""
Student schemas
"""
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class StudentBase(BaseModel):
    """Base student schema"""
    moodle_user_id: int
    username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    grade_level: Optional[str] = None


class StudentCreate(StudentBase):
    """Student creation schema"""
    pass


class StudentUpdate(BaseModel):
    """Student update schema"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    grade_level: Optional[str] = None


class StudentResponse(StudentBase):
    """Student response schema"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionCreate(BaseModel):
    """Session creation schema"""
    student_id: int
    moodle_session_id: Optional[str] = None


class SessionResponse(BaseModel):
    """Session response schema"""
    id: int
    student_id: int
    session_token: str
    moodle_session_id: Optional[str]
    started_at: datetime
    last_active_at: datetime
    ended_at: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True
