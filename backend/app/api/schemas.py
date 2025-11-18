"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


# ============================================
# ENUMS
# ============================================

class ProblemDifficulty(str, Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"
    EXPERT = "EXPERT"


class ProblemSubject(str, Enum):
    MATHEMATICS = "MATHEMATICS"
    PHYSICS = "PHYSICS"
    CHEMISTRY = "CHEMISTRY"
    PROGRAMMING = "PROGRAMMING"
    LOGIC = "LOGIC"


class SolutionStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    ANALYZED = "ANALYZED"
    REVIEWED = "REVIEWED"


class StepType(str, Enum):
    GIVEN = "GIVEN"
    ASSUMPTION = "ASSUMPTION"
    CALCULATION = "CALCULATION"
    REASONING = "REASONING"
    CONCLUSION = "CONCLUSION"


class GapSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ============================================
# BASE SCHEMAS
# ============================================

class StepBase(BaseModel):
    """Base schema for a solution step"""
    step: int
    type: StepType
    content: str
    explanation: Optional[str] = None


# ============================================
# PROBLEM SCHEMAS
# ============================================

class ProblemCreate(BaseModel):
    """Schema for creating a problem"""
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1)
    subject: ProblemSubject
    difficulty: ProblemDifficulty
    expected_steps: List[Dict[str, Any]] = Field(default_factory=list)
    expected_reasoning: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_by: Optional[str] = None


class ProblemUpdate(BaseModel):
    """Schema for updating a problem"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, min_length=1)
    subject: Optional[ProblemSubject] = None
    difficulty: Optional[ProblemDifficulty] = None
    expected_steps: Optional[List[Dict[str, Any]]] = None
    expected_reasoning: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ProblemResponse(BaseModel):
    """Schema for problem response"""
    id: UUID
    title: str
    description: str
    subject: ProblemSubject
    difficulty: ProblemDifficulty
    expected_steps: List[Dict[str, Any]]
    expected_reasoning: Optional[str]
    metadata: Dict[str, Any]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# USER SCHEMAS
# ============================================

class UserCreate(BaseModel):
    """Schema for creating a user"""
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    full_name: Optional[str] = None
    role: str = "student"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UserResponse(BaseModel):
    """Schema for user response"""
    id: UUID
    username: str
    email: str
    full_name: Optional[str]
    role: str
    metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================
# SOLUTION SCHEMAS
# ============================================

class SolutionCreate(BaseModel):
    """Schema for creating a solution"""
    problem_id: UUID
    user_id: UUID
    submitted_steps: List[Dict[str, Any]] = Field(default_factory=list)
    raw_input: Optional[str] = None
    time_spent_seconds: int = 0


class SolutionUpdate(BaseModel):
    """Schema for updating a solution"""
    submitted_steps: Optional[List[Dict[str, Any]]] = None
    raw_input: Optional[str] = None
    time_spent_seconds: Optional[int] = None
    status: Optional[SolutionStatus] = None


class SolutionResponse(BaseModel):
    """Schema for solution response"""
    id: UUID
    problem_id: UUID
    user_id: UUID
    status: SolutionStatus
    submitted_steps: List[Dict[str, Any]]
    raw_input: Optional[str]
    time_spent_seconds: int
    submitted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# ANALYSIS SCHEMAS
# ============================================

class AnalyzeRequest(BaseModel):
    """Request schema for analyzing a solution"""
    solution_id: UUID


class DetectedGapResponse(BaseModel):
    """Response schema for a detected gap"""
    id: UUID
    gap_type: str
    severity: GapSeverity
    after_step_number: Optional[int]
    before_step_number: Optional[int]
    description: str
    expected_content: Optional[str]
    suggestion: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class StepComparisonResponse(BaseModel):
    """Response schema for step comparison"""
    id: UUID
    student_step_number: Optional[int]
    expected_step_number: Optional[int]
    similarity_score: Optional[float]
    match_type: Optional[str]
    student_content: Optional[str]
    expected_content: Optional[str]
    comparison_notes: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class FeedbackItemResponse(BaseModel):
    """Response schema for feedback item"""
    id: UUID
    feedback_type: str
    content: str
    priority: int
    related_step_number: Optional[int]
    metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class GapAnalysisResponse(BaseModel):
    """Response schema for gap analysis"""
    id: UUID
    solution_id: UUID
    completeness_score: float
    logic_continuity_score: float
    correctness_score: float
    overall_score: float
    total_gaps_detected: int
    critical_gaps_count: int
    missing_steps_count: int
    logical_errors_count: int
    ai_summary: Optional[str]
    ai_feedback: Optional[str]
    ai_model_used: Optional[str]
    detailed_analysis: Dict[str, Any]
    analyzed_at: datetime
    created_at: datetime

    # Related data (optional, loaded separately)
    detected_gaps: Optional[List[DetectedGapResponse]] = None
    step_comparisons: Optional[List[StepComparisonResponse]] = None
    feedback_items: Optional[List[FeedbackItemResponse]] = None

    class Config:
        from_attributes = True


# ============================================
# LEARNING PROGRESS SCHEMAS
# ============================================

class LearningProgressResponse(BaseModel):
    """Response schema for learning progress"""
    id: UUID
    user_id: UUID
    problem_id: UUID
    attempts_count: int
    best_score: float
    avg_score: float
    improvement_trend: List[Any]
    common_gaps: List[Any]
    last_attempted_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================
# GENERIC RESPONSES
# ============================================

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: Optional[str] = None
    status_code: int
