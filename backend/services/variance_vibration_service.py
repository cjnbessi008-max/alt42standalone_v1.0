"""
Variance Vibration Service
Backend service for managing variance problems and vibration feedback
Integrates with Moodle LMS and provides API for frontend components
"""

from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum
import statistics
import math
import json
import asyncio
from fastapi import HTTPException


class VarianceType(str, Enum):
    """Type of variance calculation"""
    POPULATION = "population"
    SAMPLE = "sample"


class DifficultyLevel(str, Enum):
    """Difficulty level for variance problems"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


@dataclass
class VarianceStats:
    """Statistical calculations for a dataset"""
    mean: float
    variance: float
    standard_deviation: float
    count: int
    min_value: float
    max_value: float
    range_value: float
    variance_type: VarianceType


@dataclass
class VarianceProblem:
    """Variance problem definition"""
    id: str
    question_text: str
    question_text_ko: str
    data_set: List[float]
    is_sample: bool
    expected_variance: float
    hints: List[str]
    hints_ko: List[str]
    category: str
    difficulty: DifficultyLevel
    moodle_question_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class VibrationConfig:
    """Vibration configuration for variance feedback"""
    min_intensity: int = 1
    max_intensity: int = 10
    variance_threshold: float = 100.0
    use_normalized_variance: bool = True
    vibration_enabled: bool = True
    pattern_type: str = "progressive"  # continuous, pulsed, progressive
    debounce_ms: int = 300


@dataclass
class VarianceSubmission:
    """Student's variance problem submission"""
    id: str
    problem_id: str
    student_id: str
    submitted_answer: float
    is_correct: bool
    actual_variance: float
    percent_error: float
    vibration_intensity: int
    vibration_pattern: List[int]
    time_spent_seconds: int
    submitted_at: datetime


class VarianceCalculator:
    """Utility class for variance calculations"""

    @staticmethod
    def calculate_mean(values: List[float]) -> float:
        """Calculate the mean of values"""
        if not values:
            return 0.0
        return statistics.mean(values)

    @staticmethod
    def calculate_variance(
        values: List[float],
        variance_type: VarianceType = VarianceType.POPULATION
    ) -> float:
        """Calculate variance (population or sample)"""
        if not values:
            return 0.0
        if len(values) == 1 and variance_type == VarianceType.SAMPLE:
            return 0.0

        if variance_type == VarianceType.SAMPLE:
            return statistics.variance(values)
        else:
            return statistics.pvariance(values)

    @staticmethod
    def calculate_standard_deviation(
        values: List[float],
        variance_type: VarianceType = VarianceType.POPULATION
    ) -> float:
        """Calculate standard deviation"""
        if not values:
            return 0.0

        if variance_type == VarianceType.SAMPLE:
            return statistics.stdev(values)
        else:
            return statistics.pstdev(values)

    @staticmethod
    def calculate_stats(
        values: List[float],
        variance_type: VarianceType = VarianceType.POPULATION
    ) -> VarianceStats:
        """Calculate comprehensive variance statistics"""
        if not values:
            return VarianceStats(
                mean=0.0,
                variance=0.0,
                standard_deviation=0.0,
                count=0,
                min_value=0.0,
                max_value=0.0,
                range_value=0.0,
                variance_type=variance_type
            )

        mean = VarianceCalculator.calculate_mean(values)
        variance = VarianceCalculator.calculate_variance(values, variance_type)
        std_dev = math.sqrt(variance)
        min_val = min(values)
        max_val = max(values)

        return VarianceStats(
            mean=mean,
            variance=variance,
            standard_deviation=std_dev,
            count=len(values),
            min_value=min_val,
            max_value=max_val,
            range_value=max_val - min_val,
            variance_type=variance_type
        )

    @staticmethod
    def normalize_variance(variance: float, mean: float) -> float:
        """
        Normalize variance to 0-1 scale using coefficient of variation
        CV = σ/μ, normalized to 0-1 range (capped at CV=2.0)
        """
        if mean == 0:
            return 0.0

        cv = math.sqrt(variance) / abs(mean)
        normalized_cv = min(cv / 2.0, 1.0)

        return normalized_cv

    @staticmethod
    def validate_answer(
        submitted: float,
        expected: float,
        tolerance: float = 0.1
    ) -> tuple[bool, float]:
        """
        Validate student's answer
        Returns (is_correct, percent_error)
        """
        if expected == 0:
            return (submitted == 0, 0.0 if submitted == 0 else 100.0)

        percent_error = abs(submitted - expected) / expected
        is_correct = percent_error <= tolerance

        return (is_correct, percent_error * 100)


class VibrationMapper:
    """Maps variance values to vibration intensity and patterns"""

    @staticmethod
    def variance_to_intensity(
        variance: float,
        mean: float,
        config: VibrationConfig
    ) -> int:
        """Map variance to vibration intensity (1-10)"""
        if config.use_normalized_variance and mean != 0:
            normalized_value = VarianceCalculator.normalize_variance(variance, mean)
        else:
            normalized_value = min(variance / config.variance_threshold, 1.0)

        # Map to intensity range
        intensity_range = config.max_intensity - config.min_intensity
        intensity = config.min_intensity + normalized_value * intensity_range

        # Round and clamp
        return max(config.min_intensity, min(config.max_intensity, round(intensity)))

    @staticmethod
    def generate_vibration_pattern(
        intensity: int,
        pattern_type: str = "progressive"
    ) -> List[int]:
        """Generate vibration pattern based on intensity"""
        base_duration = 50 + intensity * 15  # 50-200ms

        if pattern_type == "continuous":
            return [base_duration * 2]

        elif pattern_type == "pulsed":
            pulse_count = math.ceil(intensity / 3)  # 1-4 pulses
            pattern = []
            for i in range(pulse_count):
                pattern.append(base_duration)
                if i < pulse_count - 1:
                    pattern.append(50)  # Gap
            return pattern

        elif pattern_type == "progressive":
            steps = min(intensity, 5)
            pattern = []
            for i in range(1, steps + 1):
                pattern.append(int(base_duration * (i / steps)))
                if i < steps:
                    pattern.append(30)  # Short gap
            return pattern

        else:
            return [base_duration]

    @staticmethod
    def get_intensity_description(intensity: int, language: str = "en") -> str:
        """Get human-readable intensity description"""
        descriptions = {
            "en": {
                1: "Very Low", 2: "Very Low",
                3: "Low", 4: "Low",
                5: "Medium", 6: "Medium",
                7: "High", 8: "High",
                9: "Very High", 10: "Very High"
            },
            "ko": {
                1: "매우 낮음", 2: "매우 낮음",
                3: "낮음", 4: "낮음",
                5: "보통", 6: "보통",
                7: "높음", 8: "높음",
                9: "매우 높음", 10: "매우 높음"
            }
        }

        return descriptions.get(language, descriptions["en"]).get(intensity, "Unknown")


class VarianceVibrationService:
    """Main service for variance vibration feature"""

    def __init__(self, db_connection=None):
        self.db = db_connection
        self.calculator = VarianceCalculator()
        self.mapper = VibrationMapper()

    async def get_problem_by_id(self, problem_id: str) -> Optional[VarianceProblem]:
        """Retrieve variance problem by ID"""
        if not self.db:
            # Return sample problem for testing
            return self._get_sample_problem(problem_id)

        # TODO: Implement database query
        query = """
            SELECT id, question_text, question_text_ko, data_set, is_sample,
                   expected_variance, hints, hints_ko, category, difficulty,
                   moodle_question_id, created_at, updated_at
            FROM variance_problems
            WHERE id = $1
        """
        # result = await self.db.fetchrow(query, problem_id)
        # return self._parse_problem(result)

        return self._get_sample_problem(problem_id)

    async def get_problems_by_category(
        self,
        category: str,
        difficulty: Optional[DifficultyLevel] = None,
        limit: int = 10
    ) -> List[VarianceProblem]:
        """Retrieve problems by category and difficulty"""
        # TODO: Implement database query
        return [self._get_sample_problem(f"{category}_{i}") for i in range(min(3, limit))]

    async def calculate_variance_stats(
        self,
        values: List[float],
        is_sample: bool = False
    ) -> VarianceStats:
        """Calculate variance statistics for a dataset"""
        variance_type = VarianceType.SAMPLE if is_sample else VarianceType.POPULATION
        return self.calculator.calculate_stats(values, variance_type)

    async def generate_vibration_config(
        self,
        values: List[float],
        is_sample: bool = False,
        config: Optional[VibrationConfig] = None
    ) -> Dict[str, Any]:
        """Generate vibration configuration for given data"""
        if config is None:
            config = VibrationConfig()

        variance_type = VarianceType.SAMPLE if is_sample else VarianceType.POPULATION
        stats = self.calculator.calculate_stats(values, variance_type)

        intensity = self.mapper.variance_to_intensity(
            stats.variance,
            stats.mean,
            config
        )

        pattern = self.mapper.generate_vibration_pattern(
            intensity,
            config.pattern_type
        )

        return {
            "stats": asdict(stats),
            "intensity": intensity,
            "vibration_pattern": pattern,
            "normalized_variance": VarianceCalculator.normalize_variance(
                stats.variance,
                stats.mean
            ),
            "intensity_description_en": self.mapper.get_intensity_description(
                intensity, "en"
            ),
            "intensity_description_ko": self.mapper.get_intensity_description(
                intensity, "ko"
            ),
            "config": asdict(config)
        }

    async def submit_answer(
        self,
        problem_id: str,
        student_id: str,
        submitted_answer: float,
        time_spent_seconds: int
    ) -> VarianceSubmission:
        """Process student's answer submission"""
        problem = await self.get_problem_by_id(problem_id)
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")

        is_correct, percent_error = self.calculator.validate_answer(
            submitted_answer,
            problem.expected_variance
        )

        # Generate vibration feedback
        vibration_config = VibrationConfig()
        stats = await self.calculate_variance_stats(
            problem.data_set,
            problem.is_sample
        )

        intensity = self.mapper.variance_to_intensity(
            stats.variance,
            stats.mean,
            vibration_config
        )

        pattern = self.mapper.generate_vibration_pattern(
            intensity,
            vibration_config.pattern_type
        )

        submission = VarianceSubmission(
            id=f"sub_{datetime.utcnow().timestamp()}",
            problem_id=problem_id,
            student_id=student_id,
            submitted_answer=submitted_answer,
            is_correct=is_correct,
            actual_variance=problem.expected_variance,
            percent_error=percent_error,
            vibration_intensity=intensity,
            vibration_pattern=pattern,
            time_spent_seconds=time_spent_seconds,
            submitted_at=datetime.utcnow()
        )

        # TODO: Save to database
        # await self._save_submission(submission)

        return submission

    def _get_sample_problem(self, problem_id: str) -> VarianceProblem:
        """Generate sample problem for testing"""
        sample_data = [10.0, 12.0, 11.0, 13.0, 12.0, 10.0, 14.0, 11.0]
        variance = self.calculator.calculate_variance(sample_data, VarianceType.SAMPLE)

        return VarianceProblem(
            id=problem_id,
            question_text="Calculate the variance of the following dataset:",
            question_text_ko="다음 데이터의 분산을 계산하세요:",
            data_set=sample_data,
            is_sample=True,
            expected_variance=variance,
            hints=[
                "First, calculate the mean of all values",
                "Then, find the squared difference from mean for each value",
                "Finally, divide by (n-1) for sample variance"
            ],
            hints_ko=[
                "먼저 모든 값의 평균을 계산하세요",
                "그런 다음 각 값에서 평균을 뺀 값의 제곱을 구하세요",
                "마지막으로 (n-1)로 나누어 표본 분산을 구하세요"
            ],
            category="basic_statistics",
            difficulty=DifficultyLevel.EASY,
            moodle_question_id=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )


# Export for API usage
__all__ = [
    'VarianceVibrationService',
    'VarianceProblem',
    'VarianceStats',
    'VibrationConfig',
    'VarianceSubmission',
    'VarianceType',
    'DifficultyLevel',
]
