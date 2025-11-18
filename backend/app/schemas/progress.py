from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.progress import StageType


class StudentProgressBase(BaseModel):
    """Base student progress schema"""
    student_id: str
    problem_id: str
    current_stage: StageType = StageType.READING


class StudentProgressCreate(StudentProgressBase):
    """Schema for creating student progress"""
    pass


class StudentProgressUpdate(BaseModel):
    """Schema for updating student progress"""
    current_stage: Optional[StageType] = None
    reading_completed: Optional[bool] = None
    solving_completed: Optional[bool] = None
    reading_confirmed: Optional[bool] = None


class StudentProgressResponse(StudentProgressBase):
    """Schema for student progress response"""
    id: str
    reading_completed: bool
    solving_completed: bool
    reading_started_at: Optional[datetime]
    reading_completed_at: Optional[datetime]
    solving_started_at: Optional[datetime]
    solving_completed_at: Optional[datetime]
    reading_duration_seconds: int
    solving_duration_seconds: int
    reading_confirmed: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConfirmReadingRequest(BaseModel):
    """Schema for confirming reading stage completion"""
    reading_duration_seconds: int = Field(..., description="Time spent reading in seconds")


class StartSolvingRequest(BaseModel):
    """Schema for starting solving stage"""
    pass


class StudentAttemptBase(BaseModel):
    """Base student attempt schema"""
    student_id: str
    problem_id: str
    progress_id: str
    attempt_number: int
    submitted_answer: str


class StudentAttemptCreate(BaseModel):
    """Schema for creating a student attempt"""
    submitted_answer: str
    time_spent_seconds: Optional[int] = None


class StudentAttemptResponse(StudentAttemptBase):
    """Schema for student attempt response"""
    id: str
    is_correct: bool
    time_spent_seconds: Optional[int]
    attempted_at: datetime

    class Config:
        from_attributes = True


class SubmitAnswerResponse(BaseModel):
    """Schema for answer submission response"""
    attempt: StudentAttemptResponse
    is_correct: bool
    correct_answer: str
    explanation: Optional[str]
    attempt_number: int
    total_attempts: int
