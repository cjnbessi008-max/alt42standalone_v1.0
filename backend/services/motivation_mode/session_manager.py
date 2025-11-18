"""
Motivation Mode Session Manager

Handles creation, management, and lifecycle of motivation mode sessions.
"""

import random
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from .models.session import (
    MotivationSession,
    SessionCreateRequest,
    SessionEndRequest,
    ProblemSubmission,
    FeedbackResponse,
    SessionSummary,
    ContinuationPrompt,
    ModeTrigger,
    ExitReason,
)


class MotivationSessionManager:
    """
    Manages motivation mode sessions for students.

    Responsibilities:
    - Create and end sessions
    - Track session progress
    - Generate encouraging feedback
    - Manage problem selection
    """

    def __init__(self, db_connection):
        """
        Initialize session manager.

        Args:
            db_connection: Database connection for persistence
        """
        self.db = db_connection
        self._positive_messages = self._load_positive_messages()

    async def start_session(
        self,
        student_id: UUID,
        request: SessionCreateRequest
    ) -> Dict[str, Any]:
        """
        Start a new motivation mode session.

        Args:
            student_id: UUID of the student
            request: Session creation request

        Returns:
            Dict containing session_id and first problem
        """
        # Check for existing active session
        existing_session = await self._get_active_session(
            student_id,
            request.module_id
        )

        if existing_session:
            # Close existing session first
            await self.end_session(
                student_id,
                existing_session['id'],
                SessionEndRequest(exit_reason=ExitReason.AUTO_DETECTED)
            )

        # Create new session
        session = await self.db.execute(
            """
            INSERT INTO motivation_mode_sessions (
                student_id,
                module_id,
                mode_trigger,
                session_start
            ) VALUES ($1, $2, $3, NOW())
            RETURNING *
            """,
            student_id,
            request.module_id,
            request.trigger.value
        )

        # Get first problem
        first_problem = await self._select_next_problem(
            request.module_id,
            student_id,
            difficulty_adjustment=-1  # Slightly easier for motivation mode
        )

        # Generate welcoming message
        welcome_message = self._get_welcome_message(request.trigger)

        return {
            "session_id": session['id'],
            "first_problem": first_problem,
            "message": welcome_message
        }

    async def submit_answer(
        self,
        student_id: UUID,
        session_id: UUID,
        submission: ProblemSubmission
    ) -> FeedbackResponse:
        """
        Submit an answer to a problem in motivation mode.

        Args:
            student_id: UUID of the student
            session_id: UUID of the session
            submission: Problem submission data

        Returns:
            FeedbackResponse with feedback and continuation prompt
        """
        # Get current session
        session = await self._get_session(session_id, student_id)

        if not session or not session['is_active']:
            raise ValueError("Session not found or already ended")

        # Check answer correctness
        is_correct = await self._check_answer(
            submission.problem_id,
            submission.answer
        )

        # Update streak
        if is_correct:
            current_streak = session['current_streak'] + 1
            max_streak = max(session['max_streak'], current_streak)
            problems_correct = session['problems_correct'] + 1
        else:
            current_streak = 0
            max_streak = session['max_streak']
            problems_correct = session['problems_correct']

        problems_completed = session['problems_completed'] + 1
        problems_incorrect = session['problems_incorrect'] + (0 if is_correct else 1)

        # Update session
        await self.db.execute(
            """
            UPDATE motivation_mode_sessions
            SET problems_completed = $1,
                problems_correct = $2,
                problems_incorrect = $3,
                current_streak = $4,
                max_streak = $5,
                updated_at = NOW()
            WHERE id = $6
            """,
            problems_completed,
            problems_correct,
            problems_incorrect,
            current_streak,
            max_streak,
            session_id
        )

        # Record attempt
        feedback_message = self._get_feedback_message(is_correct)
        encouragement_message = self._get_encouragement_message(
            is_correct,
            current_streak,
            problems_completed
        )

        await self.db.execute(
            """
            INSERT INTO motivation_mode_problem_attempts (
                session_id,
                problem_id,
                module_id,
                answer_data,
                is_correct,
                time_spent_seconds,
                streak_at_attempt,
                problem_sequence_number,
                feedback_message,
                encouragement_message,
                attempted_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            """,
            session_id,
            submission.problem_id,
            session['module_id'],
            submission.answer,
            is_correct,
            submission.time_spent_seconds,
            current_streak,
            problems_completed,
            feedback_message,
            encouragement_message
        )

        # Generate celebration if milestone reached
        celebration = self._check_celebration(current_streak, problems_completed)

        return FeedbackResponse(
            is_correct=is_correct,
            feedback=feedback_message,
            streak=current_streak,
            encouragement_message=encouragement_message,
            next_action_prompt=ContinuationPrompt(),
            celebration=celebration
        )

    async def get_next_problem(
        self,
        student_id: UUID,
        session_id: UUID
    ) -> Dict[str, Any]:
        """
        Get next problem for motivation mode session.

        Args:
            student_id: UUID of the student
            session_id: UUID of the session

        Returns:
            Problem data and current session stats
        """
        session = await self._get_session(session_id, student_id)

        if not session or not session['is_active']:
            raise ValueError("Session not found or already ended")

        # Select next problem
        problem = await self._select_next_problem(
            session['module_id'],
            student_id,
            difficulty_adjustment=-1
        )

        return {
            "problem": problem,
            "current_streak": session['current_streak'],
            "session_stats": {
                "completed": session['problems_completed'],
                "correct": session['problems_correct']
            }
        }

    async def end_session(
        self,
        student_id: UUID,
        session_id: UUID,
        request: SessionEndRequest
    ) -> SessionSummary:
        """
        End a motivation mode session.

        Args:
            student_id: UUID of the student
            session_id: UUID of the session
            request: Session end request with exit reason

        Returns:
            SessionSummary with encouragement and statistics
        """
        session = await self._get_session(session_id, student_id)

        if not session:
            raise ValueError("Session not found")

        # Update session end
        await self.db.execute(
            """
            UPDATE motivation_mode_sessions
            SET session_end = NOW(),
                exit_reason = $1,
                updated_at = NOW()
            WHERE id = $2
            """,
            request.exit_reason.value,
            session_id
        )

        # Calculate duration
        duration = await self.db.fetch_one(
            """
            SELECT duration_seconds FROM motivation_mode_sessions
            WHERE id = $1
            """,
            session_id
        )

        # Update student preferences
        await self._update_student_stats(student_id, session)

        # Generate closing message and highlights
        closing_message = self._get_closing_message(
            session['problems_completed'],
            session['problems_correct']
        )

        achievement_highlights = self._get_achievement_highlights(session)

        accuracy = (
            (session['problems_correct'] / session['problems_completed']) * 100
            if session['problems_completed'] > 0 else 0
        )

        return SessionSummary(
            session_id=session_id,
            problems_completed=session['problems_completed'],
            problems_correct=session['problems_correct'],
            problems_incorrect=session['problems_incorrect'],
            max_streak=session['max_streak'],
            duration_seconds=duration['duration_seconds'],
            accuracy=accuracy,
            closing_message=closing_message,
            achievement_highlights=achievement_highlights
        )

    # Helper methods

    def _load_positive_messages(self) -> Dict[str, List[str]]:
        """Load positive encouragement messages"""
        return {
            "correct": [
                "잘했어요! 정답이에요!",
                "완벽해요! 👏",
                "훌륭해요! 계속 이런 식으로!",
                "정말 잘 이해하고 있네요!",
                "대단해요! 🌟"
            ],
            "incorrect": [
                "괜찮아요! 다시 한 번 생각해볼까요?",
                "조금 아쉽지만 잘 시도했어요!",
                "이런 실수는 배우는 과정이에요!",
                "천천히 다시 풀어봐요. 할 수 있어요!"
            ],
            "streak_3": "🔥 연속 3문제! 정말 잘하고 있어요!",
            "streak_5": "🔥 5문제 연속! 굉장해요!",
            "streak_10": "🔥 와! 10문제 연속 정답! 놀라워요!",
            "closing": [
                "오늘도 열심히 했어요! 잘했어요!",
                "정말 잘했어요! 내일 또 만나요!",
                "이만큼 했으면 충분해요! 수고했어요!",
                "오늘 많이 배웠어요! 자랑스러워요!"
            ]
        }

    def _get_feedback_message(self, is_correct: bool) -> str:
        """Get feedback message for answer"""
        messages = (
            self._positive_messages['correct']
            if is_correct
            else self._positive_messages['incorrect']
        )
        return random.choice(messages)

    def _get_encouragement_message(
        self,
        is_correct: bool,
        streak: int,
        total_completed: int
    ) -> Optional[str]:
        """Generate encouragement message based on performance"""
        if is_correct and streak >= 10:
            return self._positive_messages['streak_10']
        elif is_correct and streak >= 5:
            return self._positive_messages['streak_5']
        elif is_correct and streak >= 3:
            return self._positive_messages['streak_3']
        elif total_completed > 0 and total_completed % 5 == 0:
            return f"벌써 {total_completed}문제나 풀었어요! 대단해요!"
        return None

    def _get_welcome_message(self, trigger: ModeTrigger) -> str:
        """Get welcome message based on how session was triggered"""
        messages = {
            ModeTrigger.STUDENT_INITIATED: "한 문제만 풀어볼까요? 부담 갖지 마세요!",
            ModeTrigger.SYSTEM_SUGGESTED: "조금 쉬어가면서 한 문제씩 해봐요!",
            ModeTrigger.AUTO_DETECTED: "천천히 한 문제씩 풀어봐요. 잘 할 수 있어요!",
            ModeTrigger.TEACHER_ASSIGNED: "선생님이 준비한 문제예요. 하나씩 풀어봐요!"
        }
        return messages.get(trigger, messages[ModeTrigger.STUDENT_INITIATED])

    def _get_closing_message(self, completed: int, correct: int) -> str:
        """Generate closing message with stats"""
        if completed == 0:
            return "괜찮아요! 다음에 다시 해봐요!"
        elif completed == 1:
            return "오늘 1문제를 풀었어요! 시작이 반이에요!"
        else:
            base_message = random.choice(self._positive_messages['closing'])
            return f"오늘 {completed}문제를 풀었어요! {base_message}"

    def _get_achievement_highlights(self, session: Dict) -> List[str]:
        """Generate achievement highlights"""
        highlights = []

        if session['max_streak'] >= 5:
            highlights.append(f"🔥 최고 연속 정답: {session['max_streak']}개!")

        if session['problems_completed'] >= 10:
            highlights.append(f"🎯 {session['problems_completed']}문제 완료!")

        accuracy = (
            (session['problems_correct'] / session['problems_completed']) * 100
            if session['problems_completed'] > 0 else 0
        )

        if accuracy >= 80:
            highlights.append(f"✨ 정확도 {accuracy:.0f}%!")

        return highlights

    def _check_celebration(
        self,
        streak: int,
        total_completed: int
    ) -> Optional[Dict[str, Any]]:
        """Check if celebration animation should be shown"""
        if streak in [3, 5, 10, 15, 20]:
            return {
                "type": "streak_milestone",
                "value": streak,
                "animation": "fire_celebration"
            }
        elif total_completed in [5, 10, 20, 50]:
            return {
                "type": "completion_milestone",
                "value": total_completed,
                "animation": "confetti"
            }
        return None

    async def _get_session(
        self,
        session_id: UUID,
        student_id: UUID
    ) -> Optional[Dict]:
        """Get session from database"""
        # This would query the database
        # Placeholder implementation
        pass

    async def _get_active_session(
        self,
        student_id: UUID,
        module_id: UUID
    ) -> Optional[Dict]:
        """Get active session for student and module"""
        # This would query the database
        # Placeholder implementation
        pass

    async def _select_next_problem(
        self,
        module_id: UUID,
        student_id: UUID,
        difficulty_adjustment: int = 0
    ) -> Dict[str, Any]:
        """
        Select next appropriate problem for student.

        Uses slightly lower difficulty in motivation mode to build confidence.
        """
        # This would implement problem selection logic
        # Placeholder implementation
        pass

    async def _check_answer(
        self,
        problem_id: UUID,
        answer: Dict[str, Any]
    ) -> bool:
        """Check if answer is correct"""
        # This would implement answer validation
        # Placeholder implementation
        pass

    async def _update_student_stats(
        self,
        student_id: UUID,
        session: Dict
    ) -> None:
        """Update student motivation preferences with session stats"""
        await self.db.execute(
            """
            INSERT INTO student_motivation_preferences (student_id)
            VALUES ($1)
            ON CONFLICT (student_id) DO UPDATE
            SET total_motivation_sessions = student_motivation_preferences.total_motivation_sessions + 1,
                total_problems_in_motivation_mode = student_motivation_preferences.total_problems_in_motivation_mode + $2,
                last_motivation_session = NOW(),
                highest_streak_achieved = GREATEST(
                    student_motivation_preferences.highest_streak_achieved,
                    $3
                )
            """,
            student_id,
            session['problems_completed'],
            session['max_streak']
        )
