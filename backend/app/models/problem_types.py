"""Problem type models for LMS integration"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class ProblemType(BaseModel):
    """문제 유형 모델"""
    id: UUID = Field(default_factory=uuid4)
    name: str
    name_ko: str
    category: str  # algebra, geometry, calculus, statistics
    description: Optional[str] = None
    description_ko: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True


class Problem(BaseModel):
    """문제 모델"""
    id: UUID = Field(default_factory=uuid4)
    problem_type_id: UUID
    lms_integration_id: Optional[UUID] = None
    external_problem_id: Optional[str] = None
    title: str
    content: Dict[str, Any]
    difficulty_level: int = Field(default=1, ge=1, le=5)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True


class StudentAttempt(BaseModel):
    """학생 문제 풀이 시도"""
    id: UUID = Field(default_factory=uuid4)
    student_id: UUID
    problem_id: UUID
    attempt_number: int
    answer_submitted: Dict[str, Any]
    is_correct: Optional[bool] = None
    time_spent_seconds: Optional[int] = None
    tips_viewed: list[UUID] = Field(default_factory=list)
    tip_helped: Optional[bool] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True


class StudentLearningProfile(BaseModel):
    """학생 학습 프로필 - 어떤 관점이 효과적인지 추적"""
    id: UUID = Field(default_factory=uuid4)
    student_id: UUID
    problem_type_id: UUID
    preferred_perspective_type: Optional[str] = None  # visual, algebraic, geometric, conceptual
    weak_areas: list[str] = Field(default_factory=list)
    strong_areas: list[str] = Field(default_factory=list)
    tip_effectiveness: Dict[str, float] = Field(default_factory=dict)  # tip_id -> score
    last_updated: datetime = Field(default_factory=datetime.now)

    class Config:
        from_attributes = True
