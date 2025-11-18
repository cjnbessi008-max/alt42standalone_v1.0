"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, UUID4
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


# Enums
class EventType(str, Enum):
    PROBLEM_START = "problem_start"
    INPUT_FOCUS = "input_focus"
    INPUT_BLUR = "input_blur"
    INPUT_CHANGE = "input_change"
    BUTTON_CLICK = "button_click"
    PAUSE_DETECTED = "pause_detected"
    RESUME_DETECTED = "resume_detected"
    HINT_REQUESTED = "hint_requested"
    ANSWER_SUBMITTED = "answer_submitted"
    PROBLEM_COMPLETED = "problem_completed"


class SessionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class SegmentType(str, Enum):
    PAUSE = "pause"
    STRUGGLE = "struggle"
    EXPLORATION = "exploration"
    VERIFICATION = "verification"


# Request schemas
class ActivityEventCreate(BaseModel):
    session_id: UUID4
    event_type: EventType
    event_data: Optional[Dict[str, Any]] = None
    time_since_start_ms: int = Field(..., ge=0)


class LearningSessionCreate(BaseModel):
    student_id: UUID4
    module_id: UUID4
    problem_id: UUID4


class LearningSessionUpdate(BaseModel):
    completed_at: Optional[datetime] = None
    total_time_seconds: Optional[int] = None
    is_correct: Optional[bool] = None
    submitted_answer: Optional[Dict[str, Any]] = None
    status: Optional[SessionStatus] = None


# Response schemas
class ActivityEventResponse(BaseModel):
    id: UUID4
    session_id: UUID4
    event_type: EventType
    event_data: Optional[Dict[str, Any]]
    timestamp: datetime
    time_since_start_ms: int

    class Config:
        from_attributes = True


class LearningSessionResponse(BaseModel):
    id: UUID4
    student_id: UUID4
    module_id: UUID4
    problem_id: UUID4
    started_at: datetime
    completed_at: Optional[datetime]
    total_time_seconds: Optional[int]
    is_correct: Optional[bool]
    submitted_answer: Optional[Dict[str, Any]]
    status: SessionStatus

    class Config:
        from_attributes = True


class DelaySegmentResponse(BaseModel):
    id: UUID4
    start_time_ms: int
    end_time_ms: int
    duration_ms: int
    segment_type: SegmentType
    context: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class ThinkingFlowAnalysisResponse(BaseModel):
    id: UUID4
    session_id: UUID4
    analysis_type: str
    delay_segments: List[Dict[str, Any]]
    thinking_pattern: Dict[str, Any]
    struggle_points: Optional[List[Dict[str, Any]]]
    cognitive_load_score: Optional[float]
    persistence_score: Optional[float]
    efficiency_score: Optional[float]
    analyzed_at: datetime

    class Config:
        from_attributes = True


# Analysis request/response
class AnalyzeSessionRequest(BaseModel):
    session_id: UUID4
    include_events: bool = True


class ThinkingFlowGraphData(BaseModel):
    """Data structure for thinking flow graph visualization"""
    session_id: UUID4
    timeline: List[Dict[str, Any]]  # Time-based event sequence
    delay_segments: List[DelaySegmentResponse]
    thinking_metrics: Dict[str, float]
    phase_breakdown: List[Dict[str, Any]]
    recommendations: List[str]


class StudentProgressSummary(BaseModel):
    """Summary of student's learning progress"""
    student_id: UUID4
    module_id: UUID4
    total_sessions: int
    completed_sessions: int
    average_completion_time: Optional[float]
    success_rate: float
    average_cognitive_load: Optional[float]
    improvement_trend: str  # "improving", "stable", "declining"
