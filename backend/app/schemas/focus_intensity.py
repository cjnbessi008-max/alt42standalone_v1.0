"""
Focus Intensity Pydantic Schemas
Request/Response models for API
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ============================================================================
# Focus Intensity Level Schemas
# ============================================================================

class FocusIntensityLevelBase(BaseModel):
    """집중 강도 레벨 기본 스키마"""
    level: int = Field(..., ge=1, le=5, description="집중 강도 레벨 (1-5)")
    time_limit_seconds: Optional[int] = Field(None, ge=0, description="제한 시간 (초)")
    show_timer: bool = Field(True, description="타이머 표시 여부")
    timer_urgency_threshold: int = Field(30, ge=0, le=100, description="긴박감 표시 임계값 (%)")
    hints_available: int = Field(0, ge=0, description="사용 가능한 힌트 수")
    hint_delay_seconds: int = Field(0, ge=0, description="힌트 활성화 지연 (초)")
    show_solution: bool = Field(False, description="정답 보기 표시 여부")
    ui_complexity: str = Field("standard", description="UI 복잡도")
    distraction_level: str = Field("low", description="시각적 자극 수준")
    background_color: str = Field("#F5F5F5", description="배경색 (hex)")
    animation_speed: float = Field(1.0, ge=0.0, le=2.0, description="애니메이션 속도")
    immediate_feedback: bool = Field(True, description="즉시 피드백")
    feedback_detail: str = Field("detailed", description="피드백 상세도")
    encouragement_frequency: int = Field(3, ge=1, description="격려 메시지 빈도")
    sound_enabled: bool = Field(False, description="음향 활성화")
    background_music: str = Field("none", description="배경 음악")
    sound_effects: bool = Field(False, description="효과음 활성화")

    @field_validator('ui_complexity')
    @classmethod
    def validate_ui_complexity(cls, v):
        allowed = ['minimal', 'standard', 'rich']
        if v not in allowed:
            raise ValueError(f"ui_complexity must be one of {allowed}")
        return v

    @field_validator('distraction_level')
    @classmethod
    def validate_distraction_level(cls, v):
        allowed = ['none', 'low', 'medium']
        if v not in allowed:
            raise ValueError(f"distraction_level must be one of {allowed}")
        return v

    @field_validator('feedback_detail')
    @classmethod
    def validate_feedback_detail(cls, v):
        allowed = ['minimal', 'detailed', 'comprehensive']
        if v not in allowed:
            raise ValueError(f"feedback_detail must be one of {allowed}")
        return v

    @field_validator('background_music')
    @classmethod
    def validate_background_music(cls, v):
        allowed = ['none', 'ambient', 'focus']
        if v not in allowed:
            raise ValueError(f"background_music must be one of {allowed}")
        return v


class FocusIntensityLevelCreate(FocusIntensityLevelBase):
    """집중 강도 레벨 생성 스키마"""
    module_id: UUID


class FocusIntensityLevelUpdate(BaseModel):
    """집중 강도 레벨 수정 스키마 (부분 업데이트)"""
    time_limit_seconds: Optional[int] = None
    show_timer: Optional[bool] = None
    hints_available: Optional[int] = None
    background_color: Optional[str] = None
    ui_complexity: Optional[str] = None
    feedback_detail: Optional[str] = None


class FocusIntensityLevelResponse(FocusIntensityLevelBase):
    """집중 강도 레벨 응답 스키마"""
    id: UUID
    module_id: UUID
    name: str = Field(..., description="레벨 이름")
    description: str = Field(..., description="레벨 설명")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Focus Intensity Adjustment Schemas
# ============================================================================

class PerformanceDataRequest(BaseModel):
    """학생 성과 데이터"""
    recent_accuracy: float = Field(..., ge=0.0, le=1.0, description="최근 정답률 (0-1)")
    avg_response_time: float = Field(..., gt=0, description="평균 응답 시간 (초)")
    expected_response_time: float = Field(..., gt=0, description="예상 응답 시간 (초)")
    consecutive_correct: int = Field(..., ge=0, description="연속 정답 수")
    consecutive_incorrect: int = Field(..., ge=0, description="연속 오답 수")


class AdjustFocusIntensityRequest(BaseModel):
    """집중 강도 조절 요청"""
    module_id: UUID
    problem_id: UUID
    current_level: int = Field(..., ge=1, le=5)
    problem_difficulty: int = Field(..., ge=1, le=5)
    performance_data: PerformanceDataRequest
    force_manual_level: Optional[int] = Field(None, ge=1, le=5, description="수동 조절 (교사)")


class AdjustFocusIntensityResponse(BaseModel):
    """집중 강도 조절 응답"""
    new_level: int = Field(..., ge=1, le=5)
    previous_level: int = Field(..., ge=1, le=5)
    level_changed: bool
    adjustment_reason: str
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    ui_settings: FocusIntensityLevelResponse
    recommendation: str


# ============================================================================
# Focus Session Schemas
# ============================================================================

class FocusSessionCreate(BaseModel):
    """집중 강도 세션 생성"""
    student_id: UUID
    module_id: UUID
    problem_id: UUID
    focus_intensity_level: int = Field(..., ge=1, le=5)
    previous_level: Optional[int] = Field(None, ge=1, le=5)
    auto_adjusted: bool = True
    adjustment_reason: Optional[str] = None
    problem_difficulty: int = Field(..., ge=1, le=5)
    problem_type: str
    is_correct: bool
    time_spent_seconds: int
    hints_used: int = 0
    solution_viewed: bool = False
    ui_settings: dict


class FocusSessionResponse(BaseModel):
    """집중 강도 세션 응답"""
    id: UUID
    session_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Analytics Schemas
# ============================================================================

class LevelPerformance(BaseModel):
    """레벨별 성과"""
    level: int
    accuracy_rate: float
    avg_time_spent: float
    total_attempts: int
    correct_count: int
    incorrect_count: int
    efficiency_score: float


class TimeSeriesPoint(BaseModel):
    """시계열 데이터 포인트"""
    timestamp: str
    value: float


class FocusAnalyticsResponse(BaseModel):
    """집중 강도 분석 응답"""
    student_id: UUID
    module_id: Optional[UUID] = None
    period: dict
    current_optimal_level: int
    level_performance: List[LevelPerformance]
    trends: dict
    recommendations: List[str]


# ============================================================================
# Teacher Dashboard Schemas
# ============================================================================

class ActiveStudentStatus(BaseModel):
    """활성 학생 상태"""
    student_id: UUID
    student_name: str
    current_level: int
    problem_id: UUID
    problem_number: int
    started_at: str
    elapsed_seconds: int
    recent_accuracy: float
    consecutive_correct: int
    consecutive_incorrect: int


class Alert(BaseModel):
    """교사 알림"""
    type: str  # 'level_drop', 'struggling', 'excelling'
    student_id: UUID
    student_name: str
    message: str
    severity: str  # 'low', 'medium', 'high'


class FocusMonitoringResponse(BaseModel):
    """집중 강도 모니터링 응답"""
    module_id: UUID
    timestamp: str
    avg_focus_level: float
    students_active: int
    students_by_level: dict
    active_students: List[ActiveStudentStatus]
    alerts: List[Alert]
