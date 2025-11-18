"""
Submission schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SubmissionCreate(BaseModel):
    """Schema for creating a submission"""
    code: str = Field(..., min_length=1, max_length=50000)
    student_id: str
    filename: Optional[str] = None
    moodle_assignment_id: Optional[int] = None
    moodle_submission_id: Optional[int] = None


class SubmissionResponse(BaseModel):
    """Schema for submission response"""
    id: str
    student_id: str
    code: str
    language: str
    filename: Optional[str]
    submitted_at: datetime
    analyzed_at: Optional[datetime]

    class Config:
        from_attributes = True
