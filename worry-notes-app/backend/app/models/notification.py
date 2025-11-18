"""
Notification Model
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    """Notification type enumeration"""
    CONCERN_SUBMITTED = "concern_submitted"
    RESPONSE_RECEIVED = "response_received"
    CONCERN_RESOLVED = "concern_resolved"
    URGENT_ALERT = "urgent_alert"
    DAILY_DIGEST = "daily_digest"
    ESCALATION_REMINDER = "escalation_reminder"
    ASSIGNMENT_TO_COUNSELOR = "assignment_to_counselor"


class Notification(Base):
    """Notification model"""

    __tablename__ = "notifications"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Recipient
    recipient_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Type
    type = Column(SQLEnum(NotificationType), nullable=False, index=True)

    # Content
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    link_url = Column(String(500))  # Deep link to relevant page

    # Related Resource
    related_worry_note_id = Column(PG_UUID(as_uuid=True), ForeignKey("worry_notes.id", ondelete="CASCADE"))

    # Read Status
    read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime)

    # Delivery Channels
    sent_email = Column(Boolean, default=False)
    sent_app = Column(Boolean, default=True)
    sent_lms = Column(Boolean, default=False)

    # Timestamps
    sent_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    recipient = relationship("User")
    related_worry_note = relationship("WorryNote")

    def __repr__(self):
        return f"<Notification {self.type} to {self.recipient_id}>"
