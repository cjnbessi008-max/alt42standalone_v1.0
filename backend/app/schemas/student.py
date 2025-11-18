"""
학생 스키마
"""
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class StudentBase(BaseModel):
    """학생 기본 스키마"""
    student_number: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    email: Optional[EmailStr] = None
    grade_level: Optional[str] = Field(None, max_length=20)
    lms_user_id: Optional[str] = Field(None, max_length=100)
    preferences: Dict[str, Any] = Field(default_factory=dict)


class StudentCreate(StudentBase):
    """학생 생성 스키마"""
    pass


class StudentResponse(StudentBase):
    """학생 응답 스키마"""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudentDetail(StudentResponse):
    """학생 상세 스키마"""
    total_cards: int = 0
    total_learning_time: int = 0
    average_score: Optional[float] = None
