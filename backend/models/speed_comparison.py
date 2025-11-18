"""
Data models for speed comparison analytics
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, validator
from decimal import Decimal


class StudentAttempt(BaseModel):
    """Model for a single student attempt"""
    id: Optional[UUID] = None
    student_id: UUID
    module_id: UUID
    problem_id: UUID
    answer_data: Dict[str, Any]
    is_correct: bool
    time_spent_seconds: int = Field(..., ge=0)
    hints_used: int = Field(default=0, ge=0)
    attempts_count: int = Field(default=1, ge=1)
    interaction_count: int = Field(default=0, ge=0)
    attempted_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            UUID: str,
            datetime: lambda v: v.isoformat()
        }


class PerformanceMetrics(BaseModel):
    """Aggregated performance metrics for a student in a module"""
    student_id: UUID
    module_id: UUID
    total_problems_attempted: int
    total_problems_correct: int
    accuracy_percentage: Decimal
    average_time_per_problem_seconds: Decimal
    median_time_per_problem_seconds: Decimal
    fastest_problem_time_seconds: int
    slowest_problem_time_seconds: int
    percentile_rank: Optional[Decimal] = None
    speed_vs_average_ratio: Optional[Decimal] = None
    total_time_spent_seconds: int
    last_activity_at: Optional[datetime] = None
    last_calculated_at: datetime

    class Config:
        json_encoders = {
            UUID: str,
            Decimal: float,
            datetime: lambda v: v.isoformat()
        }


class CohortStatistics(BaseModel):
    """Aggregate statistics for a cohort"""
    cohort_id: UUID
    module_id: UUID
    active_student_count: int
    total_attempts: int
    avg_time_per_problem_seconds: Decimal
    median_time_per_problem_seconds: Decimal
    avg_accuracy_percentage: Decimal
    fastest_time_seconds: int
    slowest_time_seconds: int
    last_calculated_at: datetime

    class Config:
        json_encoders = {
            UUID: str,
            Decimal: float,
            datetime: lambda v: v.isoformat()
        }


class SpeedComparison(BaseModel):
    """Complete speed comparison data for a student"""
    student_id: UUID
    module_id: UUID
    cohort_id: Optional[UUID] = None

    # Student metrics
    student_avg_time_seconds: Decimal
    student_median_time_seconds: Decimal
    student_accuracy: Decimal
    student_percentile: Optional[Decimal] = None

    # Cohort metrics
    cohort_avg_time_seconds: Optional[Decimal] = None
    cohort_median_time_seconds: Optional[Decimal] = None
    cohort_avg_accuracy: Optional[Decimal] = None

    # Comparison
    speed_vs_average_ratio: Optional[Decimal] = None  # <1 = faster, >1 = slower
    is_faster_than_average: Optional[bool] = None
    rank_in_cohort: Optional[int] = None
    total_students_in_cohort: Optional[int] = None

    # Additional context
    problems_attempted: int
    last_activity: Optional[datetime] = None

    class Config:
        json_encoders = {
            UUID: str,
            Decimal: float,
            datetime: lambda v: v.isoformat()
        }


class SpeedTrend(BaseModel):
    """Speed trend data over time"""
    snapshot_date: date
    avg_speed_seconds: Decimal
    cohort_avg_speed_seconds: Optional[Decimal] = None
    percentile_rank: Optional[Decimal] = None
    problems_attempted: int
    accuracy_percentage: Decimal

    class Config:
        json_encoders = {
            Decimal: float,
            date: lambda v: v.isoformat()
        }


class SpeedComparisonResponse(BaseModel):
    """API response for speed comparison endpoint"""
    comparison: SpeedComparison
    trends: List[SpeedTrend] = []
    recommendations: List[str] = []

    @validator('recommendations', always=True)
    def generate_recommendations(cls, v, values):
        """Generate personalized recommendations based on performance"""
        if 'comparison' not in values:
            return v

        comparison = values['comparison']
        recommendations = []

        # Speed-based recommendations
        if comparison.speed_vs_average_ratio and comparison.speed_vs_average_ratio > 1.2:
            recommendations.append("당신은 평균보다 느린 속도로 문제를 풀고 있습니다. 천천히 정확하게 푸는 것도 좋지만, 시간 관리를 연습해보세요.")
            recommendations.append("You're solving problems slower than average. While accuracy is important, consider practicing time management.")
        elif comparison.speed_vs_average_ratio and comparison.speed_vs_average_ratio < 0.8:
            recommendations.append("훌륭합니다! 평균보다 빠르게 문제를 해결하고 있습니다.")
            recommendations.append("Excellent! You're solving problems faster than average.")

        # Accuracy-based recommendations
        if comparison.student_accuracy < 70:
            recommendations.append("정확도를 높이는 것에 집중해보세요. 속도보다 이해가 더 중요합니다.")
            recommendations.append("Focus on improving accuracy. Understanding is more important than speed.")
        elif comparison.student_accuracy > 90:
            recommendations.append("뛰어난 정확도입니다! 더 어려운 문제에 도전해보세요.")
            recommendations.append("Outstanding accuracy! Try challenging yourself with harder problems.")

        # Percentile-based recommendations
        if comparison.student_percentile and comparison.student_percentile > 80:
            recommendations.append("당신은 상위 20%에 속합니다. 계속 이렇게 잘 하세요!")
            recommendations.append("You're in the top 20%! Keep up the great work!")
        elif comparison.student_percentile and comparison.student_percentile < 20:
            recommendations.append("더 많은 연습이 필요합니다. 선생님께 도움을 요청하는 것을 고려해보세요.")
            recommendations.append("More practice is needed. Consider asking your teacher for help.")

        return recommendations


class CohortRequest(BaseModel):
    """Request to create or update a cohort"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    module_id: UUID
    grade_level: Optional[str] = None
    academic_year: Optional[str] = None
    institution: Optional[str] = None


class LMSSyncRequest(BaseModel):
    """Request to sync data with external LMS"""
    sync_type: str = Field(..., regex='^(student_roster|grades|progress)$')
    lms_provider: str
    module_id: Optional[UUID] = None
    student_ids: Optional[List[UUID]] = None


class LMSSyncResponse(BaseModel):
    """Response from LMS sync operation"""
    sync_id: UUID
    sync_type: str
    sync_status: str
    records_synced: int
    records_failed: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: str,
            datetime: lambda v: v.isoformat()
        }
