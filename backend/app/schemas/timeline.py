from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any, Dict


class StudentBase(BaseModel):
    """Base student schema."""
    name: str
    email: str
    grade_level: str


class StudentCreate(StudentBase):
    """Schema for creating a student."""
    pass


class Student(StudentBase):
    """Student response schema."""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProblemBase(BaseModel):
    """Base problem schema."""
    problem_type: str
    title: str
    description: Optional[str] = None
    difficulty_level: int = Field(ge=1, le=5)
    problem_data: Optional[Dict[str, Any]] = None
    answer_data: Optional[Dict[str, Any]] = None


class Problem(ProblemBase):
    """Problem response schema."""
    id: str
    module_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class AttemptBase(BaseModel):
    """Base attempt schema."""
    answer_data: Dict[str, Any]
    time_spent_seconds: Optional[int] = None
    interaction_data: Optional[Dict[str, Any]] = None
    hint_used: bool = False


class AttemptCreate(AttemptBase):
    """Schema for creating an attempt."""
    student_id: str
    problem_id: str


class Attempt(AttemptBase):
    """Attempt response schema."""
    id: str
    student_id: str
    problem_id: str
    is_correct: bool
    attempted_at: datetime
    feedback_given: Optional[str] = None

    class Config:
        from_attributes = True


class TimelineEvent(BaseModel):
    """Timeline event schema for visualization."""
    id: str
    event_type: str  # "attempt", "module_start", "module_complete"
    timestamp: datetime

    # For attempts
    problem_id: Optional[str] = None
    problem_title: Optional[str] = None
    problem_type: Optional[str] = None
    difficulty_level: Optional[int] = None
    is_correct: Optional[bool] = None
    time_spent_seconds: Optional[int] = None
    answer_data: Optional[Dict[str, Any]] = None

    # For module events
    module_id: Optional[str] = None
    module_name: Optional[str] = None
    progress_percentage: Optional[float] = None

    # Additional context
    hint_used: Optional[bool] = None
    feedback: Optional[str] = None


class StudentTimeline(BaseModel):
    """Complete student timeline."""
    student: Student
    events: List[TimelineEvent]
    statistics: Dict[str, Any]


class ModuleTimeline(BaseModel):
    """Student timeline for a specific module."""
    student: Student
    module_name: str
    module_id: str
    events: List[TimelineEvent]
    statistics: Dict[str, Any]
