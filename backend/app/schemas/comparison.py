from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ComparisonRequest(BaseModel):
    student_solution_id: str
    model_solution_id: Optional[str] = None  # If None, use the default model solution


class ComparisonResponse(BaseModel):
    id: str
    student_solution_id: str
    model_solution_id: str
    similarity_score: Optional[int]
    feedback: Optional[str]
    strengths: Optional[List[str]]
    improvements: Optional[List[str]]
    differences: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True
