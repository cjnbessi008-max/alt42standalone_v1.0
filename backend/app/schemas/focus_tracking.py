"""
Focus Tracking Schemas
Pydantic models for API request/response validation
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class BreakReason(str, Enum):
    """집중력이 깨진 이유"""
    IDLE_TIMEOUT = "idle_timeout"
    WRONG_ANSWERS = "wrong_answers"
    NO_INTERACTION = "no_interaction"
    MANUAL = "manual"


class RoutineType(str, Enum):
    """정신정렬 루틴 타입"""
    BREATHING = "breathing"
    STRETCHING = "stretching"
    EYE_EXERCISE = "eye_exercise"


class SyncStatus(str, Enum):
    """Moodle 동기화 상태"""
    PENDING = "pending"
    SYNCED = "synced"
    FAILED = "failed"


# Focus Session Schemas
class FocusSessionCreate(BaseModel):
    """집중 세션 생성 요청"""
    student_id: str = Field(..., description="학생 ID")
    module_id: str = Field(..., description="모듈 ID")


class FocusSessionUpdate(BaseModel):
    """집중 세션 업데이트 요청"""
    session_end: Optional[datetime] = None
    active_duration_seconds: Optional[int] = Field(None, ge=0)
    idle_duration_seconds: Optional[int] = Field(None, ge=0)
    interaction_count: Optional[int] = Field(None, ge=0)


class FocusSessionResponse(BaseModel):
    """집중 세션 응답"""
    id: int
    student_id: str
    module_id: str
    session_start: datetime
    session_end: Optional[datetime] = None
    total_duration_seconds: Optional[int] = None
    active_duration_seconds: int
    idle_duration_seconds: int
    focus_score: Optional[float] = None
    interaction_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Focus Break Schemas
class FocusBreakCreate(BaseModel):
    """집중 중단 기록 생성 요청"""
    session_id: int = Field(..., description="세션 ID")
    student_id: str = Field(..., description="학생 ID")
    break_reason: BreakReason = Field(..., description="중단 이유")
    idle_duration_seconds: Optional[int] = Field(None, ge=0, description="유휴 시간 (초)")
    routine_type: RoutineType = Field(RoutineType.BREATHING, description="루틴 타입")
    notes: Optional[Dict[str, Any]] = Field(None, description="추가 메타데이터")


class FocusBreakUpdate(BaseModel):
    """집중 중단 기록 업데이트 요청"""
    routine_started_at: Optional[datetime] = None
    routine_completed_at: Optional[datetime] = None
    routine_skipped: Optional[bool] = None
    effectiveness_rating: Optional[int] = Field(None, ge=1, le=5, description="효과성 평가 (1-5)")


class FocusBreakResponse(BaseModel):
    """집중 중단 기록 응답"""
    id: int
    session_id: int
    student_id: str
    break_triggered_at: datetime
    break_reason: str
    idle_duration_seconds: Optional[int]
    routine_started_at: Optional[datetime]
    routine_completed_at: Optional[datetime]
    routine_skipped: bool
    routine_type: str
    effectiveness_rating: Optional[int]
    notes: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


# Mental Alignment Routine Schemas
class MentalAlignmentRoutineCreate(BaseModel):
    """정신정렬 루틴 생성 요청"""
    routine_type: str = Field(..., max_length=50)
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    duration_seconds: int = Field(10, ge=1, le=60)
    instructions: List[str] = Field(..., min_length=1, description="단계별 지침")
    animation_config: Optional[Dict[str, Any]] = None
    audio_cues: Optional[Dict[str, Any]] = None


class MentalAlignmentRoutineResponse(BaseModel):
    """정신정렬 루틴 응답"""
    id: int
    routine_type: str
    title: str
    description: Optional[str]
    duration_seconds: int
    instructions: List[str]
    animation_config: Optional[Dict[str, Any]]
    audio_cues: Optional[Dict[str, Any]]
    is_active: bool
    usage_count: int
    avg_effectiveness_rating: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Student Focus Preferences Schemas
class StudentFocusPreferencesCreate(BaseModel):
    """학생 집중도 설정 생성 요청"""
    student_id: str = Field(..., description="학생 ID")
    idle_timeout_seconds: int = Field(120, ge=30, le=600, description="유휴 타임아웃 (초)")
    enable_focus_tracking: bool = Field(True, description="집중도 추적 활성화")
    enable_auto_breaks: bool = Field(True, description="자동 휴식 활성화")
    preferred_routine_type: RoutineType = Field(RoutineType.BREATHING, description="선호 루틴")
    break_frequency_minutes: int = Field(30, ge=10, le=120, description="휴식 주기 (분)")
    notifications_enabled: bool = Field(True, description="알림 활성화")
    preferences: Optional[Dict[str, Any]] = None


class StudentFocusPreferencesUpdate(BaseModel):
    """학생 집중도 설정 업데이트 요청"""
    idle_timeout_seconds: Optional[int] = Field(None, ge=30, le=600)
    enable_focus_tracking: Optional[bool] = None
    enable_auto_breaks: Optional[bool] = None
    preferred_routine_type: Optional[RoutineType] = None
    break_frequency_minutes: Optional[int] = Field(None, ge=10, le=120)
    notifications_enabled: Optional[bool] = None
    preferences: Optional[Dict[str, Any]] = None


class StudentFocusPreferencesResponse(BaseModel):
    """학생 집중도 설정 응답"""
    id: int
    student_id: str
    idle_timeout_seconds: int
    enable_focus_tracking: bool
    enable_auto_breaks: bool
    preferred_routine_type: str
    break_frequency_minutes: int
    notifications_enabled: bool
    preferences: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Moodle Integration Schemas
class MoodleIntegrationLogCreate(BaseModel):
    """Moodle 연동 로그 생성 요청"""
    student_id: str
    moodle_user_id: Optional[str] = None
    moodle_course_id: Optional[str] = None
    event_type: str = Field(..., description="이벤트 타입")
    event_data: Optional[Dict[str, Any]] = None


class MoodleIntegrationLogResponse(BaseModel):
    """Moodle 연동 로그 응답"""
    id: int
    student_id: str
    moodle_user_id: Optional[str]
    moodle_course_id: Optional[str]
    event_type: str
    event_data: Optional[Dict[str, Any]]
    sync_status: str
    sync_attempted_at: Optional[datetime]
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Analytics Schemas
class FocusAnalytics(BaseModel):
    """집중도 분석 데이터"""
    student_id: str
    total_sessions: int
    total_study_time_minutes: float
    average_focus_score: float
    total_breaks: int
    most_common_break_reason: Optional[str]
    favorite_routine_type: Optional[str]
    completion_rate: float  # Percentage of completed routines
    avg_routine_effectiveness: Optional[float]


class SessionSummary(BaseModel):
    """세션 요약 정보"""
    session_id: int
    duration_minutes: float
    focus_score: float
    break_count: int
    interaction_count: int
    date: datetime
