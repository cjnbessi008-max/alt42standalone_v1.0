"""
Student attempt schemas.
"""
from pydantic import BaseModel, UUID4
from datetime import datetime


class AttemptCreate(BaseModel):
    """Schema for creating a new attempt."""
    student_id: UUID4
    module_id: UUID4
    problem_id: UUID4
    student_answer: str
    time_spent_seconds: int
    hints_used: int = 0


class AttemptResponse(BaseModel):
    """Schema for attempt response."""
    id: UUID4
    student_id: UUID4
    module_id: UUID4
    problem_id: UUID4
    student_answer: str
    is_correct: bool
    time_spent_seconds: int
    attempt_number: int
    hints_used: int
    problem_type: str
    attempted_at: datetime

    class Config:
        from_attributes = True
