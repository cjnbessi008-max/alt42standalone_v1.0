"""
학습 진행 스키마
"""
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field
from decimal import Decimal


class LearningProgressBase(BaseModel):
    """학습 진행 기본 스키마"""
    student_id: UUID
    subject: str = Field(..., max_length=100)
    topic: str = Field(..., max_length=200)
    completion_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    score: Optional[Decimal] = Field(None, ge=0, le=100)
    time_spent_minutes: int = Field(default=0, ge=0)
    last_activity_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class LearningProgressResponse(LearningProgressBase):
    """학습 진행 응답 스키마"""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
