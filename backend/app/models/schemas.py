"""
Pydantic schemas for Answer Classification API
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, field_validator
from uuid import UUID


# ============================================================================
# Enums
# ============================================================================

class ErrorType(str, Enum):
    """오답 원인 분류 타입"""
    CONCEPT = "개념"           # Conceptual misunderstanding
    CALCULATION = "계산"        # Calculation error
    CONDITION_OMISSION = "조건누락"  # Condition omission


class FeedbackType(str, Enum):
    """피드백 리소스 타입"""
    CONCEPT = "concept"        # Conceptual explanation
    HINT = "hint"             # Helpful hint
    EXAMPLE = "example"       # Example problem
    RESOURCE = "resource"     # Learning resource link
    VIDEO = "video"           # Video explanation
    PRACTICE = "practice"     # Practice problems


class PassbackStatus(str, Enum):
    """LMS 성적 전송 상태"""
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    RETRY = "retry"


# ============================================================================
# Request Schemas
# ============================================================================

class AnswerSubmitRequest(BaseModel):
    """답안 제출 요청"""
    student_id: UUID
    problem_id: UUID
    answer_content: str = Field(..., min_length=1, max_length=10000)
    answer_data: Optional[Dict[str, Any]] = None
    work_shown: Optional[str] = Field(None, max_length=50000)
    work_images: Optional[List[str]] = None
    time_spent_seconds: int = Field(..., ge=0, le=86400)
    lms_submission_id: Optional[str] = None
    lms_source: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "student_id": "123e4567-e89b-12d3-a456-426614174000",
                "problem_id": "123e4567-e89b-12d3-a456-426614174001",
                "answer_content": "1/3",
                "work_shown": "1/4 + 1/4 = 2/4 = 1/2로 계산했습니다",
                "time_spent_seconds": 120
            }
        }
    )


class ClassificationReviewRequest(BaseModel):
    """교사의 분류 검토 요청"""
    teacher_id: UUID
    verified: bool
    override_type: Optional[ErrorType] = None
    notes: Optional[str] = Field(None, max_length=5000)

    @field_validator('override_type')
    @classmethod
    def validate_override(cls, v, info):
        if not info.data.get('verified') and v is not None:
            raise ValueError("override_type은 verified=true일 때만 설정 가능합니다")
        return v


# ============================================================================
# Response Schemas
# ============================================================================

class ClassificationResult(BaseModel):
    """분류 결과"""
    type: ErrorType
    confidence: float = Field(..., ge=0.0, le=1.0)
    explanation: str
    explanation_en: Optional[str] = None
    feedback: str
    ai_reasoning: str
    teacher_verified: bool = False

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "개념",
                "confidence": 0.92,
                "explanation": "학생이 분수의 덧셈 시 분모를 통분해야 한다는 개념을 이해하지 못했습니다.",
                "feedback": "분수를 더할 때는 먼저 분모를 같게 만들어야 합니다. 1/3 + 1/4를 계산하려면 분모를 12로 통분하세요.",
                "ai_reasoning": "Student added numerators and denominators separately (1+1)/(3+4) instead of finding common denominator",
                "teacher_verified": False
            }
        }
    )


class ResourceRecommendation(BaseModel):
    """추천 학습 리소스"""
    id: UUID
    feedback_type: FeedbackType
    title: Optional[str] = None
    content: str
    resource_url: Optional[str] = None
    thumbnail_url: Optional[str] = None


class AnswerSubmitResponse(BaseModel):
    """답안 제출 응답"""
    submission_id: UUID
    is_correct: bool
    classification: Optional[ClassificationResult] = None
    recommended_resources: List[ResourceRecommendation] = []
    evaluated_at: datetime

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "submission_id": "123e4567-e89b-12d3-a456-426614174002",
                "is_correct": False,
                "classification": {
                    "type": "개념",
                    "confidence": 0.92,
                    "explanation": "분수 덧셈의 기본 개념을 이해하지 못했습니다.",
                    "feedback": "분모를 먼저 통분해야 합니다.",
                    "ai_reasoning": "Added without common denominator",
                    "teacher_verified": False
                },
                "recommended_resources": [],
                "evaluated_at": "2025-11-18T10:30:00Z"
            }
        }
    )


class ErrorPatternStats(BaseModel):
    """오류 패턴 통계"""
    error_type: ErrorType
    count: int
    first_occurrence: datetime
    last_occurrence: datetime
    is_resolved: bool
    trend: str  # 'increasing', 'stable', 'decreasing'


class StudentErrorPatternsResponse(BaseModel):
    """학생 오류 패턴 응답"""
    student_id: UUID
    overall_stats: Dict[str, int]
    patterns: List[ErrorPatternStats]
    improvement_score: Optional[float] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "student_id": "123e4567-e89b-12d3-a456-426614174000",
                "overall_stats": {
                    "total_errors": 45,
                    "개념_count": 20,
                    "계산_count": 15,
                    "조건누락_count": 10
                },
                "patterns": [
                    {
                        "error_type": "개념",
                        "count": 8,
                        "first_occurrence": "2025-11-01T10:00:00Z",
                        "last_occurrence": "2025-11-15T14:30:00Z",
                        "is_resolved": False,
                        "trend": "decreasing"
                    }
                ],
                "improvement_score": 0.65
            }
        }
    )


class ModuleErrorDistribution(BaseModel):
    """모듈별 오류 분포"""
    module_id: UUID
    module_name: str
    total_submissions: int
    incorrect_count: int
    error_rate_percent: float
    error_breakdown: Dict[str, int]  # {"개념": 10, "계산": 5, "조건누락": 3}


class ClassErrorAnalytics(BaseModel):
    """학급 오류 분석"""
    module_id: UUID
    class_id: Optional[str] = None
    total_students: int
    active_students: int
    error_distribution: Dict[str, Dict[str, Any]]  # Type -> {count, students[]}
    common_misconceptions: List[str]
    at_risk_students: List[UUID]  # Students with persistent error patterns

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "module_id": "123e4567-e89b-12d3-a456-426614174001",
                "class_id": "3-A",
                "total_students": 25,
                "active_students": 23,
                "error_distribution": {
                    "개념": {"count": 45, "students": ["uuid1", "uuid2"]},
                    "계산": {"count": 30, "students": ["uuid3", "uuid4"]},
                    "조건누락": {"count": 15, "students": ["uuid5"]}
                },
                "common_misconceptions": [
                    "분수 덧셈 시 분모 통분 누락",
                    "분자와 분모를 각각 더함"
                ],
                "at_risk_students": ["uuid1", "uuid2"]
            }
        }
    )


# ============================================================================
# Database Model Schemas (ORM representations)
# ============================================================================

class AnswerSubmissionDB(BaseModel):
    """답안 제출 DB 모델"""
    id: UUID
    student_id: UUID
    problem_id: UUID
    module_id: UUID
    answer_content: str
    answer_data: Optional[Dict[str, Any]] = None
    work_shown: Optional[str] = None
    work_images: Optional[List[str]] = None
    is_correct: bool
    evaluation_details: Optional[Dict[str, Any]] = None
    submitted_at: datetime
    evaluated_at: datetime
    time_spent_seconds: int
    lms_submission_id: Optional[str] = None
    lms_source: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AnswerClassificationDB(BaseModel):
    """답안 분류 DB 모델"""
    id: UUID
    submission_id: UUID
    classification_type: ErrorType
    confidence_score: float
    explanation: str
    explanation_en: Optional[str] = None
    ai_reasoning: str
    ai_model_version: Optional[str] = None
    teacher_verified: bool
    teacher_override: Optional[ErrorType] = None
    teacher_id: Optional[UUID] = None
    teacher_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    classified_at: datetime
    feedback_message: str

    model_config = ConfigDict(from_attributes=True)


class ErrorPatternDB(BaseModel):
    """오류 패턴 DB 모델"""
    id: UUID
    student_id: UUID
    module_id: UUID
    error_type: ErrorType
    occurrence_count: int
    first_occurrence: datetime
    last_occurrence: datetime
    is_resolved: bool
    resolved_at: Optional[datetime] = None
    resolution_criteria: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# LMS Integration Schemas
# ============================================================================

class LTILaunchRequest(BaseModel):
    """LTI 1.3 Launch 요청"""
    iss: str  # Issuer (platform)
    aud: str  # Audience (client_id)
    sub: str  # Subject (user_id)
    exp: int  # Expiration
    iat: int  # Issued at
    nonce: str
    deployment_id: str
    target_link_uri: str
    resource_link: Dict[str, str]
    context: Optional[Dict[str, str]] = None
    roles: List[str]


class GradePassbackRequest(BaseModel):
    """성적 전송 요청"""
    submission_id: UUID
    grade_value: float = Field(..., ge=0, le=100)
    lms_lineitem_id: Optional[str] = None


# ============================================================================
# Utility Schemas
# ============================================================================

class HealthCheckResponse(BaseModel):
    """헬스 체크 응답"""
    status: str
    version: str
    timestamp: datetime
    database: str
    ai_service: str


class PaginationParams(BaseModel):
    """페이지네이션 파라미터"""
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class PaginatedResponse(BaseModel):
    """페이지네이션 응답"""
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
