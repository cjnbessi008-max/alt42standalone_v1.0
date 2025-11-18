"""
Learning activity Pydantic schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Any


class ProblemAttemptBase(BaseModel):
    """Base problem attempt schema"""
    problem_id: str
    problem_type: Optional[str] = None
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)
    time_spent_seconds: Optional[float] = None
    is_correct: bool
    hints_requested: int = 0
    gave_up: bool = False
    self_assessment_before: Optional[int] = Field(None, ge=1, le=5)
    self_assessment_after: Optional[int] = Field(None, ge=1, le=5)
    student_answer: Optional[Any] = None
    correct_answer: Optional[Any] = None


class ProblemAttemptCreate(ProblemAttemptBase):
    """Schema for creating a problem attempt"""
    attempt_number: int = 1


class ProblemAttemptResponse(ProblemAttemptBase):
    """Schema for problem attempt response"""
    id: str
    activity_id: str
    attempt_number: int
    attempted_at: datetime

    class Config:
        from_attributes = True


class LearningActivityBase(BaseModel):
    """Base learning activity schema"""
    subject: str = "mathematics"
    topic: Optional[str] = None
    self_confidence_before: Optional[int] = Field(None, ge=1, le=5)
    self_confidence_after: Optional[int] = Field(None, ge=1, le=5)


class LearningActivityCreate(LearningActivityBase):
    """Schema for creating a learning activity"""
    student_id: str
    session_start: Optional[datetime] = None


class LearningActivityUpdate(BaseModel):
    """Schema for updating a learning activity"""
    session_end: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    total_problems: Optional[int] = None
    correct_answers: Optional[int] = None
    incorrect_answers: Optional[int] = None
    hints_used: Optional[int] = None
    self_confidence_after: Optional[int] = Field(None, ge=1, le=5)


class LearningActivityResponse(LearningActivityBase):
    """Schema for learning activity response"""
    id: str
    student_id: str
    session_start: datetime
    session_end: Optional[datetime] = None
    duration_minutes: Optional[float] = None
    total_problems: int
    correct_answers: int
    incorrect_answers: int
    hints_used: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
