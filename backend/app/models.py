"""
Data models for Learning Stress Indicator system
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class StressLevel(str, Enum):
    """학습 스트레스 레벨 (3단계)"""
    LOW = "LOW"  # 낮음: 학생이 편안하게 학습 중
    MEDIUM = "MEDIUM"  # 보통: 적당한 도전과 노력 필요
    HIGH = "HIGH"  # 높음: 학생이 어려움을 겪고 있음


class LearningActivity(BaseModel):
    """학습 활동 데이터"""
    student_id: str = Field(..., description="학생 ID")
    module_id: str = Field(..., description="모듈 ID")
    session_id: str = Field(..., description="학습 세션 ID")
    time_spent_minutes: float = Field(..., ge=0, description="학습 시간 (분)")
    problems_attempted: int = Field(..., ge=0, description="시도한 문제 수")
    problems_correct: int = Field(..., ge=0, description="정답 문제 수")
    retry_count: int = Field(..., ge=0, description="재시도 횟수")
    average_response_time: float = Field(..., ge=0, description="평균 응답 시간 (초)")
    response_time_trend: float = Field(..., ge=-1, le=1, description="응답 시간 추세 (-1: 느려짐, 0: 변화없음, 1: 빨라짐)")
    timestamp: datetime = Field(default_factory=datetime.now, description="기록 시간")


class StressIndicator(BaseModel):
    """학습 스트레스 지표"""
    student_id: str = Field(..., description="학생 ID")
    module_id: str = Field(..., description="모듈 ID")
    session_id: str = Field(..., description="학습 세션 ID")
    stress_level: StressLevel = Field(..., description="스트레스 레벨")
    stress_score: float = Field(..., ge=0, le=100, description="스트레스 점수 (0-100)")
    factors: dict = Field(..., description="스트레스 영향 요인 분석")
    timestamp: datetime = Field(default_factory=datetime.now, description="측정 시간")
    recommendations: list[str] = Field(default_factory=list, description="권장 사항")


class StressMetrics(BaseModel):
    """스트레스 메트릭 요약"""
    total_students: int = Field(..., description="총 학생 수")
    low_stress_count: int = Field(..., description="낮은 스트레스 학생 수")
    medium_stress_count: int = Field(..., description="보통 스트레스 학생 수")
    high_stress_count: int = Field(..., description="높은 스트레스 학생 수")
    average_stress_score: float = Field(..., description="평균 스트레스 점수")
    timestamp: datetime = Field(default_factory=datetime.now, description="집계 시간")


class LMSIntegrationRequest(BaseModel):
    """LMS 연동 요청 데이터"""
    lms_type: str = Field(..., description="LMS 타입 (canvas, moodle, blackboard 등)")
    course_id: str = Field(..., description="강좌 ID")
    student_ids: Optional[list[str]] = Field(None, description="특정 학생 ID 목록 (없으면 전체)")
    module_id: Optional[str] = Field(None, description="특정 모듈 ID (없으면 전체)")


class LMSIntegrationResponse(BaseModel):
    """LMS 연동 응답 데이터"""
    success: bool = Field(..., description="성공 여부")
    message: str = Field(..., description="응답 메시지")
    stress_indicators: list[StressIndicator] = Field(default_factory=list, description="스트레스 지표 목록")
    metrics: Optional[StressMetrics] = Field(None, description="통계 요약")
