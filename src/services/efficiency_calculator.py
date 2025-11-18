"""
Thought Efficiency Score (TES) Calculator Service

This module implements the core TES calculation algorithm as specified in:
docs/efficiency-score-model.md

Dependencies:
    - numpy: For statistical calculations
    - sqlalchemy: For database queries
    - pydantic: For data validation

Author: AI Education System Team
Date: 2025-11-18
Version: 1.0
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from uuid import UUID

import numpy as np
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models.efficiency import EfficiencyScore, EfficiencyScoreHistory
from ..models.student import Student, StudentAttempt
from ..models.module import Module


class EfficiencyCalculator:
    """
    Calculates Thought Efficiency Score (TES) for students.

    The TES is a weighted composite of four components:
    - Correctness (40%): Percentage of correct answers
    - Speed (30%): Time efficiency relative to cohort
    - First-Try Success (20%): Percentage of first-attempt correct answers
    - Consistency (10%): Standard deviation of performance across problem types
    """

    # Component weights
    WEIGHT_CORRECTNESS = 0.40
    WEIGHT_SPEED = 0.30
    WEIGHT_FIRST_TRY = 0.20
    WEIGHT_CONSISTENCY = 0.10

    # Configuration
    MIN_ATTEMPTS_REQUIRED = 10
    MIN_TIME_THRESHOLD_SECONDS = 5  # Prevent gaming by fast random clicking
    CACHE_TTL_MINUTES = 30  # Don't recalculate more often than this

    def __init__(self, db: Session):
        """
        Initialize calculator with database session.

        Args:
            db: SQLAlchemy database session
        """
        self.db = db

    def calculate_tes(
        self,
        student_id: UUID,
        module_id: UUID,
        force_recalc: bool = False
    ) -> Dict:
        """
        Calculate TES score for a student in a module.

        Args:
            student_id: Student UUID
            module_id: Module UUID
            force_recalc: If True, recalculate even if cached

        Returns:
            Dict containing TES score and all component breakdowns

        Raises:
            InsufficientDataError: If student has < 10 attempts
            NotFoundError: If student or module doesn't exist
        """
        # Check if we can use cached score
        if not force_recalc:
            cached = self._get_cached_score(student_id, module_id)
            if cached:
                return cached

        # Fetch student attempts
        attempts = self._fetch_attempts(student_id, module_id)

        if len(attempts) < self.MIN_ATTEMPTS_REQUIRED:
            raise InsufficientDataError(
                f"Student has only {len(attempts)} attempts. "
                f"Minimum {self.MIN_ATTEMPTS_REQUIRED} required."
            )

        # Calculate each component
        correctness_score = self._calculate_correctness(attempts)
        speed_score = self._calculate_speed(student_id, module_id, attempts)
        first_try_score = self._calculate_first_try_success(attempts)
        consistency_score = self._calculate_consistency(attempts)

        # Calculate weighted TES
        tes_score = (
            correctness_score * self.WEIGHT_CORRECTNESS +
            speed_score * self.WEIGHT_SPEED +
            first_try_score * self.WEIGHT_FIRST_TRY +
            consistency_score * self.WEIGHT_CONSISTENCY
        )

        # Get cohort context
        cohort_stats = self._get_cohort_stats(module_id)

        # Determine percentile rank
        percentile = self._calculate_percentile(module_id, tes_score)

        # Assign letter grade
        grade = self._assign_grade(tes_score)

        # Build result
        result = {
            "tes_score": round(tes_score, 2),
            "tes_percentile": percentile,
            "tes_grade": grade,
            "components": {
                "correctness": {
                    "score": round(correctness_score, 2),
                    "weight": self.WEIGHT_CORRECTNESS,
                    "contribution": round(correctness_score * self.WEIGHT_CORRECTNESS, 2)
                },
                "speed": {
                    "score": round(speed_score, 2),
                    "weight": self.WEIGHT_SPEED,
                    "contribution": round(speed_score * self.WEIGHT_SPEED, 2)
                },
                "first_try_success": {
                    "score": round(first_try_score, 2),
                    "weight": self.WEIGHT_FIRST_TRY,
                    "contribution": round(first_try_score * self.WEIGHT_FIRST_TRY, 2)
                },
                "consistency": {
                    "score": round(consistency_score, 2),
                    "weight": self.WEIGHT_CONSISTENCY,
                    "contribution": round(consistency_score * self.WEIGHT_CONSISTENCY, 2)
                }
            },
            "raw_metrics": self._extract_raw_metrics(attempts),
            "problem_type_scores": self._calculate_problem_type_scores(attempts),
            "cohort_context": {
                "cohort_avg_tes": cohort_stats.get("avg_tes"),
                "cohort_median_tes": cohort_stats.get("median_tes"),
                "student_percentile": percentile
            },
            "sufficient_data": True,
            "calculated_at": datetime.utcnow().isoformat() + "Z",
            "next_update_eligible_at": (
                datetime.utcnow() + timedelta(minutes=self.CACHE_TTL_MINUTES)
            ).isoformat() + "Z"
        }

        # Persist to database
        self._save_score(student_id, module_id, result)

        return result

    def _fetch_attempts(self, student_id: UUID, module_id: UUID) -> List[StudentAttempt]:
        """
        Fetch all attempts for a student in a module.

        Args:
            student_id: Student UUID
            module_id: Module UUID

        Returns:
            List of StudentAttempt objects
        """
        query = select(StudentAttempt).where(
            StudentAttempt.student_id == student_id,
            StudentAttempt.module_id == module_id,
            StudentAttempt.time_spent_seconds >= self.MIN_TIME_THRESHOLD_SECONDS
        ).order_by(StudentAttempt.attempted_at)

        return self.db.execute(query).scalars().all()

    def _calculate_correctness(self, attempts: List[StudentAttempt]) -> float:
        """
        Calculate correctness score (0-100).

        Formula: (Correct Attempts / Total Attempts) × 100

        Args:
            attempts: List of student attempts

        Returns:
            Correctness score (0-100)
        """
        if not attempts:
            return 0.0

        correct_count = sum(1 for a in attempts if a.is_correct)
        total_count = len(attempts)

        return (correct_count / total_count) * 100

    def _calculate_speed(
        self,
        student_id: UUID,
        module_id: UUID,
        attempts: List[StudentAttempt]
    ) -> float:
        """
        Calculate speed score (0-100) relative to cohort.

        Formula: min(100, (Cohort_Median_Time / Student_Avg_Time) × 100)

        Args:
            student_id: Student UUID
            module_id: Module UUID
            attempts: List of student attempts

        Returns:
            Speed score (0-100)
        """
        if not attempts:
            return 0.0

        # Calculate student's average time
        total_time = sum(a.time_spent_seconds for a in attempts)
        student_avg_time = total_time / len(attempts)

        # Get cohort median time
        cohort_median_time = self._get_cohort_median_time(module_id)

        if cohort_median_time == 0 or student_avg_time == 0:
            return 50.0  # Default score if no cohort data

        # Calculate speed score
        speed_raw = cohort_median_time / student_avg_time
        speed_score = min(100, speed_raw * 100)

        return speed_score

    def _calculate_first_try_success(self, attempts: List[StudentAttempt]) -> float:
        """
        Calculate first-try success rate (0-100).

        Formula: (First_Attempt_Correct / Total_Problems) × 100

        Args:
            attempts: List of student attempts

        Returns:
            First-try success score (0-100)
        """
        if not attempts:
            return 0.0

        # Group attempts by problem_id to identify first attempts
        problem_attempts = {}
        for attempt in attempts:
            problem_id = attempt.problem_id
            if problem_id not in problem_attempts:
                problem_attempts[problem_id] = []
            problem_attempts[problem_id].append(attempt)

        # Count first-try correct
        first_try_correct = 0
        total_problems = len(problem_attempts)

        for problem_id, attempts_list in problem_attempts.items():
            # Sort by attempt time to find first attempt
            attempts_list.sort(key=lambda a: a.attempted_at)
            first_attempt = attempts_list[0]

            if first_attempt.is_correct:
                first_try_correct += 1

        return (first_try_correct / total_problems) * 100

    def _calculate_consistency(self, attempts: List[StudentAttempt]) -> float:
        """
        Calculate consistency score (0-100) based on performance variance.

        Formula: max(0, 100 - (Std_Dev_of_Problem_Types × 2))

        Args:
            attempts: List of student attempts

        Returns:
            Consistency score (0-100)
        """
        problem_type_scores = self._calculate_problem_type_scores(attempts)

        if not problem_type_scores or len(problem_type_scores) < 2:
            return 100.0  # Perfect consistency if only one type

        scores = list(problem_type_scores.values())
        std_dev = np.std(scores)

        # Penalize high variance
        consistency_score = max(0, 100 - (std_dev * 2))

        return consistency_score

    def _calculate_problem_type_scores(
        self,
        attempts: List[StudentAttempt]
    ) -> Dict[str, float]:
        """
        Calculate correctness score for each problem type.

        Args:
            attempts: List of student attempts

        Returns:
            Dict mapping problem_type to correctness percentage
        """
        type_attempts = {}

        for attempt in attempts:
            ptype = attempt.problem_type
            if ptype not in type_attempts:
                type_attempts[ptype] = {"correct": 0, "total": 0}

            type_attempts[ptype]["total"] += 1
            if attempt.is_correct:
                type_attempts[ptype]["correct"] += 1

        # Calculate percentages
        type_scores = {}
        for ptype, counts in type_attempts.items():
            type_scores[ptype] = (counts["correct"] / counts["total"]) * 100

        return type_scores

    def _get_cohort_median_time(self, module_id: UUID) -> float:
        """
        Get median time per problem for all students in module.

        Args:
            module_id: Module UUID

        Returns:
            Median time in seconds
        """
        # Query all attempts for this module
        query = select(StudentAttempt.time_spent_seconds).where(
            StudentAttempt.module_id == module_id,
            StudentAttempt.time_spent_seconds >= self.MIN_TIME_THRESHOLD_SECONDS
        )

        times = [row[0] for row in self.db.execute(query).all()]

        if not times:
            return 90.0  # Default: 90 seconds

        return float(np.median(times))

    def _get_cohort_stats(self, module_id: UUID) -> Dict:
        """
        Get cohort-level statistics for a module.

        Args:
            module_id: Module UUID

        Returns:
            Dict with avg_tes, median_tes, etc.
        """
        query = select(
            func.avg(EfficiencyScore.tes_score).label("avg_tes"),
            func.percentile_cont(0.5).within_group(
                EfficiencyScore.tes_score
            ).label("median_tes")
        ).where(
            EfficiencyScore.module_id == module_id,
            EfficiencyScore.sufficient_data == True
        )

        result = self.db.execute(query).first()

        if not result or result.avg_tes is None:
            return {"avg_tes": None, "median_tes": None}

        return {
            "avg_tes": round(float(result.avg_tes), 2),
            "median_tes": round(float(result.median_tes), 2)
        }

    def _calculate_percentile(self, module_id: UUID, tes_score: float) -> int:
        """
        Calculate percentile rank of TES within module cohort.

        Args:
            module_id: Module UUID
            tes_score: Student's TES score

        Returns:
            Percentile (0-100)
        """
        # Count students with lower scores
        query = select(func.count()).select_from(EfficiencyScore).where(
            EfficiencyScore.module_id == module_id,
            EfficiencyScore.tes_score < tes_score,
            EfficiencyScore.sufficient_data == True
        )

        lower_count = self.db.execute(query).scalar() or 0

        # Count total students
        total_query = select(func.count()).select_from(EfficiencyScore).where(
            EfficiencyScore.module_id == module_id,
            EfficiencyScore.sufficient_data == True
        )

        total_count = self.db.execute(total_query).scalar() or 1

        percentile = int((lower_count / total_count) * 100)

        return percentile

    def _assign_grade(self, tes_score: float) -> str:
        """
        Assign letter grade based on TES score.

        Args:
            tes_score: TES score (0-100)

        Returns:
            Letter grade ('A', 'B', 'C', 'D', 'F')
        """
        if tes_score >= 90:
            return "A"
        elif tes_score >= 80:
            return "B"
        elif tes_score >= 70:
            return "C"
        elif tes_score >= 60:
            return "D"
        else:
            return "F"

    def _extract_raw_metrics(self, attempts: List[StudentAttempt]) -> Dict:
        """
        Extract raw metrics from attempts.

        Args:
            attempts: List of student attempts

        Returns:
            Dict with total_attempts, correct_attempts, etc.
        """
        # Count unique problems
        unique_problems = set(a.problem_id for a in attempts)

        # Count first-try correct
        problem_attempts = {}
        for attempt in attempts:
            if attempt.problem_id not in problem_attempts:
                problem_attempts[attempt.problem_id] = []
            problem_attempts[attempt.problem_id].append(attempt)

        first_try_correct = 0
        for problem_id, attempts_list in problem_attempts.items():
            attempts_list.sort(key=lambda a: a.attempted_at)
            if attempts_list[0].is_correct:
                first_try_correct += 1

        # Calculate average time
        total_time = sum(a.time_spent_seconds for a in attempts)
        avg_time = total_time / len(attempts) if attempts else 0

        return {
            "total_attempts": len(attempts),
            "correct_attempts": sum(1 for a in attempts if a.is_correct),
            "total_problems": len(unique_problems),
            "first_try_correct": first_try_correct,
            "avg_time_seconds": round(avg_time, 2)
        }

    def _get_cached_score(
        self,
        student_id: UUID,
        module_id: UUID
    ) -> Optional[Dict]:
        """
        Check if we have a recent cached TES score.

        Args:
            student_id: Student UUID
            module_id: Module UUID

        Returns:
            Cached score dict or None
        """
        cutoff_time = datetime.utcnow() - timedelta(minutes=self.CACHE_TTL_MINUTES)

        query = select(EfficiencyScore).where(
            EfficiencyScore.student_id == student_id,
            EfficiencyScore.module_id == module_id,
            EfficiencyScore.calculated_at >= cutoff_time
        )

        cached = self.db.execute(query).scalar_one_or_none()

        if not cached:
            return None

        # Convert to dict format matching calculate_tes return
        return {
            "tes_score": float(cached.tes_score),
            "tes_percentile": cached.tes_percentile,
            "tes_grade": cached.tes_grade,
            "components": {
                "correctness": {
                    "score": float(cached.correctness_score),
                    "weight": self.WEIGHT_CORRECTNESS,
                    "contribution": float(cached.correctness_score * self.WEIGHT_CORRECTNESS)
                },
                "speed": {
                    "score": float(cached.speed_score),
                    "weight": self.WEIGHT_SPEED,
                    "contribution": float(cached.speed_score * self.WEIGHT_SPEED)
                },
                "first_try_success": {
                    "score": float(cached.first_try_score),
                    "weight": self.WEIGHT_FIRST_TRY,
                    "contribution": float(cached.first_try_score * self.WEIGHT_FIRST_TRY)
                },
                "consistency": {
                    "score": float(cached.consistency_score),
                    "weight": self.WEIGHT_CONSISTENCY,
                    "contribution": float(cached.consistency_score * self.WEIGHT_CONSISTENCY)
                }
            },
            "raw_metrics": {
                "total_attempts": cached.total_attempts,
                "correct_attempts": cached.correct_attempts,
                "total_problems": cached.total_problems,
                "first_try_correct": cached.first_try_correct,
                "avg_time_seconds": float(cached.avg_time_seconds)
            },
            "problem_type_scores": cached.problem_type_scores,
            "cohort_context": {
                "cohort_avg_tes": float(cached.cohort_avg_tes) if cached.cohort_avg_tes else None,
                "student_percentile": cached.tes_percentile
            },
            "sufficient_data": cached.sufficient_data,
            "calculated_at": cached.calculated_at.isoformat() + "Z",
            "next_update_eligible_at": (
                cached.calculated_at + timedelta(minutes=self.CACHE_TTL_MINUTES)
            ).isoformat() + "Z"
        }

    def _save_score(self, student_id: UUID, module_id: UUID, result: Dict) -> None:
        """
        Save TES score to database.

        Args:
            student_id: Student UUID
            module_id: Module UUID
            result: TES calculation result dict
        """
        # Check if record exists
        query = select(EfficiencyScore).where(
            EfficiencyScore.student_id == student_id,
            EfficiencyScore.module_id == module_id
        )

        existing = self.db.execute(query).scalar_one_or_none()

        if existing:
            # Update existing record
            existing.tes_score = result["tes_score"]
            existing.tes_percentile = result["tes_percentile"]
            existing.tes_grade = result["tes_grade"]
            existing.correctness_score = result["components"]["correctness"]["score"]
            existing.speed_score = result["components"]["speed"]["score"]
            existing.first_try_score = result["components"]["first_try_success"]["score"]
            existing.consistency_score = result["components"]["consistency"]["score"]
            existing.total_attempts = result["raw_metrics"]["total_attempts"]
            existing.correct_attempts = result["raw_metrics"]["correct_attempts"]
            existing.total_problems = result["raw_metrics"]["total_problems"]
            existing.first_try_correct = result["raw_metrics"]["first_try_correct"]
            existing.avg_time_seconds = result["raw_metrics"]["avg_time_seconds"]
            existing.problem_type_scores = result["problem_type_scores"]
            existing.cohort_avg_tes = result["cohort_context"]["cohort_avg_tes"]
            existing.sufficient_data = result["sufficient_data"]
            existing.calculated_at = datetime.utcnow()
            existing.updated_at = datetime.utcnow()

            # Save snapshot to history
            self._save_history_snapshot(existing)
        else:
            # Create new record
            new_score = EfficiencyScore(
                student_id=student_id,
                module_id=module_id,
                tes_score=result["tes_score"],
                tes_percentile=result["tes_percentile"],
                tes_grade=result["tes_grade"],
                correctness_score=result["components"]["correctness"]["score"],
                speed_score=result["components"]["speed"]["score"],
                first_try_score=result["components"]["first_try_success"]["score"],
                consistency_score=result["components"]["consistency"]["score"],
                total_attempts=result["raw_metrics"]["total_attempts"],
                correct_attempts=result["raw_metrics"]["correct_attempts"],
                total_problems=result["raw_metrics"]["total_problems"],
                first_try_correct=result["raw_metrics"]["first_try_correct"],
                avg_time_seconds=result["raw_metrics"]["avg_time_seconds"],
                problem_type_scores=result["problem_type_scores"],
                cohort_avg_tes=result["cohort_context"]["cohort_avg_tes"],
                sufficient_data=result["sufficient_data"],
                calculated_at=datetime.utcnow()
            )
            self.db.add(new_score)
            self.db.flush()  # Get the ID

            # Save initial history snapshot
            self._save_history_snapshot(new_score)

        self.db.commit()

    def _save_history_snapshot(self, score: EfficiencyScore) -> None:
        """
        Save a historical snapshot of TES score.

        Args:
            score: EfficiencyScore object
        """
        today = datetime.utcnow().date()

        # Check if we already have a snapshot for today
        query = select(EfficiencyScoreHistory).where(
            EfficiencyScoreHistory.efficiency_score_id == score.id,
            EfficiencyScoreHistory.snapshot_date == today
        )

        existing_snapshot = self.db.execute(query).scalar_one_or_none()

        if existing_snapshot:
            # Update existing snapshot
            existing_snapshot.tes_score = score.tes_score
            existing_snapshot.correctness_score = score.correctness_score
            existing_snapshot.speed_score = score.speed_score
            existing_snapshot.first_try_score = score.first_try_score
            existing_snapshot.consistency_score = score.consistency_score
            existing_snapshot.total_attempts_at_snapshot = score.total_attempts
        else:
            # Create new snapshot
            snapshot = EfficiencyScoreHistory(
                efficiency_score_id=score.id,
                student_id=score.student_id,
                module_id=score.module_id,
                tes_score=score.tes_score,
                correctness_score=score.correctness_score,
                speed_score=score.speed_score,
                first_try_score=score.first_try_score,
                consistency_score=score.consistency_score,
                total_attempts_at_snapshot=score.total_attempts,
                snapshot_date=today
            )
            self.db.add(snapshot)


class InsufficientDataError(Exception):
    """Raised when student has insufficient attempts for TES calculation."""
    pass
