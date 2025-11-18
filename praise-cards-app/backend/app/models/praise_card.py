from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from ..database import Base


class PraiseCard(Base):
    __tablename__ = "praise_cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    achievement_id = Column(
        UUID(as_uuid=True), ForeignKey("achievements.id"), nullable=False, unique=True
    )

    # Card content
    title = Column(String(200), nullable=False)
    ai_message = Column(Text, nullable=False)  # AI-generated encouragement
    card_design = Column(
        String(50), default="default"
    )  # Card theme/template (default, star, trophy, etc.)

    # Stats
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)

    # Visibility
    is_visible = Column(Integer, default=1)  # 0=hidden, 1=visible

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="praise_cards")
    achievement = relationship("Achievement", back_populates="praise_card")
    interactions = relationship("CardInteraction", back_populates="praise_card")

    def __repr__(self):
        return f"<PraiseCard {self.title} - {self.likes_count} likes>"
