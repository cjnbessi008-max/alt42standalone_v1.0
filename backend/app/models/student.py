"""
학생 모델
"""
from sqlalchemy import Column, String, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..core.database import Base


class Student(Base):
    """학생 정보"""
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    student_number = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True)
    grade_level = Column(String(20), index=True)
    lms_user_id = Column(String(100), index=True)
    preferences = Column(JSONB, default={})
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    # Relationships
    learning_progress = relationship("LearningProgress", back_populates="student", cascade="all, delete-orphan")
    routine_cards = relationship("RoutineCard", back_populates="student", cascade="all, delete-orphan")
    card_activities = relationship("CardActivity", back_populates="student", cascade="all, delete-orphan")
