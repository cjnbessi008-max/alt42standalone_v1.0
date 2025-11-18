"""Perspective shift tip models"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class PerspectiveTip(BaseModel):
    """관점 전환 팁 모델"""
    id: UUID = Field(default_factory=uuid4)
    problem_type_id: UUID
    tip_level: int = Field(ge=1, le=3)  # 1: basic, 2: intermediate, 3: advanced
    perspective_type: str  # visual, algebraic, geometric, conceptual
    title: str
    title_ko: str
    content: str
    content_ko: str
    example_problem: Optional[Dict[str, Any]] = None
    trigger_conditions: Dict[str, Any] = Field(default_factory=dict)
    effectiveness_score: float = Field(default=0.0, ge=0.0, le=1.0)
    usage_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True


class TipRecommendation(BaseModel):
    """팁 추천 기록"""
    id: UUID = Field(default_factory=uuid4)
    student_id: UUID
    problem_id: UUID
    tip_id: UUID
    reason: Optional[str] = None
    was_shown: bool = False
    was_helpful: Optional[bool] = None
    student_feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True


class TipRequest(BaseModel):
    """팁 요청 (API 입력)"""
    student_id: UUID
    problem_id: UUID
    current_attempt_number: int
    time_spent_seconds: Optional[int] = None
    previous_answers: list[Dict[str, Any]] = Field(default_factory=list)


class TipResponse(BaseModel):
    """팁 응답 (API 출력)"""
    tip: PerspectiveTip
    recommendation_id: UUID
    confidence_score: float  # 0.0-1.0
    personalized: bool  # 학생 프로필 기반 추천 여부
    alternative_tips: list[PerspectiveTip] = Field(default_factory=list)
