"""
LMS Context Model
"""
from datetime import datetime, timedelta
from sqlalchemy import Column, DateTime, JSON, Numeric, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

from app.core.database import Base


class LMSContext(Base):
    """LMS Context model - cached student activity data from LMS"""

    __tablename__ = "lms_context"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Relationships
    student_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(PG_UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)

    # Recent Activity
    recent_assignments = Column(JSON, default=[])  # [{name, submitted_at, grade, status}]
    recent_grades = Column(JSON, default=[])       # [{assignment, score, date}]
    recent_logins = Column(JSON, default=[])       # [timestamps]

    # Aggregated Metrics
    engagement_score = Column(Numeric(3, 2))       # 0.00 to 1.00
    average_grade = Column(Numeric(5, 2))
    submission_rate = Column(Numeric(3, 2))        # % of assignments submitted on time

    # Upcoming
    upcoming_deadlines = Column(JSON, default=[])  # [{assignment, due_date, status}]

    # Cache Metadata
    cached_at = Column(DateTime, default=datetime.utcnow)
    cache_expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=6), index=True)

    # Relationships
    student = relationship("User")
    course = relationship("Course")

    # Unique constraint
    __table_args__ = (
        UniqueConstraint('student_id', 'course_id', name='unique_student_course_context'),
    )

    def __repr__(self):
        return f"<LMSContext student={self.student_id} course={self.course_id}>"

    @property
    def is_expired(self) -> bool:
        return datetime.utcnow() > self.cache_expires_at
