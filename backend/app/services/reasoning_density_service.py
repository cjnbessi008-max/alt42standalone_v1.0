"""Service for calculating reasoning density (thinking intensity) scores."""
import numpy as np
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.models.moodle import QuizAttempt, QuestionAttempt
from app.models.analysis import ReasoningDensityScore, IntensityLevel
from app.core.config import settings

logger = logging.getLogger(__name__)


class ReasoningDensityCalculator:
    """
    Calculator for reasoning density scores.

    Reasoning density measures the cognitive intensity of a student's
    problem-solving process based on multiple factors.
    """

    def __init__(self):
        """Initialize calculator with weights from configuration."""
        self.weight_time_density = settings.WEIGHT_TIME_DENSITY
        self.weight_attempt_intensity = settings.WEIGHT_ATTEMPT_INTENSITY
        self.weight_cognitive_load = settings.WEIGHT_COGNITIVE_LOAD
        self.weight_complexity = settings.WEIGHT_COMPLEXITY
        self.weight_solution_path = settings.WEIGHT_SOLUTION_PATH

    def calculate_time_density_score(
        self,
        time_spent_seconds: int,
        expected_time_seconds: Optional[int] = None,
        difficulty_level: int = 3,
    ) -> float:
        """
        Calculate time density score based on time spent on a problem.

        Higher scores indicate more time spent (potentially deeper thinking),
        but normalized to avoid penalizing quick, correct answers.

        Args:
            time_spent_seconds: Actual time spent on the problem
            expected_time_seconds: Expected time for this difficulty level
            difficulty_level: Problem difficulty (1-5 scale)

        Returns:
            Time density score (0-100)
        """
        # Default expected times per difficulty level (in seconds)
        default_expected_times = {
            1: 60,  # Easy: 1 minute
            2: 120,  # Medium-easy: 2 minutes
            3: 180,  # Medium: 3 minutes
            4: 300,  # Hard: 5 minutes
            5: 600,  # Very hard: 10 minutes
        }

        if expected_time_seconds is None:
            expected_time_seconds = default_expected_times.get(difficulty_level, 180)

        # Avoid division by zero
        if expected_time_seconds == 0:
            expected_time_seconds = 1

        # Calculate ratio (capped at 2.0 to avoid extreme values)
        time_ratio = min(time_spent_seconds / expected_time_seconds, 2.0)

        # Convert to 0-100 scale with sigmoid-like function
        # Sweet spot is around 0.8-1.2 of expected time
        if time_ratio < 0.5:
            # Too fast - might be guessing
            score = time_ratio * 50
        elif time_ratio < 1.5:
            # Optimal range
            score = 25 + (time_ratio - 0.5) * 50
        else:
            # Taking longer - might be struggling but thinking deeply
            score = 75 + (time_ratio - 1.5) * 50

        return min(max(score, 0), 100)

    def calculate_attempt_intensity_score(
        self,
        num_attempts: int,
        is_correct: bool,
    ) -> float:
        """
        Calculate attempt intensity based on number of tries.

        Args:
            num_attempts: Number of attempts before success
            is_correct: Whether the final answer was correct

        Returns:
            Attempt intensity score (0-100)
        """
        # Base score on number of attempts
        if num_attempts == 1:
            # Got it right first time - could be luck or strong understanding
            base_score = 50 if is_correct else 20
        elif num_attempts == 2:
            # Second try success - good persistence
            base_score = 70 if is_correct else 40
        elif num_attempts <= 4:
            # Multiple attempts - high engagement
            base_score = 85 if is_correct else 60
        else:
            # Many attempts - very high persistence
            base_score = 95 if is_correct else 70

        return float(base_score)

    def calculate_cognitive_load_score(
        self,
        hint_requests: int,
        time_spent_seconds: int,
        num_attempts: int,
    ) -> float:
        """
        Calculate cognitive load based on help-seeking behavior.

        Args:
            hint_requests: Number of hints requested
            time_spent_seconds: Time spent on problem
            num_attempts: Number of attempts

        Returns:
            Cognitive load score (0-100)
        """
        # Hints indicate cognitive engagement
        hint_score = min(hint_requests * 20, 40)

        # Multiple attempts with time indicate persistence
        persistence_score = min((num_attempts - 1) * 15, 30)

        # Long time with attempts indicates deep thinking
        if time_spent_seconds > 120 and num_attempts > 1:
            depth_bonus = 30
        elif time_spent_seconds > 60:
            depth_bonus = 15
        else:
            depth_bonus = 0

        total_score = hint_score + persistence_score + depth_bonus
        return min(total_score, 100)

    def calculate_complexity_coefficient(
        self,
        question_type: str,
        difficulty_level: int = 3,
        max_mark: float = 1.0,
    ) -> float:
        """
        Calculate complexity coefficient based on question characteristics.

        Args:
            question_type: Type of question (multichoice, essay, etc.)
            difficulty_level: Difficulty level (1-5)
            max_mark: Maximum points for the question

        Returns:
            Complexity coefficient (0-100)
        """
        # Question type complexity weights
        type_complexity = {
            "truefalse": 20,
            "multichoice": 40,
            "shortanswer": 60,
            "numerical": 70,
            "calculated": 80,
            "essay": 90,
            "matching": 75,
        }

        base_complexity = type_complexity.get(question_type.lower(), 50)

        # Difficulty level multiplier (1-5 scale to 0.6-1.4 multiplier)
        difficulty_multiplier = 0.6 + (difficulty_level - 1) * 0.2

        # Mark weight multiplier (normalized)
        mark_multiplier = min(1 + (max_mark - 1) * 0.1, 1.5)

        complexity_score = base_complexity * difficulty_multiplier * mark_multiplier
        return min(complexity_score, 100)

    def calculate_solution_path_score(
        self,
        num_attempts: int,
        hint_requests: int,
        is_correct: bool,
    ) -> float:
        """
        Calculate solution path score based on problem-solving approach.

        Args:
            num_attempts: Number of attempts
            hint_requests: Number of hints used
            is_correct: Final correctness

        Returns:
            Solution path score (0-100)
        """
        # Efficient path: few attempts, few hints, correct answer
        if is_correct and num_attempts == 1 and hint_requests == 0:
            return 90.0  # Direct, efficient solution

        # Strategic path: used hints wisely, got correct answer
        if is_correct and hint_requests > 0 and num_attempts <= 2:
            return 80.0  # Strategic use of resources

        # Exploratory path: multiple attempts but eventual success
        if is_correct and num_attempts > 2:
            return 70.0  # Persistent exploration

        # Incomplete path: incorrect or incomplete
        if not is_correct:
            engagement_score = min((num_attempts + hint_requests) * 10, 60)
            return engagement_score

        # Default
        return 50.0

    def calculate_overall_score(
        self,
        time_density: float,
        attempt_intensity: float,
        cognitive_load: float,
        complexity: float,
        solution_path: float,
    ) -> float:
        """
        Calculate overall reasoning density score as weighted average.

        Args:
            time_density: Time density component score
            attempt_intensity: Attempt intensity component score
            cognitive_load: Cognitive load component score
            complexity: Complexity coefficient
            solution_path: Solution path score

        Returns:
            Overall reasoning density score (0-100)
        """
        overall = (
            time_density * self.weight_time_density
            + attempt_intensity * self.weight_attempt_intensity
            + cognitive_load * self.weight_cognitive_load
            + complexity * self.weight_complexity
            + solution_path * self.weight_solution_path
        )
        return min(max(overall, 0), 100)

    def classify_intensity(self, overall_score: float) -> IntensityLevel:
        """
        Classify reasoning density into intensity levels.

        Args:
            overall_score: Overall reasoning density score

        Returns:
            Intensity level classification
        """
        if overall_score < 40:
            return IntensityLevel.LOW
        elif overall_score < 70:
            return IntensityLevel.MEDIUM
        else:
            return IntensityLevel.HIGH

    def calculate_for_question_attempt(
        self,
        question_attempt: QuestionAttempt,
        difficulty_level: int = 3,
    ) -> Dict[str, float]:
        """
        Calculate all reasoning density scores for a question attempt.

        Args:
            question_attempt: QuestionAttempt model instance
            difficulty_level: Question difficulty level (1-5)

        Returns:
            Dictionary with all component and overall scores
        """
        time_density = self.calculate_time_density_score(
            time_spent_seconds=question_attempt.time_spent_seconds or 0,
            difficulty_level=difficulty_level,
        )

        attempt_intensity = self.calculate_attempt_intensity_score(
            num_attempts=question_attempt.num_attempts or 1,
            is_correct=question_attempt.is_correct or False,
        )

        cognitive_load = self.calculate_cognitive_load_score(
            hint_requests=question_attempt.hint_requests or 0,
            time_spent_seconds=question_attempt.time_spent_seconds or 0,
            num_attempts=question_attempt.num_attempts or 1,
        )

        complexity = self.calculate_complexity_coefficient(
            question_type=question_attempt.question_type or "multichoice",
            difficulty_level=difficulty_level,
            max_mark=float(question_attempt.max_mark or 1.0),
        )

        solution_path = self.calculate_solution_path_score(
            num_attempts=question_attempt.num_attempts or 1,
            hint_requests=question_attempt.hint_requests or 0,
            is_correct=question_attempt.is_correct or False,
        )

        overall = self.calculate_overall_score(
            time_density=time_density,
            attempt_intensity=attempt_intensity,
            cognitive_load=cognitive_load,
            complexity=complexity,
            solution_path=solution_path,
        )

        return {
            "time_density_score": round(time_density, 2),
            "attempt_intensity_score": round(attempt_intensity, 2),
            "cognitive_load_score": round(cognitive_load, 2),
            "complexity_coefficient": round(complexity, 2),
            "solution_path_score": round(solution_path, 2),
            "overall_density_score": round(overall, 2),
            "intensity_level": self.classify_intensity(overall),
        }

    def calculate_for_quiz_attempt(
        self,
        quiz_attempt: QuizAttempt,
        db: Session,
    ) -> Dict[str, Any]:
        """
        Calculate aggregate reasoning density for an entire quiz attempt.

        Args:
            quiz_attempt: QuizAttempt model instance
            db: Database session

        Returns:
            Dictionary with aggregate scores and per-question details
        """
        question_attempts = quiz_attempt.question_attempts

        if not question_attempts:
            logger.warning(
                f"No question attempts found for quiz attempt {quiz_attempt.id}"
            )
            return {}

        # Calculate for each question
        question_scores = []
        for qa in question_attempts:
            scores = self.calculate_for_question_attempt(qa)
            scores["question_id"] = qa.id
            scores["question_number"] = qa.question_number
            question_scores.append(scores)

        # Calculate aggregate metrics
        overall_scores = [q["overall_density_score"] for q in question_scores]

        aggregate = {
            "quiz_attempt_id": quiz_attempt.id,
            "student_id": quiz_attempt.student_id,
            "quiz_id": quiz_attempt.quiz_id,
            "num_questions": len(question_scores),
            "mean_density_score": round(np.mean(overall_scores), 2),
            "median_density_score": round(np.median(overall_scores), 2),
            "std_density_score": round(np.std(overall_scores), 2),
            "min_density_score": round(np.min(overall_scores), 2),
            "max_density_score": round(np.max(overall_scores), 2),
            "question_scores": question_scores,
        }

        return aggregate


def save_reasoning_density_score(
    db: Session,
    student_id: int,
    quiz_attempt_id: int,
    question_attempt_id: Optional[int],
    scores: Dict[str, Any],
) -> ReasoningDensityScore:
    """
    Save reasoning density score to database.

    Args:
        db: Database session
        student_id: Student ID
        quiz_attempt_id: Quiz attempt ID
        question_attempt_id: Question attempt ID (optional)
        scores: Dictionary of scores from calculator

    Returns:
        Created ReasoningDensityScore instance
    """
    reasoning_score = ReasoningDensityScore(
        student_id=student_id,
        quiz_attempt_id=quiz_attempt_id,
        question_attempt_id=question_attempt_id,
        time_density_score=scores.get("time_density_score"),
        attempt_intensity_score=scores.get("attempt_intensity_score"),
        cognitive_load_score=scores.get("cognitive_load_score"),
        complexity_coefficient=scores.get("complexity_coefficient"),
        solution_path_score=scores.get("solution_path_score"),
        overall_density_score=scores.get("overall_density_score"),
        intensity_level=scores.get("intensity_level"),
        calculation_method="weighted_average_v1",
        calculated_at=datetime.utcnow(),
    )

    db.add(reasoning_score)
    db.commit()
    db.refresh(reasoning_score)

    return reasoning_score


# Singleton calculator instance
_calculator: Optional[ReasoningDensityCalculator] = None


def get_reasoning_calculator() -> ReasoningDensityCalculator:
    """
    Get or create the reasoning density calculator singleton.

    Returns:
        ReasoningDensityCalculator instance
    """
    global _calculator
    if _calculator is None:
        _calculator = ReasoningDensityCalculator()
    return _calculator
