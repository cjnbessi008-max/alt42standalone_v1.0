"""Session management service - core business logic"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from uuid import UUID
import json

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

from app.models.session import StudentSessionState, ProblemDraft, SessionEvent
import redis.asyncio as redis
import os


class SessionService:
    """Service for managing student sessions"""

    def __init__(self, db: AsyncSession, redis_client: Optional[redis.Redis] = None):
        self.db = db
        self.redis = redis_client
        self.session_timeout_days = int(os.getenv("SESSION_TIMEOUT_DAYS", "30"))
        self.cache_ttl = int(os.getenv("SESSION_CACHE_TTL", "3600"))

    async def start_or_resume_session(
        self,
        student_id: UUID,
        module_id: UUID,
        force_new: bool = False
    ) -> Dict[str, Any]:
        """Start a new session or resume existing one"""

        # Check for existing active session
        if not force_new:
            existing_session = await self._get_active_session(student_id, module_id)
            if existing_session:
                # Load draft answer for current problem
                draft = None
                if existing_session.current_problem_id:
                    draft = await self._get_draft_answer(
                        student_id,
                        existing_session.current_problem_id
                    )

                return {
                    'session': self._session_to_dict(existing_session, has_previous=True),
                    'draft_answer': self._draft_to_dict(draft) if draft else None
                }

        # Create new session
        new_session = await self._create_new_session(student_id, module_id)
        return {
            'session': self._session_to_dict(new_session, has_previous=False),
            'draft_answer': None
        }

    async def _get_active_session(
        self,
        student_id: UUID,
        module_id: UUID
    ) -> Optional[StudentSessionState]:
        """Get active session if exists and not expired"""

        # Try cache first
        if self.redis:
            cache_key = f"session:{student_id}:{module_id}"
            cached = await self.redis.get(cache_key)
            if cached:
                # Return cached session (would need to deserialize)
                pass

        # Query database
        cutoff_date = datetime.utcnow() - timedelta(days=self.session_timeout_days)

        stmt = select(StudentSessionState).where(
            and_(
                StudentSessionState.student_id == student_id,
                StudentSessionState.module_id == module_id,
                StudentSessionState.is_completed == False,
                StudentSessionState.last_active_at > cutoff_date
            )
        )

        result = await self.db.execute(stmt)
        session = result.scalar_one_or_none()

        # Cache the result
        if session and self.redis:
            cache_key = f"session:{student_id}:{module_id}"
            await self.redis.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(self._session_to_dict(session), default=str)
            )

        return session

    async def _create_new_session(
        self,
        student_id: UUID,
        module_id: UUID
    ) -> StudentSessionState:
        """Create a new session"""

        # Generate problem sequence (mock for now)
        problem_sequence = [str(UUID(int=i)) for i in range(1, 21)]  # 20 mock problems

        session_data = {
            'problem_sequence': problem_sequence,
            'completed_problems': [],
            'hints_used': {},
            'ui_state': {}
        }

        # Check if session exists (upsert)
        stmt = select(StudentSessionState).where(
            and_(
                StudentSessionState.student_id == student_id,
                StudentSessionState.module_id == module_id
            )
        )
        result = await self.db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing session to reset
            existing.current_problem_id = UUID(problem_sequence[0]) if problem_sequence else None
            existing.problem_index = 0
            existing.total_problems = len(problem_sequence)
            existing.session_data = session_data
            existing.is_completed = False
            existing.started_at = datetime.utcnow()
            existing.last_active_at = datetime.utcnow()
            existing.completed_at = None
            session = existing
        else:
            # Create new session
            session = StudentSessionState(
                student_id=student_id,
                module_id=module_id,
                current_problem_id=UUID(problem_sequence[0]) if problem_sequence else None,
                problem_index=0,
                total_problems=len(problem_sequence),
                session_data=session_data,
                is_completed=False
            )
            self.db.add(session)

        await self.db.commit()
        await self.db.refresh(session)

        # Invalidate cache
        if self.redis:
            await self.redis.delete(f"session:{student_id}:{module_id}")

        # Log event
        await self._log_event(session.id, 'session_start', {'force_new': False})

        return session

    async def update_session_state(
        self,
        session_id: UUID,
        current_problem_id: Optional[UUID] = None,
        problem_index: Optional[int] = None,
        session_data: Optional[Dict[str, Any]] = None,
        device_info: Optional[Dict[str, Any]] = None
    ) -> StudentSessionState:
        """Update session state (auto-save)"""

        stmt = select(StudentSessionState).where(StudentSessionState.id == session_id)
        result = await self.db.execute(stmt)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        # Update fields
        if current_problem_id is not None:
            session.current_problem_id = current_problem_id
        if problem_index is not None:
            session.problem_index = problem_index
        if session_data is not None:
            session.session_data = session_data
        if device_info is not None:
            session.last_device_info = device_info

        session.last_active_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(session)

        # Invalidate cache
        if self.redis:
            await self.redis.delete(f"session:{session.student_id}:{session.module_id}")

        return session

    async def complete_session(
        self,
        session_id: UUID,
        final_score: Optional[int] = None,
        total_time_seconds: Optional[int] = None
    ) -> StudentSessionState:
        """Mark session as completed"""

        stmt = select(StudentSessionState).where(StudentSessionState.id == session_id)
        result = await self.db.execute(stmt)
        session = result.scalar_one_or_none()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        session.is_completed = True
        session.completed_at = datetime.utcnow()

        # Add completion data to session_data
        completion_data = {}
        if final_score is not None:
            completion_data['final_score'] = final_score
        if total_time_seconds is not None:
            completion_data['total_time_seconds'] = total_time_seconds

        if completion_data:
            session.session_data = {**session.session_data, **completion_data}

        await self.db.commit()
        await self.db.refresh(session)

        # Clear all drafts for this session
        await self._clear_session_drafts(session.student_id, session.module_id)

        # Invalidate cache
        if self.redis:
            await self.redis.delete(f"session:{session.student_id}:{session.module_id}")

        # Log event
        await self._log_event(session_id, 'session_complete', completion_data)

        return session

    async def get_resume_info(
        self,
        student_id: UUID,
        module_id: UUID
    ) -> Dict[str, Any]:
        """Get information for resume prompt"""

        session = await self._get_active_session(student_id, module_id)

        if not session:
            return {'has_session': False}

        # Check if session can be resumed (not expired)
        time_diff = datetime.utcnow() - session.last_active_at
        can_resume = time_diff.days < self.session_timeout_days

        progress_percentage = self._calculate_progress(session)

        return {
            'has_session': True,
            'session': {
                'id': str(session.id),
                'current_problem_index': session.problem_index,
                'total_problems': session.total_problems,
                'progress_percentage': progress_percentage,
                'last_active_at': session.last_active_at.isoformat(),
                'time_since_last_active': self._format_time_ago(time_diff),
                'can_resume': can_resume,
                'expired_reason': None if can_resume else 'inactive_for_30_days'
            }
        }

    async def save_draft_answer(
        self,
        student_id: UUID,
        problem_id: UUID,
        module_id: UUID,
        draft_answer: Dict[str, Any],
        time_spent_seconds: int = 0,
        hints_viewed: int = 0
    ) -> ProblemDraft:
        """Save draft answer"""

        # Check if draft exists
        stmt = select(ProblemDraft).where(
            and_(
                ProblemDraft.student_id == student_id,
                ProblemDraft.problem_id == problem_id
            )
        )
        result = await self.db.execute(stmt)
        draft = result.scalar_one_or_none()

        if draft:
            # Update existing draft
            draft.draft_answer = draft_answer
            draft.time_spent_seconds = time_spent_seconds
            draft.hints_viewed = hints_viewed
            draft.saved_at = datetime.utcnow()
        else:
            # Create new draft
            draft = ProblemDraft(
                student_id=student_id,
                problem_id=problem_id,
                module_id=module_id,
                draft_answer=draft_answer,
                time_spent_seconds=time_spent_seconds,
                hints_viewed=hints_viewed
            )
            self.db.add(draft)

        await self.db.commit()
        await self.db.refresh(draft)

        return draft

    async def _get_draft_answer(
        self,
        student_id: UUID,
        problem_id: UUID
    ) -> Optional[ProblemDraft]:
        """Get draft answer for a problem"""

        stmt = select(ProblemDraft).where(
            and_(
                ProblemDraft.student_id == student_id,
                ProblemDraft.problem_id == problem_id
            )
        )

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_draft_answer(
        self,
        student_id: UUID,
        problem_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """Public method to get draft answer"""
        draft = await self._get_draft_answer(student_id, problem_id)
        return self._draft_to_dict(draft) if draft else None

    async def delete_draft_answer(
        self,
        student_id: UUID,
        problem_id: UUID
    ):
        """Delete draft answer (on submit)"""

        stmt = delete(ProblemDraft).where(
            and_(
                ProblemDraft.student_id == student_id,
                ProblemDraft.problem_id == problem_id
            )
        )

        await self.db.execute(stmt)
        await self.db.commit()

    async def _clear_session_drafts(
        self,
        student_id: UUID,
        module_id: UUID
    ):
        """Clear all drafts for a module session"""

        stmt = delete(ProblemDraft).where(
            and_(
                ProblemDraft.student_id == student_id,
                ProblemDraft.module_id == module_id
            )
        )

        await self.db.execute(stmt)
        await self.db.commit()

    async def _log_event(
        self,
        session_id: UUID,
        event_type: str,
        event_data: Dict[str, Any] = None
    ):
        """Log session event for analytics"""

        event = SessionEvent(
            session_id=session_id,
            event_type=event_type,
            event_data=event_data or {}
        )
        self.db.add(event)
        await self.db.commit()

    def _calculate_progress(self, session: StudentSessionState) -> float:
        """Calculate progress percentage"""
        if not session.total_problems or session.total_problems == 0:
            return 0.0

        completed = len(session.session_data.get('completed_problems', []))
        return round((completed / session.total_problems) * 100, 1)

    def _format_time_ago(self, time_diff: timedelta) -> str:
        """Format time difference in human-readable Korean"""
        seconds = int(time_diff.total_seconds())

        if seconds < 60:
            return f"{seconds}초 전"
        elif seconds < 3600:
            return f"{seconds // 60}분 전"
        elif seconds < 86400:
            return f"{seconds // 3600}시간 전"
        else:
            return f"{seconds // 86400}일 전"

    def _session_to_dict(self, session: StudentSessionState, has_previous: bool = False) -> Dict[str, Any]:
        """Convert session model to dict"""
        return {
            'id': str(session.id),
            'student_id': str(session.student_id),
            'module_id': str(session.module_id),
            'current_problem_id': str(session.current_problem_id) if session.current_problem_id else None,
            'problem_index': session.problem_index,
            'total_problems': session.total_problems,
            'session_data': session.session_data,
            'is_completed': session.is_completed,
            'progress_percentage': self._calculate_progress(session),
            'started_at': session.started_at.isoformat(),
            'last_active_at': session.last_active_at.isoformat(),
            'completed_at': session.completed_at.isoformat() if session.completed_at else None,
            'has_previous_session': has_previous
        }

    def _draft_to_dict(self, draft: ProblemDraft) -> Dict[str, Any]:
        """Convert draft model to dict"""
        return {
            'id': str(draft.id),
            'draft_answer': draft.draft_answer,
            'time_spent_seconds': draft.time_spent_seconds,
            'hints_viewed': draft.hints_viewed,
            'saved_at': draft.saved_at.isoformat(),
            'has_draft': True
        }
