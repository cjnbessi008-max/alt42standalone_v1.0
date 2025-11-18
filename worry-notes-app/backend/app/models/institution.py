"""
Institution Model
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

from app.core.database import Base


class Institution(Base):
    """Institution model - represents schools/organizations"""

    __tablename__ = "institutions"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    domain = Column(String(255))  # e.g., kaist.ac.kr

    # LMS Configuration
    lms_type = Column(String(50))  # canvas, moodle, google_classroom, etc.
    lms_config = Column(JSON, default={})  # LMS-specific configuration

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="institution")
    courses = relationship("Course", back_populates="institution")

    def __repr__(self):
        return f"<Institution {self.name}>"
