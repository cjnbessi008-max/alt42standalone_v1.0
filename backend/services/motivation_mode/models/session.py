"""
Motivation Mode Session Models

Data models for motivation mode sessions and related entities.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from uuid import UUID
from pydantic import BaseModel, Field, validator


class ModeTrigger(str, Enum):
    """How a motivation mode session was initiated"""
    STUDENT_INITIATED = "student_initiated"
    SYSTEM_SUGGESTED = "system_suggested"
    AUTO_DETECTED = "auto_detected"
    TEACHER_ASSIGNED = "teacher_assigned"


class ExitReason(str, Enum):
    """Why a motivation mode session ended"""
    STUDENT_CHOICE = "student_choice"
    COMPLETED_GOAL = "completed_goal"
    TIMEOUT = "timeout"
    SYSTEM_ERROR = "system_error"
    SESSION_LIMIT_REACHED = "session_limit_reached"


class MotivationSession(BaseModel):
    """Motivation mode learning session"""
    id: UUID
    student_id: UUID
    module_id: UUID

    # Session metadata
    session_start: datetime
    session_end: Optional[datetime] = None
    duration_seconds: Optional[int] = None

    # Performance metrics
    problems_completed: int = 0
    problems_correct: int = 0
    problems_incorrect: int = 0
    max_streak: int = 0
    current_streak: int = 0

    # Behavioral data
    mode_trigger: ModeTrigger
    exit_reason: Optional[ExitReason] = None

    # Timestamps
    created_at: datetime
    updated_at: datetime

    @property
    def is_active(self) -> bool:
        """Check if session is currently active"""
        return self.session_end is None

    @property
    def accuracy(self) -> float:
        """Calculate accuracy percentage"""
        if self.problems_completed == 0:
            return 0.0
        return (self.problems_correct / self.problems_completed) * 100

    class Config:
        orm_mode = True


class SessionCreateRequest(BaseModel):
    """Request to start a new motivation mode session"""
    module_id: UUID
    trigger: ModeTrigger = ModeTrigger.STUDENT_INITIATED


class SessionUpdateRequest(BaseModel):
    """Request to update session during active use"""
    problems_completed: Optional[int] = None
    problems_correct: Optional[int] = None
    problems_incorrect: Optional[int] = None
    current_streak: Optional[int] = None
    max_streak: Optional[int] = None


class SessionEndRequest(BaseModel):
    """Request to end a motivation mode session"""
    exit_reason: ExitReason = ExitReason.STUDENT_CHOICE


class ProblemAttempt(BaseModel):
    """A single problem attempt within a motivation mode session"""
    id: UUID
    session_id: UUID
    problem_id: UUID
    module_id: UUID

    # Attempt data
    answer_data: Dict[str, Any]
    is_correct: bool
    time_spent_seconds: Optional[int] = None

    # Context
    streak_at_attempt: int = 0
    problem_sequence_number: int

    # Feedback
    feedback_message: Optional[str] = None
    encouragement_message: Optional[str] = None

    # Timestamp
    attempted_at: datetime

    class Config:
        orm_mode = True


class ProblemSubmission(BaseModel):
    """Submit an answer to a problem in motivation mode"""
    problem_id: UUID
    answer: Dict[str, Any]
    time_spent_seconds: Optional[int] = None

    @validator('time_spent_seconds')
    def validate_time_spent(cls, v):
        if v is not None and v < 0:
            raise ValueError('time_spent_seconds must be non-negative')
        return v


class SessionSummary(BaseModel):
    """Summary of a completed motivation mode session"""
    session_id: UUID
    problems_completed: int
    problems_correct: int
    problems_incorrect: int
    max_streak: int
    duration_seconds: Optional[int]
    accuracy: float

    # Encouragement
    closing_message: str
    achievement_highlights: List[str] = Field(default_factory=list)


class ContinuationPrompt(BaseModel):
    """Prompt asking student if they want to continue"""
    message: str = "하나 더 풀어볼까요?"
    options: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"action": "continue", "label": "네, 하나 더!"},
        {"action": "exit", "label": "오늘은 여기까지"}
    ])


class FeedbackResponse(BaseModel):
    """Response after submitting an answer"""
    is_correct: bool
    feedback: str
    streak: int
    encouragement_message: Optional[str] = None
    next_action_prompt: ContinuationPrompt

    # Optional celebration data
    celebration: Optional[Dict[str, Any]] = None


class MotivationSuggestion(BaseModel):
    """System suggestion to enter motivation mode"""
    id: UUID
    student_id: UUID
    module_id: UUID

    suggestion_reason: str
    trigger_data: Dict[str, Any]

    # Student response
    was_accepted: Optional[bool] = None
    response_time_seconds: Optional[int] = None

    # Timestamps
    suggested_at: datetime
    responded_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class SuggestionResponse(BaseModel):
    """Student's response to a motivation mode suggestion"""
    accepted: bool
    response_time_seconds: Optional[int] = None
