from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class LearningSessionCreate(BaseModel):
    student_id: str
    module_name: str
    duration_minutes: int
    questions_attempted: int
    questions_correct: int
    progress_percentage: float
    metadata: Optional[Dict[str, Any]] = None


class LearningSessionResponse(BaseModel):
    id: str
    student_id: str
    module_name: str
    started_at: datetime
    ended_at: Optional[datetime]
    duration_minutes: int
    questions_attempted: int
    questions_correct: int
    accuracy_percentage: float
    progress_percentage: float
    created_at: datetime

    class Config:
        from_attributes = True
