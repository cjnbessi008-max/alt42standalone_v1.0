from sqlalchemy import Column, String, Integer, Text, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin, UUIDMixin


class Hint(Base, UUIDMixin, TimestampMixin):
    """
    Hint model - stores generated hints at different levels
    """
    __tablename__ = "hints"

    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id"), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    level = Column(Integer, nullable=False)  # 1, 2, or 3
    content = Column(Text, nullable=False)

    # Metadata about hint generation
    metadata = Column(JSON, nullable=True)  # {generation_time, model_used, token_count}

    # Relationships
    problem = relationship("Problem", back_populates="hints")

    def __repr__(self):
        return f"<Hint(id={self.id}, problem_id={self.problem_id}, level={self.level})>"
