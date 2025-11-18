"""
Emotion Refresh Routine - Data Models
=====================================
Pydantic models for emotion tracking and refresh routines.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, validator, UUID4


# ============================================================================
# Enums
# ============================================================================

class EmotionType(str, Enum):
    """Types of emotions students can report"""
    HAPPY = "happy"
    STRESSED = "stressed"
    TIRED = "tired"
    BORED = "bored"
    FRUSTRATED = "frustrated"
    FOCUSED = "focused"
    ANXIOUS = "anxious"


class ActivityType(str, Enum):
    """Types of refresh activities"""
    BREATHING = "breathing"
    STRETCH = "stretch"
    MINDFULNESS = "mindfulness"
    ENERGY = "energy"


class VisualCue(str, Enum):
    """Visual cues for activity animations"""
    RELAX = "relax"
    INHALE = "inhale"
    EXHALE = "exhale"
    HOLD = "hold"
    STRETCH = "stretch"
    FOCUS = "focus"


class StudentRating(int, Enum):
    """Student rating for activities"""
    THUMBS_DOWN = -1
    NEUTRAL = 0
    THUMBS_UP = 1


# ============================================================================
# Request Models
# ============================================================================

class EmotionCheckInRequest(BaseModel):
    """Request body for emotion check-in"""
    student_id: UUID4
    module_id: Optional[UUID4] = None
    emotion_type: EmotionType
    emotion_score: int = Field(..., ge=1, le=10, description="Emotion intensity 1-10")
    context_note: Optional[str] = Field(None, max_length=500)
    session_duration_minutes: Optional[int] = Field(None, ge=0)

    class Config:
        schema_extra = {
            "example": {
                "student_id": "123e4567-e89b-12d3-a456-426614174000",
                "module_id": "123e4567-e89b-12d3-a456-426614174001",
                "emotion_type": "stressed",
                "emotion_score": 7,
                "context_note": "수학 문제가 너무 어려워요",
                "session_duration_minutes": 25
            }
        }


class GenerateActivityRequest(BaseModel):
    """Request body for generating a refresh activity"""
    student_id: UUID4
    check_in_id: Optional[UUID4] = None
    emotion_type: EmotionType
    emotion_score: int = Field(..., ge=1, le=10)
    grade_level: int = Field(..., ge=1, le=12)
    subject: str = Field(default="수학", max_length=50)
    preferences: Optional[Dict[str, List[str]]] = None

    class Config:
        schema_extra = {
            "example": {
                "student_id": "123e4567-e89b-12d3-a456-426614174000",
                "emotion_type": "stressed",
                "emotion_score": 7,
                "grade_level": 5,
                "preferences": {
                    "preferred_activities": ["breathing", "mindfulness"],
                    "avoid_activities": ["physical"]
                }
            }
        }


class CompleteSessionRequest(BaseModel):
    """Request body for completing a refresh session"""
    session_id: UUID4
    post_emotion_type: EmotionType
    post_emotion_score: int = Field(..., ge=1, le=10)
    completed: bool = True
    completion_percentage: int = Field(default=100, ge=0, le=100)
    student_rating: Optional[StudentRating] = None
    feedback_note: Optional[str] = Field(None, max_length=500)
    actual_duration_seconds: Optional[int] = Field(None, ge=0)

    class Config:
        schema_extra = {
            "example": {
                "session_id": "123e4567-e89b-12d3-a456-426614174002",
                "post_emotion_type": "focused",
                "post_emotion_score": 4,
                "completed": True,
                "student_rating": 1
            }
        }


# ============================================================================
# Response Models
# ============================================================================

class ActivityStep(BaseModel):
    """Single step in a refresh activity"""
    time_seconds: int = Field(..., ge=0)
    instruction: str = Field(..., max_length=200)
    duration_seconds: int = Field(..., ge=1)
    visual_cue: VisualCue

    class Config:
        schema_extra = {
            "example": {
                "time_seconds": 0,
                "instruction": "편안하게 앉아 눈을 감으세요",
                "duration_seconds": 5,
                "visual_cue": "relax"
            }
        }


class ActivityContent(BaseModel):
    """Content of a refresh activity"""
    title: str = Field(..., max_length=50)
    description: str = Field(..., max_length=200)
    activity_type: ActivityType
    steps: List[ActivityStep]
    total_duration: int = Field(default=60)
    background_music: Optional[str] = None
    visual_guide: Optional[str] = None
    expected_outcome: str = Field(..., max_length=200)
    encouragement: str = Field(..., max_length=200)

    @validator('steps')
    def validate_total_duration(cls, v, values):
        """Ensure steps sum to total_duration"""
        total = sum(step.duration_seconds for step in v)
        expected = values.get('total_duration', 60)
        if total != expected:
            raise ValueError(
                f"Steps duration sum ({total}s) must equal total_duration ({expected}s)"
            )
        return v

    class Config:
        schema_extra = {
            "example": {
                "title": "차분한 호흡",
                "description": "4-7-8 호흡법으로 마음을 안정시켜요",
                "activity_type": "breathing",
                "steps": [
                    {
                        "time_seconds": 0,
                        "instruction": "편안하게 앉으세요",
                        "duration_seconds": 5,
                        "visual_cue": "relax"
                    }
                ],
                "total_duration": 60,
                "expected_outcome": "마음이 차분해지고 집중력이 높아질 거예요",
                "encouragement": "잘했어요! 🌟"
            }
        }


class EmotionCheckInResponse(BaseModel):
    """Response after emotion check-in"""
    check_in_id: UUID4
    suggested_activity_id: Optional[UUID4] = None
    message: str
    timestamp: datetime

    class Config:
        schema_extra = {
            "example": {
                "check_in_id": "123e4567-e89b-12d3-a456-426614174003",
                "suggested_activity_id": "123e4567-e89b-12d3-a456-426614174004",
                "message": "잠깐 쉬면서 기분을 전환해볼까요?",
                "timestamp": "2025-11-18T10:30:00Z"
            }
        }


class GenerateActivityResponse(BaseModel):
    """Response with generated activity"""
    activity_id: UUID4
    session_id: UUID4
    activity: ActivityContent

    class Config:
        schema_extra = {
            "example": {
                "activity_id": "123e4567-e89b-12d3-a456-426614174004",
                "session_id": "123e4567-e89b-12d3-a456-426614174005",
                "activity": {
                    "title": "차분한 호흡",
                    "description": "4-7-8 호흡법으로 마음을 안정시켜요",
                    "activity_type": "breathing",
                    "steps": [],
                    "total_duration": 60,
                    "expected_outcome": "마음이 차분해집니다",
                    "encouragement": "잘했어요! 🌟"
                }
            }
        }


class CompleteSessionResponse(BaseModel):
    """Response after completing a session"""
    session_id: UUID4
    improvement_score: float
    message: str
    badges: List[str] = Field(default_factory=list)

    class Config:
        schema_extra = {
            "example": {
                "session_id": "123e4567-e89b-12d3-a456-426614174005",
                "improvement_score": 3.0,
                "message": "좋아요! 기분이 많이 나아졌네요 😊",
                "badges": ["first_refresh", "stress_buster"]
            }
        }


class EmotionTrendPoint(BaseModel):
    """Single point in emotion trend data"""
    date: str
    avg_score: float
    check_ins: int
    most_common_emotion: Optional[EmotionType] = None


class StudentEmotionHistoryResponse(BaseModel):
    """Student's emotion history"""
    student_id: UUID4
    date_range: Dict[str, str]
    emotion_trend: List[EmotionTrendPoint]
    most_common_emotion: EmotionType
    total_refresh_sessions: int
    avg_improvement: float
    total_check_ins: int

    class Config:
        schema_extra = {
            "example": {
                "student_id": "123e4567-e89b-12d3-a456-426614174000",
                "date_range": {"start": "2025-11-11", "end": "2025-11-18"},
                "emotion_trend": [
                    {"date": "2025-11-11", "avg_score": 6.5, "check_ins": 3},
                    {"date": "2025-11-12", "avg_score": 5.2, "check_ins": 4}
                ],
                "most_common_emotion": "focused",
                "total_refresh_sessions": 12,
                "avg_improvement": 2.8,
                "total_check_ins": 23
            }
        }


class EmotionAnalyticsResponse(BaseModel):
    """Analytics data for teacher dashboard"""
    module_id: UUID4
    date: str
    total_students: int
    total_check_ins: int
    avg_emotion_score: float
    emotion_distribution: Dict[str, int]
    refresh_participation_rate: float
    avg_improvement_score: float
    correlation_with_performance: Optional[float] = None
    top_activities: List[Dict[str, Any]] = Field(default_factory=list)

    class Config:
        schema_extra = {
            "example": {
                "module_id": "123e4567-e89b-12d3-a456-426614174001",
                "date": "2025-11-18",
                "total_students": 25,
                "total_check_ins": 47,
                "avg_emotion_score": 5.8,
                "emotion_distribution": {
                    "happy": 12,
                    "stressed": 8,
                    "tired": 10,
                    "focused": 15,
                    "frustrated": 2
                },
                "refresh_participation_rate": 0.68,
                "avg_improvement_score": 2.3,
                "correlation_with_performance": 0.42
            }
        }


# ============================================================================
# Database Models (for internal use)
# ============================================================================

class EmotionCheckIn(BaseModel):
    """Database model for emotion check-in"""
    id: UUID4
    student_id: UUID4
    module_id: Optional[UUID4]
    emotion_type: str
    emotion_score: int
    context_note: Optional[str]
    session_duration_minutes: Optional[int]
    timestamp: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class RefreshActivity(BaseModel):
    """Database model for refresh activity"""
    id: UUID4
    activity_type: str
    target_emotion: Optional[str]
    duration_seconds: int
    difficulty_level: Optional[int]
    min_grade_level: Optional[int]
    max_grade_level: Optional[int]
    ai_generated_content: Dict[str, Any]
    usage_count: int
    avg_effectiveness_score: Optional[float]
    positive_rating_count: int
    negative_rating_count: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class StudentRefreshSession(BaseModel):
    """Database model for student refresh session"""
    id: UUID4
    student_id: UUID4
    activity_id: UUID4
    module_id: Optional[UUID4]
    pre_emotion_type: str
    pre_emotion_score: int
    post_emotion_type: Optional[str]
    post_emotion_score: Optional[int]
    engagement_level: Optional[int]
    completed: bool
    completion_percentage: int
    actual_duration_seconds: Optional[int]
    student_rating: Optional[int]
    feedback_note: Optional[str]
    session_timestamp: datetime
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# ============================================================================
# Utility Models
# ============================================================================

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        schema_extra = {
            "example": {
                "error": "Invalid emotion type",
                "detail": "Emotion type must be one of: happy, stressed, tired, etc.",
                "timestamp": "2025-11-18T10:30:00Z"
            }
        }


class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully",
                "timestamp": "2025-11-18T10:30:00Z"
            }
        }
