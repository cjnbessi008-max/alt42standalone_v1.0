"""Pydantic schemas for vector transformation problems."""
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID
from decimal import Decimal


class VectorProblemBase(BaseModel):
    """Base schema for vector problems."""
    problem_type: Literal["rotation", "scaling", "combined"]
    initial_x: Decimal
    initial_y: Decimal
    rotation_angle: Optional[Decimal] = None
    scale_x: Optional[Decimal] = None
    scale_y: Optional[Decimal] = None
    expected_x: Decimal
    expected_y: Decimal
    difficulty_level: int = Field(ge=1, le=5)
    animation_duration: int = 2000


class VectorProblemCreate(VectorProblemBase):
    """Schema for creating vector problems."""
    module_id: UUID


class VectorProblemResponse(VectorProblemBase):
    """Schema for vector problem responses."""
    id: UUID
    module_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class StudentAttemptCreate(BaseModel):
    """Schema for creating student attempts."""
    student_id: UUID
    problem_id: UUID
    answer_x: Decimal
    answer_y: Decimal
    time_spent_seconds: int
    hint_used: bool = False


class StudentAttemptResponse(BaseModel):
    """Schema for student attempt responses."""
    id: UUID
    student_id: UUID
    problem_id: UUID
    answer_x: Optional[Decimal]
    answer_y: Optional[Decimal]
    is_correct: Optional[bool]
    time_spent_seconds: Optional[int]
    attempts_count: int
    hint_used: bool
    attempted_at: datetime

    class Config:
        from_attributes = True


class ModuleResponse(BaseModel):
    """Schema for module responses."""
    id: UUID
    name: str
    description: Optional[str]
    module_type: str
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        from_attributes = True
