"""
Pydantic schemas for API request/response validation
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


# Learning Event Schemas
class LearningEventCreate(BaseModel):
    session_id: UUID
    event_type: str = Field(..., max_length=50)
    event_data: Optional[Dict[str, Any]] = None
    timestamp: Optional[datetime] = None


class LearningEventResponse(BaseModel):
    id: UUID
    session_id: UUID
    event_type: str
    event_data: Optional[Dict[str, Any]]
    timestamp: datetime
    time_since_last_event_ms: Optional[int]

    model_config = ConfigDict(from_attributes=True)


# Problem Attempt Schemas
class ProblemAttemptCreate(BaseModel):
    session_id: UUID
    problem_id: str
    problem_type: Optional[str] = None
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)
    attempt_number: int = 1
    answer_data: Dict[str, Any]
    is_correct: bool
    time_spent_seconds: Optional[int] = None
    hints_used: int = 0


class ProblemAttemptResponse(BaseModel):
    id: UUID
    session_id: UUID
    problem_id: str
    problem_type: Optional[str]
    difficulty_level: Optional[int]
    attempt_number: int
    answer_data: Dict[str, Any]
    is_correct: bool
    time_spent_seconds: Optional[int]
    hints_used: int
    attempted_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Learning Session Schemas
class LearningSessionCreate(BaseModel):
    student_id: UUID
    module_id: UUID
    started_at: Optional[datetime] = None


class LearningSessionUpdate(BaseModel):
    ended_at: Optional[datetime] = None
    is_completed: Optional[bool] = None
    dropout_point: Optional[str] = None


class LearningSessionResponse(BaseModel):
    id: UUID
    student_id: UUID
    module_id: UUID
    started_at: datetime
    ended_at: Optional[datetime]
    is_completed: bool
    dropout_point: Optional[str]
    total_duration_seconds: Optional[int]
    active_duration_seconds: Optional[int]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Dropout Analysis Schemas
class ContributingFactor(BaseModel):
    reason: str
    confidence: float = Field(..., ge=0, le=1)
    evidence: Dict[str, Any]


class DropoutRecommendation(BaseModel):
    ko: str
    en: str
    actions: List[str]


class DropoutMetrics(BaseModel):
    total_duration_seconds: int
    active_duration_seconds: int
    idle_time_ratio: float
    total_attempts: int
    correct_attempts: int
    accuracy_rate: float
    accuracy_trend: List[float]
    events_per_minute: float
    avg_time_per_problem: float
    consecutive_errors: int
    max_consecutive_errors: int


class DropoutAnalysisResponse(BaseModel):
    id: UUID
    session_id: UUID
    student_id: UUID
    module_id: UUID
    dropout_point: Optional[str]
    primary_reason: str
    confidence: float
    contributing_factors: List[ContributingFactor]
    recommendations: DropoutRecommendation
    metrics: DropoutMetrics
    analyzed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Student Pattern Schemas
class CommonDropoutReason(BaseModel):
    reason: str
    frequency: int


class StudentLearningProfileResponse(BaseModel):
    student_id: UUID
    total_sessions: int
    dropout_sessions: int
    dropout_rate: float
    common_reasons: List[CommonDropoutReason]
    avg_session_duration_minutes: Optional[float]
    preferred_time: Optional[str]
    engagement_trend: Optional[str]
    last_session_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class StudentPatternResponse(BaseModel):
    student_id: UUID
    student_name: str
    total_sessions: int
    dropout_sessions: int
    dropout_rate: float
    common_reasons: List[CommonDropoutReason]
    learning_profile: StudentLearningProfileResponse
    recent_dropouts: List[DropoutAnalysisResponse]
    recommendations: List[str]


# Module Analytics Schemas
class DropoutHotspot(BaseModel):
    location: str
    location_type: Optional[str]
    dropout_count: int
    common_reason: str
    severity_score: float
    avg_time_before_dropout_seconds: Optional[int]


class ModuleAnalyticsSummaryResponse(BaseModel):
    module_id: UUID
    module_name: str
    total_sessions: int
    dropout_sessions: int
    dropout_rate: float
    avg_session_duration_minutes: Optional[float]
    dropout_hotspots: List[DropoutHotspot]
    recommendations: List[str]

    model_config = ConfigDict(from_attributes=True)


# Dashboard Schemas
class DashboardOverview(BaseModel):
    total_sessions: int
    dropout_count: int
    dropout_rate: float
    avg_session_duration: float
    period: str = "Last 30 days"


class StudentAtRisk(BaseModel):
    student_id: UUID
    student_name: str
    recent_dropout_count: int
    dropout_rate: float
    primary_concern: str


class DashboardResponse(BaseModel):
    overview: DashboardOverview
    hotspots: List[DropoutHotspot]
    students_at_risk: List[StudentAtRisk]
    dropout_trend: List[Dict[str, Any]]  # {date: str, count: int, rate: float}
