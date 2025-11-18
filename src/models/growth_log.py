"""
성장로그 관련 Pydantic 모델
오답을 '실패'가 아닌 '성장'으로 기록하기 위한 데이터 모델
"""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


# =============================================================================
# ENUMS
# =============================================================================

class GrowthCategory(str, Enum):
    """성장 카테고리"""
    FIRST_SUCCESS = "first_success"  # 첫 성공
    PERSISTENT_LEARNING = "persistent_learning"  # 끈기있는 학습
    CONCEPT_EXPLORATION = "concept_exploration"  # 개념 탐구
    PARTIAL_UNDERSTANDING = "partial_understanding"  # 부분 이해
    MISCONCEPTION_IDENTIFIED = "misconception_identified"  # 오개념 발견
    STRATEGY_REFINEMENT = "strategy_refinement"  # 전략 개선


class MilestoneType(str, Enum):
    """마일스톤 유형"""
    CONCEPT_MASTERY = "concept_mastery"  # 개념 숙달
    PERSISTENT_EFFORT = "persistent_effort"  # 끈기있는 노력
    CREATIVE_APPROACH = "creative_approach"  # 창의적 접근
    ERROR_LEARNING = "error_learning"  # 오류로부터 학습
    HELPING_OTHERS = "helping_others"  # 동료 도움
    SELF_CORRECTION = "self_correction"  # 자기 교정


class EngagementLevel(str, Enum):
    """참여 수준"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class LMSProvider(str, Enum):
    """LMS 제공자"""
    CANVAS = "canvas"
    MOODLE = "moodle"
    BLACKBOARD = "blackboard"
    GOOGLE_CLASSROOM = "google_classroom"
    CUSTOM = "custom"


# =============================================================================
# GROWTH LOG MODELS
# =============================================================================

class GrowthLogBase(BaseModel):
    """성장로그 기본 모델"""
    student_id: UUID
    module_id: UUID
    problem_id: UUID
    session_id: Optional[UUID] = None

    student_answer: Dict[str, Any]
    expected_answer: Dict[str, Any]

    is_correct: bool
    attempt_number: int = Field(default=1, ge=1)
    improvement_from_previous: Optional[Dict[str, Any]] = None

    thinking_process: Optional[Dict[str, Any]] = None
    time_spent_seconds: int = Field(..., ge=0)
    interaction_pattern: Optional[Dict[str, Any]] = None
    hints_used: int = Field(default=0, ge=0)
    resources_accessed: List[str] = Field(default_factory=list)

    growth_category: GrowthCategory = GrowthCategory.CONCEPT_EXPLORATION

    class Config:
        use_enum_values = True


class GrowthLogCreate(GrowthLogBase):
    """성장로그 생성 요청"""
    pass


class GrowthLogUpdate(BaseModel):
    """성장로그 업데이트 (교사 코멘트 등)"""
    teacher_comment: Optional[str] = None
    self_reflection: Optional[str] = None


class GrowthLogResponse(GrowthLogBase):
    """성장로그 응답"""
    id: UUID

    # AI가 생성하는 필드들
    growth_score: Optional[Decimal] = Field(None, ge=0, le=100)
    effort_score: Optional[Decimal] = Field(None, ge=0, le=100)
    progress_score: Optional[Decimal] = Field(None, ge=0, le=100)

    ai_feedback: Optional[str] = None
    teacher_comment: Optional[str] = None
    self_reflection: Optional[str] = None

    next_steps: Optional[Dict[str, Any]] = None
    recommended_resources: Optional[Dict[str, Any]] = None

    created_at: datetime
    updated_at: datetime
    synced_to_lms: bool = False
    lms_sync_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# =============================================================================
# LEARNING SESSION MODELS
# =============================================================================

class LearningSessionBase(BaseModel):
    """학습 세션 기본 모델"""
    student_id: UUID
    module_id: UUID


class LearningSessionCreate(LearningSessionBase):
    """학습 세션 생성"""
    pass


class LearningSessionUpdate(BaseModel):
    """학습 세션 업데이트 (종료 시)"""
    ended_at: Optional[datetime] = None
    total_duration_seconds: Optional[int] = None
    engagement_level: Optional[EngagementLevel] = None


class LearningSessionResponse(LearningSessionBase):
    """학습 세션 응답"""
    id: UUID

    started_at: datetime
    ended_at: Optional[datetime] = None
    total_duration_seconds: Optional[int] = None

    total_attempts: int = 0
    correct_attempts: int = 0
    growth_moments: int = 0

    session_growth_score: Optional[Decimal] = None
    engagement_level: Optional[EngagementLevel] = None

    learning_pattern: Optional[str] = None
    breakthrough_moments: Optional[Dict[str, Any]] = None

    synced_to_lms: bool = False
    lms_session_id: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# GROWTH MILESTONE MODELS
# =============================================================================

class GrowthMilestoneBase(BaseModel):
    """성장 마일스톤 기본 모델"""
    student_id: UUID
    module_id: UUID
    milestone_type: MilestoneType
    title: str = Field(..., min_length=1, max_length=255)
    description: str
    evidence: Optional[Dict[str, Any]] = None


class GrowthMilestoneCreate(GrowthMilestoneBase):
    """성장 마일스톤 생성"""
    celebration_message: Optional[str] = None
    badge_earned: Optional[str] = None


class GrowthMilestoneResponse(GrowthMilestoneBase):
    """성장 마일스톤 응답"""
    id: UUID

    celebration_message: Optional[str] = None
    badge_earned: Optional[str] = None

    is_shared_with_teacher: bool = True
    is_shared_with_parents: bool = False
    teacher_acknowledgment: Optional[str] = None

    achieved_at: datetime
    synced_to_lms: bool = False

    class Config:
        from_attributes = True


class GrowthMilestoneShare(BaseModel):
    """마일스톤 공유 설정"""
    share_with_teacher: bool = True
    share_with_parents: bool = False
    include_in_lms: bool = True


# =============================================================================
# ANALYTICS MODELS
# =============================================================================

class StudentGrowthAnalytics(BaseModel):
    """학생 성장 분석"""
    student_id: UUID
    module_id: UUID

    overall_growth_score: Decimal
    growth_trajectory: str  # "upward", "steady", "declining"

    total_attempts: int
    correct_attempts: int
    accuracy_rate: Decimal

    strengths: List[str]
    growth_areas: List[str]

    milestones_achieved: int
    learning_pattern: str

    avg_time_per_attempt: int
    total_time_spent: int

    last_activity: datetime


class GrowthFeedback(BaseModel):
    """AI 생성 성장 피드백"""
    encouragement: str = Field(..., description="긍정적 인정")
    growth_observed: str = Field(..., description="관찰된 성장/개선")
    learning_opportunity: str = Field(..., description="이번 시도에서 배울 점")
    next_steps: List[str] = Field(..., description="다음 단계 제안")
    celebration: Optional[str] = Field(None, description="축하할 점")


# =============================================================================
# LMS INTEGRATION MODELS
# =============================================================================

class LMSIntegrationBase(BaseModel):
    """LMS 연동 기본 모델"""
    lms_provider: LMSProvider
    lms_instance_url: str
    auth_type: str
    module_id: Optional[UUID] = None
    lms_course_id: Optional[str] = None
    lms_assignment_id: Optional[str] = None


class LMSIntegrationCreate(LMSIntegrationBase):
    """LMS 연동 생성"""
    auth_credentials: Dict[str, Any]  # Will be encrypted before storage
    sync_frequency: str = "real_time"
    sync_direction: str = "bidirectional"
    field_mapping: Optional[Dict[str, Any]] = None


class LMSIntegrationResponse(LMSIntegrationBase):
    """LMS 연동 응답 (인증 정보 제외)"""
    id: UUID
    auth_credentials_encrypted: str

    sync_frequency: str
    sync_direction: str
    field_mapping: Optional[Dict[str, Any]] = None

    is_active: bool
    last_sync_at: Optional[datetime] = None
    last_sync_status: Optional[str] = None
    last_sync_error: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LMSSyncRequest(BaseModel):
    """LMS 동기화 요청"""
    sync_type: str = Field(..., description="growth_log, milestone, session, full")
    date_range: Optional[Dict[str, str]] = Field(
        None,
        description="{'from': '2025-11-01', 'to': '2025-11-18'}"
    )


class LMSSyncLogResponse(BaseModel):
    """LMS 동기화 로그 응답"""
    id: UUID
    lms_integration_id: UUID
    sync_type: str

    records_processed: int
    records_succeeded: int
    records_failed: int

    error_details: Optional[Dict[str, Any]] = None

    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str

    synced_record_ids: List[UUID]

    class Config:
        from_attributes = True
