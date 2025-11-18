from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    grade_level: int
    profile_image: Optional[str] = None


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    grade_level: Optional[int] = None
    profile_image: Optional[str] = None


class StudentResponse(BaseModel):
    id: str
    name: str
    email: str
    grade_level: int
    profile_image: Optional[str]
    total_learning_time: int
    consecutive_days: int
    total_modules_completed: int
    average_accuracy: int
    created_at: datetime
    last_activity_at: Optional[datetime]

    class Config:
        from_attributes = True
