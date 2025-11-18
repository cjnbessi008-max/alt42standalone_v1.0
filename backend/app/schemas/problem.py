from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.problem import ProblemType, ProblemDifficulty


class ProblemBase(BaseModel):
    title: str
    description: str
    problem_type: ProblemType = ProblemType.MATH
    difficulty: ProblemDifficulty = ProblemDifficulty.MEDIUM
    max_score: int = 100
    time_limit_minutes: Optional[int] = None


class ProblemCreate(ProblemBase):
    model_solution_content: Optional[str] = None
    model_solution_explanation: Optional[str] = None


class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[ProblemDifficulty] = None
    max_score: Optional[int] = None
    time_limit_minutes: Optional[int] = None


class ProblemResponse(ProblemBase):
    id: str
    author_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
