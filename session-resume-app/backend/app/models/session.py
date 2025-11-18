"""Session management models"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, func, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.database import Base


class StudentSessionState(Base):
    """Student session state tracking"""
    __tablename__ = "student_session_state"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False)

    # Current problem tracking
    current_problem_id = Column(UUID(as_uuid=True), nullable=True)
    problem_index = Column(Integer, default=0, nullable=False)
    total_problems = Column(Integer, nullable=True)

    # Session data (JSONB for flexibility)
    session_data = Column(JSONB, default={}, nullable=False)
    # Structure: {
    #   "completed_problems": ["uuid1", "uuid2"],
    #   "hints_used": {"uuid1": 2},
    #   "problem_sequence": ["uuid1", "uuid2", ...],
    #   "ui_state": {"font_size": 16, "dark_mode": false}
    # }

    # Status tracking
    is_completed = Column(Boolean, default=False, nullable=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Device tracking
    last_device_info = Column(JSONB, nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('student_id', 'module_id', name='uq_student_module'),
        Index('idx_session_student', 'student_id'),
        Index('idx_session_module', 'module_id'),
        Index('idx_session_last_active', 'last_active_at'),
        Index('idx_session_status', 'is_completed'),
        Index(
            'idx_session_expired',
            'last_active_at',
            postgresql_where=(is_completed == False)
        ),
    )


class ProblemDraft(Base):
    """Draft answer storage"""
    __tablename__ = "problem_drafts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    problem_id = Column(UUID(as_uuid=True), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False)

    # Draft answer data (flexible JSONB)
    draft_answer = Column(JSONB, nullable=False)

    # Metadata
    time_spent_seconds = Column(Integer, default=0)
    hints_viewed = Column(Integer, default=0)
    saved_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('student_id', 'problem_id', name='uq_student_problem'),
        Index('idx_drafts_student', 'student_id'),
        Index('idx_drafts_problem', 'problem_id'),
        Index('idx_drafts_module', 'module_id'),
        Index('idx_drafts_saved_at', 'saved_at'),
    )


class SessionEvent(Base):
    """Session event logging"""
    __tablename__ = "session_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("student_session_state.id"), nullable=False)
    event_type = Column(String(50), nullable=False)
    # Types: session_start, session_pause, session_resume,
    #        problem_start, problem_complete, draft_save,
    #        session_complete, session_expire

    event_data = Column(JSONB, default={})
    device_info = Column(JSONB, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_events_session', 'session_id'),
        Index('idx_events_type', 'event_type'),
        Index('idx_events_created', 'created_at'),
    )
