"""
Worry Note and Response Models
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum as SQLEnum, UUID, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
import enum

from app.core.database import Base


class NoteCategory(str, enum.Enum):
    """Worry note category enumeration"""
    ACADEMIC = "academic"
    EMOTIONAL = "emotional"
    TECHNICAL = "technical"
    ENVIRONMENTAL = "environmental"
    SOCIAL = "social"
    OTHER = "other"


class NotePriority(str, enum.Enum):
    """Worry note priority enumeration"""
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class NoteStatus(str, enum.Enum):
    """Worry note status enumeration"""
    NEW = "new"
    REVIEWING = "reviewing"
    RESPONDED = "responded"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class WorryNote(Base):
    """Worry Note model - student concern submissions"""

    __tablename__ = "worry_notes"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Relationships
    student_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(PG_UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), index=True)

    # Content
    content = Column(Text, nullable=False)
    attachments = Column(JSON, default=[])  # [{filename, url, size, type}]

    # Privacy
    is_anonymous = Column(Boolean, default=False)
    anonymous_id = Column(String(50))  # Auto-generated for anonymous submissions

    # Classification
    category = Column(SQLEnum(NoteCategory), nullable=False, default=NoteCategory.OTHER, index=True)
    subcategories = Column(JSON, default=[])  # Additional fine-grained categories
    priority = Column(SQLEnum(NotePriority), nullable=False, default=NotePriority.MEDIUM, index=True)

    # Status
    status = Column(SQLEnum(NoteStatus), nullable=False, default=NoteStatus.NEW, index=True)

    # Crisis Detection
    is_crisis = Column(Boolean, default=False, index=True)
    crisis_type = Column(String(50))  # e.g., 'self_harm', 'abuse', 'emergency'
    crisis_notified_at = Column(DateTime)

    # AI Analysis
    ai_analysis = Column(JSON, default={})  # {themes, sentiment, suggested_response, confidence, keywords}
    ai_processed_at = Column(DateTime)

    # Assignment
    assigned_to = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    assigned_at = Column(DateTime)

    # Timestamps
    submitted_at = Column(DateTime, default=datetime.utcnow, index=True)
    first_viewed_at = Column(DateTime)
    first_responded_at = Column(DateTime)
    resolved_at = Column(DateTime)

    # Metadata
    metadata = Column(JSON, default={})

    # Relationships
    student = relationship("User", back_populates="worry_notes", foreign_keys=[student_id])
    course = relationship("Course", back_populates="worry_notes")
    assigned_user = relationship("User", back_populates="assigned_notes", foreign_keys=[assigned_to])
    responses = relationship("Response", back_populates="worry_note", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<WorryNote {self.id} - {self.category} - {self.priority}>"

    @property
    def response_count(self) -> int:
        return len([r for r in self.responses if not r.is_internal_note])

    @property
    def hours_since_submission(self) -> float:
        if self.submitted_at:
            delta = datetime.utcnow() - self.submitted_at
            return delta.total_seconds() / 3600
        return 0

    @property
    def needs_urgent_attention(self) -> bool:
        return (
            self.is_crisis or
            (self.priority == NotePriority.URGENT and self.status == NoteStatus.NEW)
        )


class Response(Base):
    """Response model - teacher/counselor responses to worry notes"""

    __tablename__ = "responses"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Relationships
    worry_note_id = Column(PG_UUID(as_uuid=True), ForeignKey("worry_notes.id", ondelete="CASCADE"), nullable=False, index=True)
    responder_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Content
    content = Column(Text, nullable=False)
    is_internal_note = Column(Boolean, default=False)  # Not visible to student

    # AI Assistance
    used_ai_suggestion = Column(Boolean, default=False)
    original_ai_suggestion = Column(Text)  # If teacher modified AI suggestion

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    edited_at = Column(DateTime)

    # Relationships
    worry_note = relationship("WorryNote", back_populates="responses")
    responder = relationship("User", back_populates="responses")

    def __repr__(self):
        return f"<Response {self.id} to WorryNote {self.worry_note_id}>"
