"""
Pydantic schemas for API request/response validation
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


# Student schemas
class StudentBase(BaseModel):
    name: str
    email: EmailStr
    grade_level: Optional[int] = None
    institution: Optional[str] = None
    external_lms_id: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    grade_level: Optional[int] = None
    institution: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class StudentResponse(StudentBase):
    id: UUID
    metadata: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Problem schemas
class ProblemBase(BaseModel):
    module_id: UUID
    problem_type: str
    content: Dict[str, Any]
    difficulty_level: int = Field(ge=1, le=5)
    correct_answer: Dict[str, Any]
    tags: List[str] = []

class ProblemCreate(ProblemBase):
    pass

class ProblemResponse(ProblemBase):
    id: UUID
    metadata: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Student attempt schemas
class StudentAttemptCreate(BaseModel):
    student_id: UUID
    problem_id: UUID
    module_id: UUID
    submitted_answer: Dict[str, Any]
    time_spent_seconds: Optional[int] = None

class StudentAttemptResponse(BaseModel):
    id: UUID
    student_id: UUID
    problem_id: UUID
    module_id: UUID
    submitted_answer: Dict[str, Any]
    is_correct: bool
    time_spent_seconds: Optional[int]
    attempt_number: int
    attempted_at: datetime
    metadata: Dict[str, Any] = {}

    class Config:
        from_attributes = True


# Mistake pattern schemas
class MistakePatternBase(BaseModel):
    student_id: UUID
    module_id: Optional[UUID] = None
    pattern_type: str
    pattern_category: Optional[str] = None
    description: Optional[str] = None
    severity: str = "medium"

class MistakePatternCreate(MistakePatternBase):
    problem_types: List[str] = []
    example_attempts: List[UUID] = []
    pattern_data: Dict[str, Any] = {}

class MistakePatternUpdate(BaseModel):
    frequency: Optional[int] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None
    last_occurrence: Optional[datetime] = None
    pattern_data: Optional[Dict[str, Any]] = None

class MistakePatternResponse(MistakePatternBase):
    id: UUID
    frequency: int
    problem_types: List[str]
    example_attempts: List[UUID]
    pattern_data: Dict[str, Any]
    first_occurrence: datetime
    last_occurrence: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Mistake warning schemas
class MistakeWarningCreate(BaseModel):
    student_id: UUID
    problem_id: UUID
    pattern_id: UUID
    warning_type: str
    message: str
    severity: str = "medium"

class MistakeWarningResponse(BaseModel):
    id: UUID
    student_id: UUID
    problem_id: UUID
    pattern_id: UUID
    warning_type: str
    message: str
    severity: str
    is_dismissed: bool
    shown_at: datetime
    dismissed_at: Optional[datetime]
    metadata: Dict[str, Any] = {}

    class Config:
        from_attributes = True


# Pattern analysis request/response
class PatternAnalysisRequest(BaseModel):
    student_id: UUID
    module_id: Optional[UUID] = None
    min_frequency: int = 2
    include_inactive: bool = False

class PatternAnalysisResponse(BaseModel):
    student_id: UUID
    patterns: List[MistakePatternResponse]
    total_patterns: int
    analysis_timestamp: datetime


# Warning check request/response
class WarningCheckRequest(BaseModel):
    student_id: UUID
    problem_id: UUID
    problem_content: Dict[str, Any]

class WarningCheckResponse(BaseModel):
    has_warnings: bool
    warnings: List[MistakeWarningResponse]
    recommended_focus_areas: List[str] = []


# LMS sync schemas
class LMSSyncRequest(BaseModel):
    sync_type: str  # 'students', 'attempts', 'full'
    lms_endpoint: str
    filters: Optional[Dict[str, Any]] = None

class LMSSyncResponse(BaseModel):
    sync_id: UUID
    status: str
    records_synced: int
    started_at: datetime
    completed_at: Optional[datetime]
    error_message: Optional[str] = None
