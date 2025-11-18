"""
Data models for reading analytics and comprehension summary feature
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

class InterventionFlag(str, Enum):
    NONE = "none"
    MONITOR = "monitor"
    IMMEDIATE = "immediate"


class ReadingDifficultyMatch(str, Enum):
    TOO_EASY = "too_easy"
    APPROPRIATE = "appropriate"
    TOO_HARD = "too_hard"


class Trend(str, Enum):
    IMPROVING = "improving"
    DECLINING = "declining"
    STABLE = "stable"


class SummaryPeriod(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ON_DEMAND = "on_demand"


class DeviceType(str, Enum):
    DESKTOP = "desktop"
    MOBILE = "mobile"
    TABLET = "tablet"


class SummaryStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


# ============================================================================
# Request Models
# ============================================================================

class ReadingAnalyticsCreate(BaseModel):
    """Request model for creating a new reading analytics record"""
    student_id: str
    problem_id: str
    module_id: str
    session_id: Optional[str] = None

    # Reading metrics
    reading_start_time: datetime
    reading_end_time: Optional[datetime] = None
    reading_time_seconds: Optional[int] = None
    active_reading_time_seconds: Optional[int] = None

    # Reading speed
    problem_word_count: int
    reading_speed_wpm: Optional[float] = None
    baseline_wpm: Optional[float] = None

    # Comprehension indicators
    first_attempt_correct: Optional[bool] = None
    total_attempts: int = 1
    final_answer_correct: Optional[bool] = None
    time_to_first_attempt: Optional[int] = None

    # Behavioral metrics
    re_reading_count: int = 0
    problem_abandoned: bool = False
    hints_used: int = 0

    # Context
    device_type: Optional[DeviceType] = DeviceType.DESKTOP
    language: str = "ko"
    problem_difficulty: Optional[int] = None
    grade_level: Optional[int] = None


class ComprehensionSummaryRequest(BaseModel):
    """Request model for generating comprehension summary"""
    student_id: str
    module_id: str
    summary_period: SummaryPeriod
    period_start: datetime
    period_end: datetime
    force_regenerate: bool = False  # Bypass cache


class LMSIntegrationRequest(BaseModel):
    """Request model for LMS data integration"""
    lms_type: str  # 'moodle', 'canvas', 'blackboard', 'kaist_custom'
    integration_event: str
    data: Dict[str, Any]


# ============================================================================
# Response Models
# ============================================================================

class ReadingAnalyticsResponse(BaseModel):
    """Response model for reading analytics"""
    id: int
    student_id: str
    problem_id: str
    module_id: str

    reading_time_seconds: Optional[int]
    reading_speed_wpm: Optional[float]
    comprehension_score: Optional[float]
    intervention_flag: Optional[InterventionFlag]
    reading_difficulty_match: Optional[ReadingDifficultyMatch]

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ComprehensionScoreBreakdown(BaseModel):
    """Detailed breakdown of comprehension score calculation"""
    reading_accuracy: float  # Based on attempts
    speed_efficiency: float  # Actual vs baseline
    first_attempt_success: float  # Bonus for correct first try
    final_score: float  # Weighted average


class ComprehensionSummaryResponse(BaseModel):
    """Response model for comprehension summary"""
    id: int
    student_id: str
    module_id: str
    summary_period: SummaryPeriod

    # Metrics
    total_problems_attempted: int
    avg_reading_time_seconds: int
    avg_reading_speed_wpm: float
    avg_comprehension_score: float
    first_attempt_success_rate: float

    # Trends
    reading_speed_trend: Optional[Trend]
    comprehension_trend: Optional[Trend]

    # AI-generated content
    ai_summary: str
    ai_recommendations: str
    ai_strengths: str
    ai_challenges: str

    # Student feedback
    student_message: str
    student_tips: str

    # Status
    teacher_action_needed: bool
    summary_status: SummaryStatus

    created_at: datetime

    class Config:
        from_attributes = True


class InterventionAlert(BaseModel):
    """Alert model for students needing intervention"""
    student_id: str
    module_id: str
    problem_id: str
    intervention_flag: InterventionFlag
    comprehension_score: float
    reading_speed_wpm: float
    message: str
    suggested_actions: List[str]
    created_at: datetime


class ClassComprehensionOverview(BaseModel):
    """Overview of class comprehension metrics"""
    module_id: str
    total_students: int
    avg_comprehension: float
    avg_reading_speed: float
    students_needing_help: int
    first_attempt_success_rate: float


# ============================================================================
# Calculation Models
# ============================================================================

class ReadingBaseline(BaseModel):
    """Reading speed baselines by grade level"""
    grade_level: int
    target_wpm: float
    min_wpm: float
    max_wpm: float
    language: str = "ko"

    @staticmethod
    def get_baseline(grade_level: int, language: str = "ko") -> "ReadingBaseline":
        """Get baseline reading speed for grade level"""
        # Korean reading baselines
        korean_baselines = {
            3: ReadingBaseline(grade_level=3, target_wpm=100, min_wpm=80, max_wpm=140, language="ko"),
            4: ReadingBaseline(grade_level=4, target_wpm=110, min_wpm=90, max_wpm=150, language="ko"),
            5: ReadingBaseline(grade_level=5, target_wpm=130, min_wpm=110, max_wpm=170, language="ko"),
            6: ReadingBaseline(grade_level=6, target_wpm=140, min_wpm=120, max_wpm=180, language="ko"),
            7: ReadingBaseline(grade_level=7, target_wpm=160, min_wpm=140, max_wpm=200, language="ko"),
            8: ReadingBaseline(grade_level=8, target_wpm=170, min_wpm=150, max_wpm=210, language="ko"),
        }

        # English reading baselines
        english_baselines = {
            3: ReadingBaseline(grade_level=3, target_wpm=130, min_wpm=110, max_wpm=160, language="en"),
            4: ReadingBaseline(grade_level=4, target_wpm=140, min_wpm=120, max_wpm=170, language="en"),
            5: ReadingBaseline(grade_level=5, target_wpm=160, min_wpm=140, max_wpm=190, language="en"),
            6: ReadingBaseline(grade_level=6, target_wpm=170, min_wpm=150, max_wpm=200, language="en"),
            7: ReadingBaseline(grade_level=7, target_wpm=190, min_wpm=170, max_wpm=220, language="en"),
            8: ReadingBaseline(grade_level=8, target_wpm=200, min_wpm=180, max_wpm=230, language="en"),
        }

        baselines = korean_baselines if language == "ko" else english_baselines
        return baselines.get(grade_level, baselines[5])  # Default to grade 5


class ComprehensionCalculator:
    """Calculate comprehension scores based on multi-factor algorithm"""

    @staticmethod
    def calculate_reading_accuracy(first_attempt_correct: bool, total_attempts: int) -> float:
        """Calculate reading accuracy score (0-100)"""
        if first_attempt_correct:
            return 100.0
        else:
            # Penalize based on number of attempts
            penalty = min((total_attempts - 1) * 10, 50)
            return max(50.0 - penalty, 0.0)

    @staticmethod
    def calculate_speed_efficiency(actual_wpm: float, baseline_wpm: float) -> float:
        """Calculate speed efficiency score (0-100)"""
        if baseline_wpm == 0:
            return 50.0

        efficiency = (actual_wpm / baseline_wpm) * 100
        # Cap at 100 (reading faster than baseline is good but not extra credit)
        return min(efficiency, 100.0)

    @staticmethod
    def calculate_first_attempt_bonus(first_attempt_correct: bool) -> float:
        """Binary bonus for first attempt success"""
        return 100.0 if first_attempt_correct else 0.0

    @staticmethod
    def calculate_comprehension_score(
        first_attempt_correct: bool,
        total_attempts: int,
        actual_wpm: float,
        baseline_wpm: float,
        weights: Optional[Dict[str, float]] = None
    ) -> ComprehensionScoreBreakdown:
        """
        Calculate comprehensive comprehension score

        Default weights:
        - reading_accuracy: 0.3
        - speed_efficiency: 0.4
        - first_attempt_success: 0.3
        """
        if weights is None:
            weights = {
                "reading_accuracy": 0.3,
                "speed_efficiency": 0.4,
                "first_attempt_success": 0.3
            }

        reading_accuracy = ComprehensionCalculator.calculate_reading_accuracy(
            first_attempt_correct, total_attempts
        )
        speed_efficiency = ComprehensionCalculator.calculate_speed_efficiency(
            actual_wpm, baseline_wpm
        )
        first_attempt_success = ComprehensionCalculator.calculate_first_attempt_bonus(
            first_attempt_correct
        )

        final_score = (
            weights["reading_accuracy"] * reading_accuracy +
            weights["speed_efficiency"] * speed_efficiency +
            weights["first_attempt_success"] * first_attempt_success
        )

        return ComprehensionScoreBreakdown(
            reading_accuracy=reading_accuracy,
            speed_efficiency=speed_efficiency,
            first_attempt_success=first_attempt_success,
            final_score=round(final_score, 2)
        )

    @staticmethod
    def determine_intervention_flag(
        comprehension_score: float,
        reading_speed_wpm: float,
        baseline_wpm: float,
        recent_scores: List[float]
    ) -> InterventionFlag:
        """Determine if student needs intervention"""

        # Immediate intervention triggers
        if comprehension_score < 40:
            return InterventionFlag.IMMEDIATE

        if reading_speed_wpm > baseline_wpm * 3:  # Reading too fast (not processing)
            return InterventionFlag.IMMEDIATE

        if reading_speed_wpm < baseline_wpm * 0.5:  # Reading too slow (severe struggle)
            return InterventionFlag.IMMEDIATE

        # Check for consistent low performance
        if len(recent_scores) >= 3:
            if all(score < 40 for score in recent_scores[-3:]):
                return InterventionFlag.IMMEDIATE

        # Monitor intervention triggers
        if 40 <= comprehension_score < 60:
            return InterventionFlag.MONITOR

        # Check for declining trend
        if len(recent_scores) >= 3:
            if all(recent_scores[i] > recent_scores[i+1] for i in range(len(recent_scores)-1)):
                return InterventionFlag.MONITOR

        return InterventionFlag.NONE

    @staticmethod
    def determine_difficulty_match(
        comprehension_score: float,
        reading_speed_wpm: float,
        baseline_wpm: float
    ) -> ReadingDifficultyMatch:
        """Determine if problem difficulty matches student level"""

        # Too easy: high score, fast speed
        if comprehension_score >= 85 and reading_speed_wpm >= baseline_wpm * 1.2:
            return ReadingDifficultyMatch.TOO_EASY

        # Too hard: low score, slow speed
        if comprehension_score < 50 and reading_speed_wpm < baseline_wpm * 0.7:
            return ReadingDifficultyMatch.TOO_HARD

        # Appropriate difficulty
        return ReadingDifficultyMatch.APPROPRIATE
