"""
Pydantic models for API request/response validation
"""
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


# ============= Student Models =============
class StudentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    grade_level: Optional[str] = None

class StudentCreate(StudentBase):
    external_id: Optional[str] = None  # For Moodle integration

class StudentResponse(StudentBase):
    id: UUID
    external_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Problem Models =============
class ProblemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1)
    problem_type: str = Field(..., max_length=100)
    difficulty_level: int = Field(..., ge=1, le=5)
    correct_answer: str
    answer_type: str = Field(default="text", max_length=50)
    metadata: Optional[Dict[str, Any]] = None

class ProblemCreate(ProblemBase):
    pass

class ProblemResponse(ProblemBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============= Attempt Models =============
class AttemptCreate(BaseModel):
    student_id: UUID
    problem_id: UUID
    submitted_answer: str = Field(..., min_length=1)
    time_spent_seconds: Optional[int] = Field(None, ge=0)

class AttemptResponse(BaseModel):
    id: UUID
    student_id: UUID
    problem_id: UUID
    submitted_answer: str
    is_correct: bool
    time_spent_seconds: Optional[int]
    attempted_at: datetime

    class Config:
        from_attributes = True


# ============= Reasoning Explanation Models =============
class ReasoningExplanationCreate(BaseModel):
    attempt_id: UUID
    explanation_text: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="Student's one-sentence explanation of their reasoning"
    )
    language: str = Field(default="ko", pattern="^(ko|en)$")

class ReasoningExplanationResponse(BaseModel):
    id: UUID
    attempt_id: UUID
    student_id: UUID
    problem_id: UUID
    explanation_text: str
    language: str
    submitted_at: datetime

    class Config:
        from_attributes = True


# ============= AI Feedback Models =============
class AIFeedbackResponse(BaseModel):
    id: UUID
    reasoning_explanation_id: UUID
    student_id: UUID
    identified_misconception: str
    reasoning_error_type: Optional[str]
    corrective_feedback: str
    encouragement: Optional[str]
    ai_model: str
    confidence_score: Optional[float]
    processing_time_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


# ============= Combined Response Models =============
class AttemptWithFeedbackResponse(BaseModel):
    """
    Complete response when a student submits an incorrect answer
    """
    attempt: AttemptResponse
    needs_explanation: bool = Field(
        description="True if answer is incorrect and student should explain reasoning"
    )
    problem_details: Optional[ProblemResponse] = None


class ReasoningAnalysisResponse(BaseModel):
    """
    Complete response after AI analyzes student's reasoning
    """
    reasoning_explanation: ReasoningExplanationResponse
    ai_feedback: AIFeedbackResponse
    next_steps: Optional[str] = Field(
        description="Suggested next action for the student"
    )


# ============= Learning Progress Models =============
class LearningProgressResponse(BaseModel):
    id: UUID
    student_id: UUID
    problem_type: str
    total_attempts: int
    correct_attempts: int
    common_errors: Optional[Dict[str, Any]]
    last_attempt_at: Optional[datetime]
    mastery_level: float
    accuracy_rate: float = Field(
        description="Calculated as correct_attempts / total_attempts"
    )

    class Config:
        from_attributes = True


# ============= Submission Flow Models =============
class ProblemSubmission(BaseModel):
    """
    Initial submission of answer to a problem
    """
    student_id: UUID
    problem_id: UUID
    submitted_answer: str = Field(..., min_length=1)
    time_spent_seconds: Optional[int] = Field(None, ge=0)


class ReasoningSubmission(BaseModel):
    """
    Student's explanation of their reasoning after incorrect answer
    """
    attempt_id: UUID
    student_id: UUID
    explanation_text: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="한 문장으로 설명 (Explain in one sentence)"
    )
    language: str = Field(default="ko", pattern="^(ko|en)$")


# ============= Error Response Models =============
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None


# ============= Dashboard/Analytics Models =============
class StudentDashboard(BaseModel):
    student: StudentResponse
    overall_progress: Dict[str, LearningProgressResponse]
    recent_attempts: list[AttemptResponse]
    total_problems_attempted: int
    total_problems_correct: int
    overall_accuracy: float
    strengths: list[str] = Field(
        description="Problem types where student excels"
    )
    areas_for_improvement: list[str] = Field(
        description="Problem types where student struggles"
    )
