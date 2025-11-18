"""
루틴 카드 스키마
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field


class RoutineCardBase(BaseModel):
    """루틴 카드 기본 스키마"""
    student_id: UUID
    card_date: date
    title: str = Field(..., max_length=200)
    learning_goals: List[str] = Field(default_factory=list)
    recommended_activities: Dict[str, Any] = Field(default_factory=dict)
    progress_summary: Dict[str, Any] = Field(default_factory=dict)
    motivation_message: Optional[str] = None
    next_steps: List[str] = Field(default_factory=list)
    ai_metadata: Dict[str, Any] = Field(default_factory=dict)


class RoutineCardCreate(RoutineCardBase):
    """루틴 카드 생성 스키마"""
    status: str = "active"


class RoutineCardResponse(RoutineCardBase):
    """루틴 카드 응답 스키마"""
    id: UUID
    status: str
    viewed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoutineCardDetail(RoutineCardResponse):
    """루틴 카드 상세 스키마"""
    student_name: Optional[str] = None
    student_grade: Optional[str] = None
    activity_count: int = 0


class CardGenerationRequest(BaseModel):
    """카드 생성 요청 스키마"""
    student_id: UUID
    card_date: Optional[date] = None
    force_regenerate: bool = False
