"""
Course and Enrollment Models
"""
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, UUID, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
import enum

from app.core.database import Base


class EnrollmentRole(str, enum.Enum):
    """Enrollment role enumeration"""
    STUDENT = "student"
    TEACHER = "teacher"
    TA = "ta"


class Course(Base):
    """Course model"""

    __tablename__ = "courses"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Institution
    institution_id = Column(PG_UUID(as_uuid=True), ForeignKey("institutions.id"), index=True)

    # LMS Integration
    lms_course_id = Column(String(255), index=True)  # External LMS course ID

    # Course Information
    name = Column(String(255), nullable=False)
    code = Column(String(50))  # Course code (e.g., CS101)
    semester = Column(String(50))

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    institution = relationship("Institution", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    worry_notes = relationship("WorryNote", back_populates="course")

    def __repr__(self):
        return f"<Course {self.code}: {self.name}>"


class Enrollment(Base):
    """Enrollment model - links users to courses"""

    __tablename__ = "enrollments"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Relationships
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(PG_UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)

    # Role in course
    role = Column(SQLEnum(EnrollmentRole), nullable=False, index=True)

    # Timestamps
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

    # Unique constraint
    __table_args__ = (
        UniqueConstraint('user_id', 'course_id', name='unique_user_course'),
    )

    def __repr__(self):
        return f"<Enrollment user={self.user_id} course={self.course_id} role={self.role}>"
