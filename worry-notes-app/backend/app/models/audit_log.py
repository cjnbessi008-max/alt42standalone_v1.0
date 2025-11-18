"""
Audit Log Model
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, INET
import uuid

from app.core.database import Base


class AuditLog(Base):
    """Audit Log model - for compliance and debugging"""

    __tablename__ = "audit_logs"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)

    # Action
    action = Column(String(100), nullable=False)  # e.g., 'view_worry_note', 'update_category'
    resource_type = Column(String(50), index=True)  # e.g., 'worry_note', 'response', 'user'
    resource_id = Column(PG_UUID(as_uuid=True), index=True)

    # Details
    details = Column(JSON, default={})  # Action-specific details

    # Request Info
    ip_address = Column(INET)
    user_agent = Column(String)

    # Timestamp
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_id} at {self.timestamp}>"
