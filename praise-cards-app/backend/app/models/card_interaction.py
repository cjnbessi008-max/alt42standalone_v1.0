from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum

from ..database import Base


class InteractionType(str, enum.Enum):
    LIKE = "like"
    COMMENT = "comment"
    VIEW = "view"


class CardInteraction(Base):
    __tablename__ = "card_interactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    praise_card_id = Column(
        UUID(as_uuid=True), ForeignKey("praise_cards.id"), nullable=False
    )
    student_id = Column(
        UUID(as_uuid=True), ForeignKey("students.id"), nullable=False
    )  # Who interacted

    # Interaction details
    interaction_type = Column(Enum(InteractionType), nullable=False)
    comment_text = Column(Text, nullable=True)  # Only for COMMENT type

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    praise_card = relationship("PraiseCard", back_populates="interactions")
    student = relationship("Student", back_populates="card_interactions")

    # Constraints: one like per student per card
    __table_args__ = (
        UniqueConstraint(
            "praise_card_id",
            "student_id",
            "interaction_type",
            name="uq_card_student_like",
        ),
    )

    def __repr__(self):
        return f"<CardInteraction {self.interaction_type} by Student {self.student_id}>"
