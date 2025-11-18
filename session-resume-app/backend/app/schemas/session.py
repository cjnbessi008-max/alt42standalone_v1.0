"""Session schemas for API validation"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID


class SessionStateCreate(BaseModel):
    """Create new session request"""
    student_id: UUID
    module_id: UUID
    force_new: bool = False


class SessionStateUpdate(BaseModel):
    """Update session state request"""
    current_problem_id: Optional[UUID] = None
    problem_index: Optional[int] = None
    session_data: Optional[Dict[str, Any]] = None
    device_info: Optional[Dict[str, Any]] = None


class SessionStateResponse(BaseModel):
    """Session state response"""
    id: UUID
    student_id: UUID
    module_id: UUID
    current_problem_id: Optional[UUID] = None
    problem_index: int
    total_problems: Optional[int] = None
    session_data: Dict[str, Any] = Field(default_factory=dict)
    is_completed: bool
    progress_percentage: float = 0.0
    started_at: datetime
    last_active_at: datetime
    completed_at: Optional[datetime] = None
    has_previous_session: bool = False

    model_config = ConfigDict(from_attributes=True)


class DraftAnswerCreate(BaseModel):
    """Save draft answer request"""
    student_id: UUID
    draft_answer: Dict[str, Any]
    time_spent_seconds: int = 0
    hints_viewed: int = 0


class DraftAnswerResponse(BaseModel):
    """Draft answer response"""
    id: UUID
    draft_answer: Dict[str, Any]
    time_spent_seconds: int
    hints_viewed: int
    saved_at: datetime
    has_draft: bool = True

    model_config = ConfigDict(from_attributes=True)


class ResumeInfoResponse(BaseModel):
    """Resume session information"""
    has_session: bool
    session: Optional[Dict[str, Any]] = None


class SessionCompleteRequest(BaseModel):
    """Complete session request"""
    final_score: Optional[int] = None
    total_time_seconds: Optional[int] = None
