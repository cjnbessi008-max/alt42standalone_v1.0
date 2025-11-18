"""
Efficiency Score (TES) schemas.
"""
from pydantic import BaseModel, UUID4
from datetime import datetime
from typing import Optional, Dict


class TESCalculationRequest(BaseModel):
    """Request to calculate TES."""
    student_id: UUID4
    module_id: UUID4
    force_recalc: bool = False


class TESComponentScore(BaseModel):
    """Individual TES component."""
    score: float
    weight: float
    contribution: float


class TESRawMetrics(BaseModel):
    """Raw metrics for TES calculation."""
    total_attempts: int
    correct_attempts: int
    total_problems: int
    first_try_correct: int
    avg_time_seconds: float


class TESCohortContext(BaseModel):
    """Cohort context for TES."""
    cohort_id: Optional[str] = None
    cohort_avg_tes: Optional[float] = None
    cohort_median_tes: Optional[float] = None
    student_percentile: Optional[int] = None


class TESCalculationResponse(BaseModel):
    """Complete TES calculation result."""
    tes_score: float
    tes_percentile: Optional[int]
    tes_grade: str
    components: Dict[str, TESComponentScore]
    raw_metrics: TESRawMetrics
    problem_type_scores: Dict[str, float]
    cohort_context: TESCohortContext
    sufficient_data: bool
    calculated_at: str
    next_update_eligible_at: str


class EfficiencyScoreResponse(BaseModel):
    """Efficiency score database record."""
    id: UUID4
    student_id: UUID4
    module_id: UUID4
    tes_score: float
    tes_percentile: Optional[int]
    tes_grade: str
    correctness_score: float
    speed_score: float
    first_try_score: float
    consistency_score: float
    total_attempts: int
    sufficient_data: bool
    calculated_at: datetime

    class Config:
        from_attributes = True
