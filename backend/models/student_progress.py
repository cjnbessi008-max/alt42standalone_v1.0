"""
Student Progress Data Models
Defines data structures for tracking student learning progress and tension curves
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, validator


class LearningPhase(str, Enum):
    """Learning curve phases based on performance metrics"""
    EARLY = "early"
    GROWTH = "growth"
    PLATEAU = "plateau"
    MASTERY = "mastery"
    STRUGGLING = "struggling"


class TensionCategory(str, Enum):
    """Tension level categories"""
    LOW = "low_tension"
    MODERATE = "moderate_tension"
    HIGH = "high_tension"


class AccuracyTrend(str, Enum):
    """Accuracy trend indicators"""
    IMPROVING = "improving"
    DECLINING = "declining"
    STABLE = "stable"


class DifficultyPoint(BaseModel):
    """Data point in difficulty trajectory"""
    difficulty: int = Field(..., ge=1, le=10)
    accuracy: float = Field(..., ge=0, le=100)
    timestamp: datetime


class TensionHistoryPoint(BaseModel):
    """Historical tension data point"""
    timestamp: datetime
    tension_score: float = Field(..., ge=0, le=100)
    accuracy: float = Field(..., ge=0, le=100)
    difficulty: int = Field(..., ge=1, le=10)


class StudentAttempt(BaseModel):
    """Model for a single student attempt on a problem"""
    id: Optional[str] = None
    student_id: str
    problem_id: str
    module_id: str
    answer: Dict[str, Any]
    is_correct: bool
    time_spent_seconds: Optional[int] = None
    hints_used: int = 0
    attempt_number: int = 1
    attempted_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class StudentProgress(BaseModel):
    """Model for aggregated student progress metrics"""
    id: Optional[str] = None
    student_id: str
    module_id: str

    # Basic progress metrics
    total_attempts: int = 0
    correct_answers: int = 0
    accuracy_rate: float = Field(default=0.0, ge=0, le=100)

    # Time metrics
    total_time_spent_seconds: int = 0
    average_time_per_problem: Optional[int] = None

    # Difficulty trajectory
    current_difficulty_level: int = Field(default=1, ge=1, le=10)
    max_difficulty_reached: int = Field(default=1, ge=1, le=10)
    difficulty_trajectory: List[DifficultyPoint] = []

    # Tension curve metrics
    tension_score: Optional[float] = Field(None, ge=0, le=100)
    learning_curve_phase: Optional[LearningPhase] = None
    tension_history: List[TensionHistoryPoint] = []

    # Performance indicators
    consecutive_correct: int = 0
    consecutive_incorrect: int = 0
    problem_completion_rate: float = Field(default=0.0, ge=0, le=100)

    # Timestamps
    started_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    @validator('accuracy_rate', 'tension_score', always=True)
    def round_decimals(cls, v):
        """Round decimal values to 2 places"""
        return round(v, 2) if v is not None else v

    @property
    def tension_category(self) -> TensionCategory:
        """Categorize tension level"""
        if self.tension_score is None:
            return TensionCategory.LOW
        elif self.tension_score >= 70:
            return TensionCategory.HIGH
        elif self.tension_score >= 40:
            return TensionCategory.MODERATE
        else:
            return TensionCategory.LOW

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TensionCurveSnapshot(BaseModel):
    """Model for tension curve snapshot at a point in time"""
    id: Optional[str] = None
    student_id: str
    module_id: str

    # Snapshot metrics
    snapshot_time: datetime = Field(default_factory=datetime.utcnow)
    accuracy_rate: float = Field(..., ge=0, le=100)
    tension_score: float = Field(..., ge=0, le=100)
    difficulty_level: int = Field(..., ge=1, le=10)
    attempts_count: int
    correct_count: int

    # Trend indicators
    accuracy_trend: Optional[AccuracyTrend] = None
    tension_trend: Optional[AccuracyTrend] = None

    # Predictions (AI-generated)
    predicted_next_tension: Optional[float] = Field(None, ge=0, le=100)
    predicted_completion_time_hours: Optional[int] = None
    recommended_action: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TensionCurveData(BaseModel):
    """Complete tension curve data for visualization"""
    student_id: str
    module_id: str
    student_name: Optional[str] = None
    module_name: Optional[str] = None

    current_metrics: StudentProgress
    snapshots: List[TensionCurveSnapshot]

    # Summary statistics
    average_tension: float
    max_tension: float
    min_tension: float
    tension_volatility: float  # Standard deviation

    # Time-based analysis
    time_range_days: int
    total_study_time_hours: float

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ClassAnalytics(BaseModel):
    """Model for class-level analytics"""
    id: Optional[str] = None
    module_id: str
    teacher_id: str

    # Class-wide metrics
    total_students: int
    active_students: int
    average_accuracy: float
    average_tension_score: float

    # Distribution data
    accuracy_distribution: Dict[str, int]  # Histogram buckets
    tension_distribution: Dict[str, int]
    difficulty_distribution: Dict[str, int]

    # Problem-level insights
    hardest_problems: List[str]  # Problem IDs
    easiest_problems: List[str]
    most_time_consuming_problems: List[str]

    snapshot_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TensionCalculationParams(BaseModel):
    """Parameters for tension score calculation"""
    accuracy_rate: float = Field(..., ge=0, le=100)
    difficulty_level: int = Field(..., ge=1, le=10)
    consecutive_incorrect: int = Field(default=0, ge=0)
    average_time_ratio: float = Field(default=1.0, ge=0)  # actual/expected time

    # Weights for calculation (customizable)
    accuracy_weight: float = Field(default=0.4, ge=0, le=1)
    difficulty_weight: float = Field(default=0.3, ge=0, le=1)
    consistency_weight: float = Field(default=0.2, ge=0, le=1)
    time_weight: float = Field(default=0.1, ge=0, le=1)

    @validator('accuracy_weight', 'difficulty_weight', 'consistency_weight', 'time_weight')
    def validate_weights_sum(cls, v, values):
        """Ensure weights sum to approximately 1.0"""
        if len(values) == 3:  # All weights are set
            total = sum([values.get(k) for k in ['accuracy_weight', 'difficulty_weight', 'consistency_weight']] + [v])
            if abs(total - 1.0) > 0.01:
                raise ValueError(f"Weights must sum to 1.0, got {total}")
        return v


class TensionCurveRequest(BaseModel):
    """Request model for fetching tension curve data"""
    student_id: str
    module_id: str
    time_range_days: Optional[int] = 30  # Default to last 30 days
    include_predictions: bool = False
    include_recommendations: bool = True


class TensionCurveResponse(BaseModel):
    """Response model for tension curve API"""
    success: bool
    data: Optional[TensionCurveData] = None
    error: Optional[str] = None
    message: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
