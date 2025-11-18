from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AchievementInfo(BaseModel):
    achievement_type: str
    title: str
    description: str
    value: Optional[int]

    class Config:
        from_attributes = True


class StudentInfo(BaseModel):
    id: str
    name: str
    grade_level: int
    profile_image: Optional[str]

    class Config:
        from_attributes = True


class PraiseCardResponse(BaseModel):
    id: str
    student_id: str
    title: str
    ai_message: str
    card_design: str
    likes_count: int
    comments_count: int
    views_count: int
    created_at: datetime

    # Nested objects
    student: Optional[StudentInfo] = None
    achievement: Optional[AchievementInfo] = None

    class Config:
        from_attributes = True


class PraiseCardFeed(BaseModel):
    cards: list[PraiseCardResponse]
    total: int
    page: int
    page_size: int
    has_more: bool
