"""
루틴 카드 모델
"""
from sqlalchemy import Column, String, Date, Text, ARRAY, TIMESTAMP, ForeignKey, text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from ..core.database import Base


class RoutineCard(Base):
    """성공 루틴 카드"""
    __tablename__ = "routine_cards"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    card_date = Column(Date, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    learning_goals = Column(ARRAY(Text))
    recommended_activities = Column(JSONB)
    progress_summary = Column(JSONB)
    motivation_message = Column(Text)
    next_steps = Column(ARRAY(Text))
    ai_metadata = Column(JSONB, default={})
    status = Column(String(20), default='active', index=True)
    viewed_at = Column(TIMESTAMP)
    completed_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    __table_args__ = (
        CheckConstraint("status IN ('draft', 'active', 'completed', 'archived')", name="check_status"),
    )

    # Relationships
    student = relationship("Student", back_populates="routine_cards")
    activities = relationship("CardActivity", back_populates="card", cascade="all, delete-orphan")
