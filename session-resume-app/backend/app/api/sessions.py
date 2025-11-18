"""Session management API endpoints"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID

from app.database import get_db
from app.services.session_service import SessionService
from app.schemas.session import (
    SessionStateCreate,
    SessionStateUpdate,
    SessionStateResponse,
    DraftAnswerCreate,
    DraftAnswerResponse,
    ResumeInfoResponse,
    SessionCompleteRequest,
)

router = APIRouter(prefix="/api/v1", tags=["sessions"])


# Session Management Endpoints

@router.post("/modules/{module_id}/sessions/start", response_model=dict)
async def start_session(
    module_id: UUID,
    request: SessionStateCreate,
    db: AsyncSession = Depends(get_db)
):
    """Start a new session or resume existing one"""
    service = SessionService(db)

    result = await service.start_or_resume_session(
        student_id=request.student_id,
        module_id=module_id,
        force_new=request.force_new
    )

    return result


@router.put("/modules/{module_id}/sessions/{session_id}", response_model=dict)
async def update_session(
    module_id: UUID,
    session_id: UUID,
    request: SessionStateUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update session state (auto-save)"""
    service = SessionService(db)

    session = await service.update_session_state(
        session_id=session_id,
        current_problem_id=request.current_problem_id,
        problem_index=request.problem_index,
        session_data=request.session_data,
        device_info=request.device_info
    )

    return {
        'success': True,
        'session': {
            'id': str(session.id),
            'last_active_at': session.last_active_at.isoformat(),
            'updated_at': session.updated_at.isoformat() if session.updated_at else None
        }
    }


@router.post("/modules/{module_id}/sessions/{session_id}/complete", response_model=dict)
async def complete_session(
    module_id: UUID,
    session_id: UUID,
    request: SessionCompleteRequest,
    db: AsyncSession = Depends(get_db)
):
    """Mark session as completed"""
    service = SessionService(db)

    session = await service.complete_session(
        session_id=session_id,
        final_score=request.final_score,
        total_time_seconds=request.total_time_seconds
    )

    return {
        'success': True,
        'session': {
            'id': str(session.id),
            'is_completed': session.is_completed,
            'completed_at': session.completed_at.isoformat() if session.completed_at else None,
            'final_score': session.session_data.get('final_score')
        }
    }


@router.get("/modules/{module_id}/sessions/resume/{student_id}", response_model=dict)
async def get_resume_info(
    module_id: UUID,
    student_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get resume information for a student"""
    service = SessionService(db)

    info = await service.get_resume_info(
        student_id=student_id,
        module_id=module_id
    )

    return info


# Draft Answer Endpoints

@router.post("/modules/{module_id}/problems/{problem_id}/draft", response_model=dict)
async def save_draft(
    module_id: UUID,
    problem_id: UUID,
    request: DraftAnswerCreate,
    db: AsyncSession = Depends(get_db)
):
    """Save draft answer"""
    service = SessionService(db)

    draft = await service.save_draft_answer(
        student_id=request.student_id,
        problem_id=problem_id,
        module_id=module_id,
        draft_answer=request.draft_answer,
        time_spent_seconds=request.time_spent_seconds,
        hints_viewed=request.hints_viewed
    )

    return {
        'success': True,
        'draft': {
            'id': str(draft.id),
            'saved_at': draft.saved_at.isoformat()
        }
    }


@router.get("/modules/{module_id}/problems/{problem_id}/draft/{student_id}", response_model=dict)
async def get_draft(
    module_id: UUID,
    problem_id: UUID,
    student_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get draft answer"""
    service = SessionService(db)

    draft = await service.get_draft_answer(
        student_id=student_id,
        problem_id=problem_id
    )

    if draft:
        return {
            'has_draft': True,
            'draft': draft
        }
    else:
        return {
            'has_draft': False
        }


@router.delete("/modules/{module_id}/problems/{problem_id}/draft/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_draft(
    module_id: UUID,
    problem_id: UUID,
    student_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete draft answer (on submit)"""
    service = SessionService(db)

    await service.delete_draft_answer(
        student_id=student_id,
        problem_id=problem_id
    )

    return None
