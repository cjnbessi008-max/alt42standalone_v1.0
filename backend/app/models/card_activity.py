"""
카드 활동 로그 모델
"""
from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..core.database import Base


class CardActivity(Base):
    """카드 활동 로그"""
    __tablename__ = "card_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    card_id = Column(UUID(as_uuid=True), ForeignKey("routine_cards.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(String(50), nullable=False)
    activity_data = Column(JSONB, default={})
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"), index=True)

    # Relationships
    card = relationship("RoutineCard", back_populates="activities")
    student = relationship("Student", back_populates="card_activities")
