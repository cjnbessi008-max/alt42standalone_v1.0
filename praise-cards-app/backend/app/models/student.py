from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from ..database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    grade_level = Column(Integer, nullable=False)
    profile_image = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)

    # Stats
    total_learning_time = Column(Integer, default=0)  # in minutes
    consecutive_days = Column(Integer, default=0)
    total_modules_completed = Column(Integer, default=0)
    average_accuracy = Column(Integer, default=0)  # percentage

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_activity_at = Column(DateTime, nullable=True)

    # Relationships
    learning_sessions = relationship("LearningSession", back_populates="student")
    achievements = relationship("Achievement", back_populates="student")
    praise_cards = relationship("PraiseCard", back_populates="student")
    card_interactions = relationship("CardInteraction", back_populates="student")

    def __repr__(self):
        return f"<Student {self.name} (Grade {self.grade_level})>"
