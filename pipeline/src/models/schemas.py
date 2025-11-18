"""
Pydantic Models and Schemas
"""

from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


# ============================================================================
# ENUMS
# ============================================================================

class ModuleStatus(str, Enum):
    GENERATING = "generating"
    ACTIVE = "active"
    ARCHIVED = "archived"
    FAILED = "failed"


class ClipType(str, Enum):
    CONCEPT = "concept"
    ACTIVITY = "activity"
    EXAMPLE = "example"
    ASSESSMENT = "assessment"
    SUMMARY = "summary"


class ProgressStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    MASTERED = "mastered"


# ============================================================================
# REQUEST MODELS
# ============================================================================

class ModuleRequest(BaseModel):
    """Request to create a new educational module"""
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=10)
    subject: str = Field(default="mathematics")
    grade_level: str = Field(..., min_length=1)
    teacher_id: UUID4


class HighlightClipRequest(BaseModel):
    """Request to create a highlight clip"""
    module_id: UUID4
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    clip_type: ClipType
    content: Dict[str, Any]
    key_concepts: List[str] = Field(default_factory=list)
    difficulty_level: Optional[int] = Field(default=3, ge=1, le=5)
    estimated_duration_minutes: Optional[int] = Field(default=10, ge=1)


class StudentProgressUpdate(BaseModel):
    """Update student progress on a clip"""
    student_id: UUID4
    clip_id: UUID4
    status: ProgressStatus
    progress_percentage: int = Field(ge=0, le=100)
    time_spent_seconds: int = Field(ge=0)
    interaction_data: Optional[Dict[str, Any]] = None


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class ModuleResponse(BaseModel):
    """Response for module data"""
    id: UUID4
    name: str
    description: str
    subject: str = "mathematics"
    grade_level: str
    status: ModuleStatus
    world_model: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class HighlightClip(BaseModel):
    """Highlight clip data"""
    id: UUID4
    module_id: UUID4
    title: str
    description: Optional[str] = None
    clip_type: ClipType
    content: Dict[str, Any]
    key_concepts: List[str] = Field(default_factory=list)
    difficulty_level: int = Field(ge=1, le=5)
    estimated_duration_minutes: int
    order_index: int = 0
    is_featured: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DailyHighlight(BaseModel):
    """Daily highlight recommendation"""
    id: UUID4
    date: date
    clip_id: UUID4
    target_grade_level: Optional[str] = None
    recommendation_reason: str
    ai_confidence_score: float = Field(ge=0.0, le=1.0)
    view_count: int = 0
    engagement_score: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


class StudentProgress(BaseModel):
    """Student progress on a clip"""
    id: UUID4
    student_id: UUID4
    clip_id: UUID4
    status: ProgressStatus
    progress_percentage: int = Field(ge=0, le=100)
    time_spent_seconds: int
    attempts_count: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClipAnalytics(BaseModel):
    """Analytics for a highlight clip"""
    id: UUID4
    clip_id: UUID4
    date: date
    total_views: int = 0
    unique_students: int = 0
    avg_completion_rate: float = 0.0
    avg_time_spent_seconds: int = 0
    success_rate: float = 0.0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# GENERATION MODELS
# ============================================================================

class GenerationStatus(BaseModel):
    """Status of module generation"""
    module_id: UUID4
    stage: str
    status: str
    progress_percentage: int = Field(ge=0, le=100)
    message: Optional[str] = None
    error: Optional[str] = None


class WorldModel(BaseModel):
    """World model structure"""
    concepts: List[Dict[str, Any]] = Field(default_factory=list)
    relationships: List[Dict[str, Any]] = Field(default_factory=list)
    operations: List[Dict[str, Any]] = Field(default_factory=list)
    learning_sequence: List[str] = Field(default_factory=list)
    prerequisites: List[str] = Field(default_factory=list)
    pedagogical_approach: Optional[str] = None


# ============================================================================
# TEACHER AND STUDENT MODELS
# ============================================================================

class Teacher(BaseModel):
    """Teacher data"""
    id: UUID4
    name: str
    email: str
    institution: str = "KAIST Touch Math Academy"
    role: str = "teacher"
    preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    class Config:
        from_attributes = True


class Student(BaseModel):
    """Student data"""
    id: UUID4
    name: str
    email: Optional[str] = None
    grade_level: str
    enrolled_modules: List[UUID4] = Field(default_factory=list)
    learning_preferences: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    class Config:
        from_attributes = True
