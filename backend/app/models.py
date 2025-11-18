"""
Pydantic models for API request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SeverityLevel(str, Enum):
    """Severity levels for misconceptions"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class MisconceptionPattern(BaseModel):
    """Represents a misconception pattern"""
    id: str
    name: str
    description: str
    concept_name: str
    severity: SeverityLevel
    occurrence_count: int
    last_occurred_at: datetime
    correction_strategy: str
    typical_wrong_pattern: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class TopMisconceptionsResponse(BaseModel):
    """Response model for top misconceptions endpoint"""
    student_id: str
    student_name: str
    module_id: str
    module_name: str
    misconceptions: List[MisconceptionPattern]
    total_count: int
    generated_at: datetime


class StudentInfo(BaseModel):
    """Basic student information"""
    id: str
    name: str
    grade_level: str
    email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ModuleInfo(BaseModel):
    """Basic module information"""
    id: str
    name: str
    description: Optional[str] = None
    subject: str
    grade_level: str

    model_config = ConfigDict(from_attributes=True)


class ConceptInfo(BaseModel):
    """Basic concept information"""
    id: str
    name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class StudentEnrollmentInfo(BaseModel):
    """Student enrollment information"""
    student_id: str
    module_id: str
    enrolled_at: datetime
    progress_percentage: float

    model_config = ConfigDict(from_attributes=True)


class MisconceptionAnalysisRequest(BaseModel):
    """Request model for analyzing misconceptions"""
    module_id: str
    student_id: str
    timeframe: Optional[str] = "all_time"  # Options: "week", "month", "all_time"
    limit: Optional[int] = Field(default=3, ge=1, le=10)


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    database_connected: bool
    version: str
