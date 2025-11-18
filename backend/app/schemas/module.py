"""
Module and Problem schemas.
"""
from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional


class ModuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    teacher_id: UUID4


class ModuleResponse(BaseModel):
    id: UUID4
    name: str
    description: Optional[str]
    teacher_id: UUID4
    is_active: bool
    is_published: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProblemCreate(BaseModel):
    module_id: UUID4
    problem_type: str
    question_text: str
    correct_answer: str
    hints: Optional[str] = None
    difficulty: str = "medium"
    order_index: int = 0


class ProblemResponse(BaseModel):
    id: UUID4
    module_id: UUID4
    problem_type: str
    question_text: str
    difficulty: str
    order_index: int
    created_at: datetime

    class Config:
        from_attributes = True
