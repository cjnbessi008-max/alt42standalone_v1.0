"""
Confidence Builder Service

This service manages student confidence levels and recommends easy problems
to help students recover their confidence in learning.

Key features:
- Track student confidence scores (0-100)
- Select appropriate easy problems based on confidence level
- Update confidence scores based on student performance
- Provide adaptive problem difficulty
"""

from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, date
import random


@dataclass
class ConfidenceScore:
    """Student's confidence score for a module"""
    student_id: str
    module_id: str
    current_score: float  # 0-100
    mastery_count: int
    consecutive_correct: int
    last_problem_difficulty: int
    last_updated: datetime


@dataclass
class EasyProblem:
    """Easy problem for confidence building"""
    problem_id: str
    module_id: str
    problem_table_name: str
    difficulty_level: int  # 1-3 for easy problems
    confidence_boost: float
    problem_data: Dict
    success_rate: Optional[float] = None


@dataclass
class AttemptResult:
    """Result of a student's problem attempt"""
    student_id: str
    module_id: str
    problem_id: str
    is_correct: bool
    time_spent_seconds: int
    hint_used: bool
    difficulty_level: int


class ConfidenceBuilderService:
    """
    Service for managing student confidence through easy problem selection
    """

    # Confidence thresholds
    LOW_CONFIDENCE_THRESHOLD = 40.0
    MEDIUM_CONFIDENCE_THRESHOLD = 70.0

    # Difficulty adjustments
    DIFFICULTY_LEVELS = {
        'very_low': 1,   # For confidence < 30
        'low': 1,        # For confidence 30-50
        'medium': 2,     # For confidence 50-70
        'high': 3        # For confidence > 70
    }

    # Confidence boost/penalty amounts
    CORRECT_BOOST_BASE = 5.0      # Base boost for correct answer
    INCORRECT_PENALTY = -3.0       # Penalty for incorrect answer
    STREAK_BONUS = 2.0             # Additional boost per consecutive correct
    HINT_PENALTY = -1.0            # Penalty for using a hint
    TIME_BONUS_THRESHOLD = 30      # Seconds - fast answers get bonus
    TIME_BONUS = 2.0

    def __init__(self, db_connection):
        """
        Initialize the confidence builder service

        Args:
            db_connection: Database connection object
        """
        self.db = db_connection

    def get_confidence_score(self, student_id: str, module_id: str) -> ConfidenceScore:
        """
        Get current confidence score for a student in a module

        Args:
            student_id: Student UUID
            module_id: Module UUID

        Returns:
            ConfidenceScore object
        """
        query = """
            SELECT student_id, module_id, current_confidence_score,
                   mastery_count, consecutive_correct, last_problem_difficulty,
                   last_updated_at
            FROM confidence_levels
            WHERE student_id = %s AND module_id = %s
        """

        result = self.db.execute_one(query, (student_id, module_id))

        if not result:
            # Initialize confidence if not exists
            self._initialize_confidence(student_id, module_id)
            result = self.db.execute_one(query, (student_id, module_id))

        return ConfidenceScore(
            student_id=result['student_id'],
            module_id=result['module_id'],
            current_score=float(result['current_confidence_score']),
            mastery_count=result['mastery_count'],
            consecutive_correct=result['consecutive_correct'],
            last_problem_difficulty=result['last_problem_difficulty'],
            last_updated=result['last_updated_at']
        )

    def get_recommended_difficulty(self, confidence_score: float) -> int:
        """
        Recommend problem difficulty based on confidence score

        Args:
            confidence_score: Current confidence score (0-100)

        Returns:
            Recommended difficulty level (1-3)
        """
        if confidence_score < 30:
            return self.DIFFICULTY_LEVELS['very_low']
        elif confidence_score < 50:
            return self.DIFFICULTY_LEVELS['low']
        elif confidence_score < 70:
            return self.DIFFICULTY_LEVELS['medium']
        else:
            return self.DIFFICULTY_LEVELS['high']

    def get_easy_problems(
        self,
        student_id: str,
        module_id: str,
        count: int = 5,
        difficulty_override: Optional[int] = None
    ) -> List[EasyProblem]:
        """
        Get easy problems suitable for the student's confidence level

        Args:
            student_id: Student UUID
            module_id: Module UUID
            count: Number of problems to return
            difficulty_override: Optional difficulty level override

        Returns:
            List of EasyProblem objects
        """
        confidence = self.get_confidence_score(student_id, module_id)

        # Determine difficulty level
        if difficulty_override:
            target_difficulty = difficulty_override
        else:
            target_difficulty = self.get_recommended_difficulty(confidence.current_score)

        # Get problems the student hasn't attempted recently
        query = """
            SELECT DISTINCT
                ep.id,
                ep.problem_id,
                ep.module_id,
                ep.problem_table_name,
                ep.difficulty_level,
                ep.confidence_boost_amount,
                ep.success_rate,
                CASE
                    WHEN sa.problem_id IS NULL THEN 0
                    ELSE 1
                END as previously_attempted
            FROM easy_problems ep
            LEFT JOIN (
                SELECT problem_id
                FROM student_attempts
                WHERE student_id = %s AND module_id = %s
                AND attempted_at > NOW() - INTERVAL '1 day'
            ) sa ON ep.problem_id = sa.problem_id
            WHERE ep.module_id = %s
            AND ep.difficulty_level <= %s
            AND ep.is_confidence_builder = TRUE
            ORDER BY previously_attempted ASC, ep.difficulty_level ASC, RANDOM()
            LIMIT %s
        """

        results = self.db.execute_many(
            query,
            (student_id, module_id, module_id, target_difficulty, count)
        )

        # Fetch full problem data for each problem
        easy_problems = []
        for row in results:
            problem_data = self._fetch_problem_data(
                row['problem_table_name'],
                row['problem_id']
            )

            easy_problems.append(EasyProblem(
                problem_id=row['problem_id'],
                module_id=row['module_id'],
                problem_table_name=row['problem_table_name'],
                difficulty_level=row['difficulty_level'],
                confidence_boost=float(row['confidence_boost_amount']),
                problem_data=problem_data,
                success_rate=float(row['success_rate']) if row['success_rate'] else None
            ))

        return easy_problems

    def get_next_problem(self, student_id: str, module_id: str) -> Optional[EasyProblem]:
        """
        Get the next recommended easy problem for the student

        Args:
            student_id: Student UUID
            module_id: Module UUID

        Returns:
            EasyProblem or None if no suitable problems
        """
        problems = self.get_easy_problems(student_id, module_id, count=1)
        return problems[0] if problems else None

    def record_attempt(self, attempt: AttemptResult) -> Tuple[float, float]:
        """
        Record a student's attempt and update confidence score

        Args:
            attempt: AttemptResult object

        Returns:
            Tuple of (old_confidence, new_confidence)
        """
        # Get current confidence
        confidence = self.get_confidence_score(attempt.student_id, attempt.module_id)
        old_score = confidence.current_score

        # Calculate confidence change
        delta = self._calculate_confidence_delta(attempt, confidence)
        new_score = max(0, min(100, old_score + delta))

        # Update consecutive correct count
        new_consecutive = confidence.consecutive_correct + 1 if attempt.is_correct else 0
        new_mastery = confidence.mastery_count + 1 if attempt.is_correct else confidence.mastery_count

        # Save attempt to database
        self._save_attempt(attempt, old_score, new_score)

        # Update confidence level
        self._update_confidence(
            attempt.student_id,
            attempt.module_id,
            new_score,
            new_mastery,
            new_consecutive,
            attempt.difficulty_level
        )

        # Update session stats
        self._update_session_stats(attempt, delta)

        return old_score, new_score

    def _calculate_confidence_delta(
        self,
        attempt: AttemptResult,
        confidence: ConfidenceScore
    ) -> float:
        """
        Calculate confidence score change based on attempt

        Args:
            attempt: AttemptResult object
            confidence: Current ConfidenceScore

        Returns:
            Confidence delta (can be negative)
        """
        if attempt.is_correct:
            # Base boost
            delta = self.CORRECT_BOOST_BASE

            # Streak bonus
            if confidence.consecutive_correct > 0:
                delta += self.STREAK_BONUS * min(confidence.consecutive_correct, 3)

            # Time bonus for fast correct answers
            if attempt.time_spent_seconds < self.TIME_BONUS_THRESHOLD:
                delta += self.TIME_BONUS

            # Hint penalty
            if attempt.hint_used:
                delta += self.HINT_PENALTY

            # Difficulty multiplier (harder problems = bigger boost)
            delta *= (1.0 + (attempt.difficulty_level - 1) * 0.2)
        else:
            # Incorrect answer
            delta = self.INCORRECT_PENALTY

            # Less penalty for difficult problems
            if attempt.difficulty_level > 2:
                delta *= 0.7

        return delta

    def _initialize_confidence(self, student_id: str, module_id: str) -> None:
        """Initialize confidence level for a student"""
        query = """
            INSERT INTO confidence_levels (student_id, module_id, current_confidence_score)
            VALUES (%s, %s, 50.0)
            ON CONFLICT (student_id, module_id) DO NOTHING
        """
        self.db.execute(query, (student_id, module_id))

    def _update_confidence(
        self,
        student_id: str,
        module_id: str,
        new_score: float,
        mastery_count: int,
        consecutive_correct: int,
        last_difficulty: int
    ) -> None:
        """Update confidence level in database"""
        query = """
            UPDATE confidence_levels
            SET current_confidence_score = %s,
                mastery_count = %s,
                consecutive_correct = %s,
                last_problem_difficulty = %s,
                last_updated_at = NOW()
            WHERE student_id = %s AND module_id = %s
        """
        self.db.execute(
            query,
            (new_score, mastery_count, consecutive_correct, last_difficulty,
             student_id, module_id)
        )

    def _save_attempt(
        self,
        attempt: AttemptResult,
        confidence_before: float,
        confidence_after: float
    ) -> None:
        """Save attempt to database"""
        query = """
            INSERT INTO student_attempts (
                student_id, module_id, problem_table_name, problem_id,
                answer_data, is_correct, time_spent_seconds, hint_used,
                difficulty_level, confidence_before, confidence_after
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        # For now, store minimal answer data - can be expanded
        answer_data = {'is_correct': attempt.is_correct}

        self.db.execute(
            query,
            (attempt.student_id, attempt.module_id, 'fraction_problems',
             attempt.problem_id, answer_data, attempt.is_correct,
             attempt.time_spent_seconds, attempt.hint_used,
             attempt.difficulty_level, confidence_before, confidence_after)
        )

    def _update_session_stats(self, attempt: AttemptResult, confidence_delta: float) -> None:
        """Update session statistics"""
        today = date.today()

        query = """
            INSERT INTO student_session_stats (
                student_id, module_id, session_date,
                problems_attempted, problems_correct,
                easy_problems_attempted, easy_problems_correct,
                session_confidence_delta, session_start_time
            ) VALUES (%s, %s, %s, 1, %s, 1, %s, %s, NOW())
            ON CONFLICT (student_id, module_id, session_date)
            DO UPDATE SET
                problems_attempted = student_session_stats.problems_attempted + 1,
                problems_correct = student_session_stats.problems_correct + %s,
                easy_problems_attempted = student_session_stats.easy_problems_attempted + 1,
                easy_problems_correct = student_session_stats.easy_problems_correct + %s,
                session_confidence_delta = student_session_stats.session_confidence_delta + %s,
                session_end_time = NOW()
        """

        correct_val = 1 if attempt.is_correct else 0

        self.db.execute(
            query,
            (attempt.student_id, attempt.module_id, today,
             correct_val, correct_val, confidence_delta,
             correct_val, correct_val, confidence_delta)
        )

    def _fetch_problem_data(self, table_name: str, problem_id: str) -> Dict:
        """Fetch full problem data from the appropriate table"""
        # For now, only support fraction_problems
        # In production, this would be more dynamic
        if table_name == 'fraction_problems':
            query = """
                SELECT * FROM fraction_problems WHERE id = %s
            """
            result = self.db.execute_one(query, (problem_id,))
            return dict(result) if result else {}

        return {}

    def get_confidence_summary(self, student_id: str, module_id: str) -> Dict:
        """
        Get comprehensive confidence summary for a student

        Args:
            student_id: Student UUID
            module_id: Module UUID

        Returns:
            Dictionary with confidence metrics
        """
        confidence = self.get_confidence_score(student_id, module_id)

        # Get recent performance
        query = """
            SELECT
                COUNT(*) as total_attempts,
                SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count,
                AVG(time_spent_seconds) as avg_time,
                MAX(attempted_at) as last_attempt
            FROM student_attempts
            WHERE student_id = %s AND module_id = %s
            AND attempted_at > NOW() - INTERVAL '7 days'
        """

        stats = self.db.execute_one(query, (student_id, module_id))

        return {
            'current_confidence': confidence.current_score,
            'confidence_level': self._get_confidence_level_label(confidence.current_score),
            'consecutive_correct': confidence.consecutive_correct,
            'mastery_count': confidence.mastery_count,
            'recommended_difficulty': self.get_recommended_difficulty(confidence.current_score),
            'recent_attempts': stats['total_attempts'] or 0,
            'recent_correct': stats['correct_count'] or 0,
            'recent_accuracy': (
                (stats['correct_count'] / stats['total_attempts'] * 100)
                if stats['total_attempts'] > 0 else 0
            ),
            'avg_time_seconds': float(stats['avg_time']) if stats['avg_time'] else 0,
            'last_attempt': stats['last_attempt']
        }

    def _get_confidence_level_label(self, score: float) -> str:
        """Convert confidence score to human-readable label"""
        if score < 30:
            return 'Very Low - Need Support'
        elif score < 50:
            return 'Low - Building Confidence'
        elif score < 70:
            return 'Medium - Making Progress'
        elif score < 85:
            return 'High - Doing Well'
        else:
            return 'Excellent - Strong Mastery'


class DatabaseConnection:
    """
    Mock database connection - to be replaced with actual PostgreSQL connection
    """
    def execute_one(self, query: str, params: tuple):
        """Execute query and return one result"""
        # Mock implementation
        pass

    def execute_many(self, query: str, params: tuple):
        """Execute query and return multiple results"""
        # Mock implementation
        pass

    def execute(self, query: str, params: tuple):
        """Execute query without returning results"""
        # Mock implementation
        pass
