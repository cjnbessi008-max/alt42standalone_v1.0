"""
Game service for managing game sessions and logic
"""

from datetime import datetime
from typing import Optional, Dict, Any
import uuid

from .database import DatabaseService
from .problem_generator import ProblemGenerator
from ..models.game_session import GameSession
from ..models.problem import Problem
from ..models.student_answer import StudentAnswer
from ..models.student_progress import StudentProgress


class GameService:
    """Service for game session management and logic"""

    def __init__(self, db_service: DatabaseService):
        """Initialize game service"""
        self.db = db_service
        self.problem_generator = ProblemGenerator()

    def start_session(self, student_id: str, lms_launch_id: Optional[str] = None) -> GameSession:
        """
        Start a new game session

        Args:
            student_id: Student ID
            lms_launch_id: Optional LTI launch ID

        Returns:
            New GameSession object
        """
        # Get student's current difficulty level
        progress = self.get_student_progress(student_id)
        difficulty_level = progress.current_difficulty_level if progress else 1

        query = """
            INSERT INTO game_sessions (student_id, difficulty_level, lms_launch_id)
            VALUES (%s, %s, %s)
            RETURNING id, student_id, started_at, ended_at, total_problems, correct_answers,
                      duration_seconds, difficulty_level, is_completed, lms_launch_id
        """
        result = self.db.execute_one(query, (student_id, difficulty_level, lms_launch_id))

        return GameSession.from_db_row(result)

    def get_session(self, session_id: str) -> Optional[GameSession]:
        """Get game session by ID"""
        query = """
            SELECT id, student_id, started_at, ended_at, total_problems, correct_answers,
                   duration_seconds, difficulty_level, is_completed, lms_launch_id
            FROM game_sessions
            WHERE id = %s
        """
        result = self.db.execute_one(query, (session_id,))
        return GameSession.from_db_row(result) if result else None

    def generate_next_problem(self, session_id: str) -> Problem:
        """
        Generate next problem for a session

        Args:
            session_id: Game session ID

        Returns:
            New Problem object
        """
        # Get session to determine difficulty
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        # Generate problem
        problem_type, op1, op2, answer = self.problem_generator.generate_problem(
            session.difficulty_level
        )

        # Save to database
        query = """
            INSERT INTO problems (session_id, problem_type, operand_1, operand_2,
                                 correct_answer, difficulty_level)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, session_id, problem_type, operand_1, operand_2,
                     correct_answer, difficulty_level, created_at
        """
        result = self.db.execute_one(
            query,
            (session_id, problem_type.value, op1, op2, answer, session.difficulty_level)
        )

        return Problem.from_db_row(result)

    def submit_answer(
        self,
        problem_id: str,
        session_id: str,
        student_id: str,
        answer: int,
        time_spent: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Submit answer to a problem

        Args:
            problem_id: Problem ID
            session_id: Session ID
            student_id: Student ID
            answer: Student's answer
            time_spent: Time spent in seconds

        Returns:
            Dictionary with result and feedback
        """
        # Get problem
        problem = self.get_problem(problem_id)
        if not problem:
            raise ValueError(f"Problem {problem_id} not found")

        is_correct = (answer == problem.correct_answer)

        # Save answer
        query = """
            INSERT INTO student_answers (problem_id, session_id, student_id,
                                        submitted_answer, is_correct, time_spent_seconds)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, problem_id, session_id, student_id, submitted_answer,
                     is_correct, time_spent_seconds, submitted_at
        """
        result = self.db.execute_one(
            query,
            (problem_id, session_id, student_id, answer, is_correct, time_spent)
        )

        student_answer = StudentAnswer.from_db_row(result)

        # Update session stats
        self._update_session_stats(session_id, is_correct)

        return {
            'answer_id': student_answer.id,
            'is_correct': is_correct,
            'correct_answer': problem.correct_answer if not is_correct else None,
            'feedback': self._generate_feedback(is_correct, time_spent)
        }

    def end_session(self, session_id: str) -> GameSession:
        """
        End a game session

        Args:
            session_id: Session ID

        Returns:
            Updated GameSession object
        """
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        duration = int((datetime.now() - session.started_at).total_seconds())

        query = """
            UPDATE game_sessions
            SET ended_at = NOW(),
                duration_seconds = %s,
                is_completed = TRUE
            WHERE id = %s
            RETURNING id, student_id, started_at, ended_at, total_problems, correct_answers,
                     duration_seconds, difficulty_level, is_completed, lms_launch_id
        """
        result = self.db.execute_one(query, (duration, session_id))

        return GameSession.from_db_row(result)

    def get_problem(self, problem_id: str) -> Optional[Problem]:
        """Get problem by ID"""
        query = """
            SELECT id, session_id, problem_type, operand_1, operand_2,
                   correct_answer, difficulty_level, created_at
            FROM problems
            WHERE id = %s
        """
        result = self.db.execute_one(query, (problem_id,))
        return Problem.from_db_row(result) if result else None

    def get_student_progress(self, student_id: str) -> Optional[StudentProgress]:
        """Get student's overall progress"""
        query = """
            SELECT id, student_id, current_difficulty_level, total_sessions,
                   total_problems_solved, total_correct_answers, average_accuracy,
                   last_session_at, updated_at
            FROM student_progress
            WHERE student_id = %s
        """
        result = self.db.execute_one(query, (student_id,))
        return StudentProgress.from_db_row(result) if result else None

    def get_session_history(self, student_id: str, limit: int = 10):
        """Get student's recent sessions"""
        query = """
            SELECT id, student_id, started_at, ended_at, total_problems, correct_answers,
                   duration_seconds, difficulty_level, is_completed, lms_launch_id
            FROM game_sessions
            WHERE student_id = %s
            ORDER BY started_at DESC
            LIMIT %s
        """
        results = self.db.execute_query(query, (student_id, limit))
        return [GameSession.from_db_row(row) for row in results]

    def _update_session_stats(self, session_id: str, is_correct: bool):
        """Update session statistics after answer submission"""
        query = """
            UPDATE game_sessions
            SET total_problems = total_problems + 1,
                correct_answers = correct_answers + %s
            WHERE id = %s
        """
        self.db.execute_query(query, (1 if is_correct else 0, session_id))

    def _generate_feedback(self, is_correct: bool, time_spent: Optional[int]) -> str:
        """Generate encouraging feedback for student"""
        if is_correct:
            feedback_options = [
                "잘했어요! 🌟",
                "정답입니다! 👍",
                "훌륭해요! ✨",
                "맞았어요! 🎉",
                "대단해요! 💫"
            ]
            import random
            feedback = random.choice(feedback_options)

            if time_spent and time_spent < 5:
                feedback += " 아주 빨라요!"
        else:
            feedback = "아쉬워요. 다시 한번 생각해볼까요? 💪"

        return feedback
