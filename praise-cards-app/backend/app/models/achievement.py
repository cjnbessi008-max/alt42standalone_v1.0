from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

from ..database import Base


class AchievementType(str, enum.Enum):
    HIGH_ACCURACY = "high_accuracy"  # 80%+ accuracy
    CONSECUTIVE_DAYS = "consecutive_days"  # 3+ days streak
    MODULE_COMPLETED = "module_completed"  # Finished a module
    LEARNING_TIME = "learning_time"  # 30+ minutes in a day
    PROGRESS_BOOST = "progress_boost"  # 20%+ progress increase
    PERFECT_SCORE = "perfect_score"  # 100% accuracy
    FIRST_MODULE = "first_module"  # First module completion
    SPEED_LEARNER = "speed_learner"  # Completed quickly


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    learning_session_id = Column(
        UUID(as_uuid=True), ForeignKey("learning_sessions.id"), nullable=True
    )

    # Achievement details
    achievement_type = Column(Enum(AchievementType), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(String(500), nullable=False)

    # Metrics
    value = Column(Integer, nullable=True)  # e.g., 85 for 85% accuracy
    metadata = Column(JSON, nullable=True)  # Additional context

    # Status
    is_card_generated = Column(Integer, default=0)  # 0=no, 1=yes

    # Timestamps
    achieved_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="achievements")
    learning_session = relationship("LearningSession", back_populates="achievements")
    praise_card = relationship(
        "PraiseCard", back_populates="achievement", uselist=False
    )

    def __repr__(self):
        return f"<Achievement {self.achievement_type} - {self.title}>"
