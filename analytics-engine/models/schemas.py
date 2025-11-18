"""Pydantic schemas for API requests and responses"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str

class PeakQuality(str, Enum):
    EXCELLENT = "excellent"
    GOOD = "good"
    MODERATE = "moderate"
    LOW = "low"

class LearningEvent(BaseModel):
    id: Optional[int] = None
    session_id: str
    student_id: str
    problem_id: Optional[str] = None
    event_type: str
    event_action: Optional[str] = None
    event_target: Optional[str] = None
    event_data: Optional[Dict[str, Any]] = None
    timestamp: datetime
    sequence_number: Optional[int] = None

class PeakThinkingPeriod(BaseModel):
    id: str
    session_id: str
    student_id: str
    problem_id: Optional[str] = None
    attempt_id: Optional[str] = None
    period_start: datetime
    period_end: datetime
    duration_sec: float

    # Metrics
    event_count: int
    event_rate: float
    interaction_intensity: float
    focus_score: float
    efficiency_score: float
    peak_score: float

    # Classification
    peak_quality: PeakQuality
    confidence_level: float

    # Statistics
    click_count: int = 0
    input_count: int = 0
    modification_count: int = 0
    max_idle_sec: float = 0
    avg_response_time_ms: Optional[int] = None

    algorithm_version: str = "v1.0"
    notes: Optional[str] = None

class AnalysisRequest(BaseModel):
    session_id: str
    force_reanalysis: bool = False

class AnalysisResponse(BaseModel):
    session_id: str
    total_events: int
    total_duration_sec: float
    peak_periods_detected: int
    peak_periods: List[Dict[str, Any]]
    analysis_timestamp: datetime
    algorithm_version: str

class PeakPeriodSummary(BaseModel):
    student_id: str
    student_name: str
    total_peak_periods: int
    avg_peak_score: float
    avg_peak_duration_sec: float
    excellent_count: int
    good_count: int
    moderate_count: int
    low_count: int
    total_learning_time_sec: int

class ConfigParameter(BaseModel):
    key: str
    value: Any
    type: str
    description: Optional[str] = None
