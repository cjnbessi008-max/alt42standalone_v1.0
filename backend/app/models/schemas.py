"""Pydantic schemas for API request/response validation."""
from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime


class StudentAttemptContext(BaseModel):
    """Context about student's previous attempts."""
    problem_id: UUID4
    recent_attempts: int
    is_correct: bool
    time_spent_seconds: Optional[int] = None
    struggling_concepts: List[str] = []


class ProblemContext(BaseModel):
    """Information about the current problem."""
    problem_id: UUID4
    title: str
    description: str
    problem_type: str
    difficulty_level: int
    content: Dict[str, Any]


class QuestionSuggestionRequest(BaseModel):
    """Request for generating question suggestions."""
    student_id: UUID4
    problem_id: UUID4
    current_attempt_data: Optional[Dict[str, Any]] = None
    include_context: bool = True


class SuggestedQuestion(BaseModel):
    """A single suggested question."""
    question: str = Field(..., description="The suggested question text")
    rationale: str = Field(..., description="Why this question is helpful")
    category: str = Field(..., description="Category: clarification, strategy, reflection")


class QuestionSuggestionResponse(BaseModel):
    """Response containing suggested questions."""
    suggestion_id: UUID4
    student_id: UUID4
    problem_id: UUID4
    suggestions: List[SuggestedQuestion] = Field(..., min_items=3, max_items=3)
    context_used: Optional[Dict[str, Any]] = None
    created_at: datetime


class QuestionFeedbackRequest(BaseModel):
    """Feedback on suggested questions."""
    suggestion_id: UUID4
    student_id: UUID4
    accepted_suggestion: Optional[int] = Field(None, ge=1, le=3, description="Which suggestion was selected (1-3)")
    helpfulness_rating: int = Field(..., ge=1, le=5, description="How helpful were the suggestions")
    comment: Optional[str] = None


class StudentProgress(BaseModel):
    """Student progress information."""
    student_id: UUID4
    module_id: UUID4
    concept_name: str
    mastery_level: float
    attempts_count: int
    last_attempted: Optional[datetime] = None


class ConceptMastery(BaseModel):
    """Concept mastery tracking."""
    concept_name: str
    mastery_level: float
    attempts_count: int


class AnalyticsData(BaseModel):
    """Analytics data for suggestion generation."""
    total_attempts: int
    correct_attempts: int
    average_time_seconds: float
    struggling_concepts: List[ConceptMastery]
    recent_errors: List[str]
