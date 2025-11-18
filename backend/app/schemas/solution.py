from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SolutionBase(BaseModel):
    content: str
    explanation: Optional[str] = None


class SolutionCreate(SolutionBase):
    problem_id: str


class SolutionResponse(SolutionBase):
    id: str
    problem_id: str
    student_id: Optional[str]
    is_model_solution: bool
    score: Optional[int]
    submitted_at: datetime

    class Config:
        from_attributes = True
