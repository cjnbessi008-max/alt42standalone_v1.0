"""
Data models for Thinking Style Classification System
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel, Field, validator
from uuid import UUID


# ============================================================
# Enums
# ============================================================

class ThinkingStyleType(str, Enum):
    """Types of thinking styles"""
    COMPUTATIONAL = "computational"
    INTUITIVE = "intuitive"
    VISUAL = "visual"
    NONE = "none"


class ConfidenceLevel(str, Enum):
    """Classification confidence levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class InteractionCategory(str, Enum):
    """Categories for interaction tracking"""
    COMPUTATIONAL = "computational"
    INTUITIVE = "intuitive"
    VISUAL = "visual"
    NEUTRAL = "neutral"


class AssessmentType(str, Enum):
    """Types of assessments"""
    INITIAL = "initial"
    PERIODIC = "periodic"
    ON_DEMAND = "on_demand"


class AssessmentStatus(str, Enum):
    """Assessment status"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


# ============================================================
# Request Models
# ============================================================

class InteractionCreate(BaseModel):
    """Model for creating an interaction record"""
    student_id: UUID
    module_id: UUID
    problem_id: Optional[UUID] = None
    interaction_type: str
    interaction_category: InteractionCategory
    duration_seconds: Optional[int] = Field(None, ge=0)
    success: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


class AssessmentCreate(BaseModel):
    """Model for creating an assessment session"""
    student_id: UUID
    module_id: Optional[UUID] = None
    assessment_type: AssessmentType = AssessmentType.INITIAL


class ThinkingStyleUpdate(BaseModel):
    """Model for manual thinking style updates"""
    primary_style: ThinkingStyleType
    secondary_style: Optional[ThinkingStyleType] = ThinkingStyleType.NONE
    computational_score: float = Field(..., ge=0, le=100)
    intuitive_score: float = Field(..., ge=0, le=100)
    visual_score: float = Field(..., ge=0, le=100)


# ============================================================
# Response Models
# ============================================================

class ThinkingStyleScores(BaseModel):
    """Thinking style scores"""
    computational: float = Field(..., ge=0, le=100)
    intuitive: float = Field(..., ge=0, le=100)
    visual: float = Field(..., ge=0, le=100)


class ThinkingStyleProfile(BaseModel):
    """Student's thinking style profile"""
    student_id: UUID
    module_id: Optional[UUID] = None
    primary_style: ThinkingStyleType
    secondary_style: ThinkingStyleType
    is_hybrid: bool
    scores: ThinkingStyleScores
    confidence_level: ConfidenceLevel
    data_points_count: int
    last_assessed_at: datetime
    recommendations: List[str] = []

    class Config:
        from_attributes = True


class InteractionResponse(BaseModel):
    """Response after recording an interaction"""
    recorded: bool
    interaction_id: UUID
    message: Optional[str] = None


class AssessmentResponse(BaseModel):
    """Response for assessment operations"""
    assessment_id: UUID
    status: AssessmentStatus
    progress: Optional[float] = Field(None, ge=0, le=1)
    estimated_completion_minutes: Optional[int] = None

    class Config:
        from_attributes = True


class AssessmentResult(BaseModel):
    """Completed assessment results"""
    assessment_id: UUID
    student_id: UUID
    assessment_type: AssessmentType
    status: AssessmentStatus
    computational_raw_score: Optional[float]
    intuitive_raw_score: Optional[float]
    visual_raw_score: Optional[float]
    recommended_style: Optional[ThinkingStyleType]
    confidence: Optional[float]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ThinkingStyleHistoryPoint(BaseModel):
    """A point in thinking style history"""
    date: str  # ISO date format
    scores: ThinkingStyleScores
    primary_style: ThinkingStyleType
    confidence_level: ConfidenceLevel


class ThinkingStyleHistory(BaseModel):
    """Historical trend of thinking styles"""
    student_id: UUID
    timeline: List[ThinkingStyleHistoryPoint]


class ClassDistribution(BaseModel):
    """Distribution of thinking styles in a class"""
    module_id: Optional[UUID]
    total_students: int
    distribution: Dict[str, Dict[str, int]]  # {style: {count, percentage}}
    hybrids: Dict[str, int]  # {count, percentage}


class PersonalizedRecommendations(BaseModel):
    """Personalized learning recommendations based on thinking style"""
    student_id: UUID
    primary_style: ThinkingStyleType
    recommendations: Dict[str, List[str]]  # {category: [recommendations]}


# ============================================================
# LMS Integration Models
# ============================================================

class LMSPlatform(str, Enum):
    """Supported LMS platforms"""
    CANVAS = "canvas"
    MOODLE = "moodle"
    GOOGLE_CLASSROOM = "google_classroom"
    BLACKBOARD = "blackboard"


class LMSExportRequest(BaseModel):
    """Request to export data to LMS"""
    lms_platform: LMSPlatform
    student_ids: List[UUID]
    data_format: str = "json"  # json, csv, lti


class LMSExportResponse(BaseModel):
    """Response for LMS export"""
    export_id: UUID
    status: str
    download_url: Optional[str] = None


class LMSImportRequest(BaseModel):
    """Request to import data from LMS"""
    lms_platform: LMSPlatform
    course_id: str
    data_url: Optional[str] = None


class LMSImportResponse(BaseModel):
    """Response for LMS import"""
    import_id: UUID
    students_processed: int
    status: str


class LMSWebhookEvent(BaseModel):
    """LMS webhook event data"""
    event_type: str
    student_id: str  # External LMS student ID
    data: Dict[str, Any]


# ============================================================
# Database Models (SQLAlchemy ORM style reference)
# ============================================================

class StudentThinkingStyleDB(BaseModel):
    """Database model for student_thinking_styles table"""
    id: UUID
    student_id: UUID
    module_id: Optional[UUID]
    primary_style: ThinkingStyleType
    secondary_style: ThinkingStyleType
    is_hybrid: bool
    computational_score: float
    intuitive_score: float
    visual_score: float
    confidence_level: ConfidenceLevel
    data_points_count: int
    first_assessed_at: Optional[datetime]
    last_assessed_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InteractionDB(BaseModel):
    """Database model for thinking_style_interactions table"""
    id: UUID
    student_id: UUID
    module_id: UUID
    problem_id: Optional[UUID]
    interaction_type: str
    interaction_category: InteractionCategory
    duration_seconds: Optional[int]
    success: Optional[bool]
    metadata: Optional[Dict[str, Any]]
    occurred_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# Classification Algorithm Models
# ============================================================

class InteractionFactor(BaseModel):
    """A factor used in classification algorithm"""
    factor_name: str
    weight: float = Field(..., ge=0, le=1)
    value: float = Field(..., ge=0, le=1)  # Normalized value


class ClassificationInput(BaseModel):
    """Input data for classification algorithm"""
    student_id: UUID
    module_id: Optional[UUID]
    interactions: List[InteractionDB]
    min_data_points: int = 10


class ClassificationOutput(BaseModel):
    """Output of classification algorithm"""
    student_id: UUID
    computational_score: float
    intuitive_score: float
    visual_score: float
    primary_style: ThinkingStyleType
    secondary_style: ThinkingStyleType
    is_hybrid: bool
    confidence_level: ConfidenceLevel
    data_points_used: int
    factors_breakdown: Optional[Dict[str, List[InteractionFactor]]] = None


# ============================================================
# Validators
# ============================================================

@validator('computational_score', 'intuitive_score', 'visual_score')
def validate_score(cls, v):
    """Ensure scores are between 0 and 100"""
    if not 0 <= v <= 100:
        raise ValueError('Score must be between 0 and 100')
    return v
