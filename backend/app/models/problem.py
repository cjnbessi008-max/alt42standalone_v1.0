from sqlalchemy import Column, String, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin, UUIDMixin


class Problem(Base, UUIDMixin, TimestampMixin):
    """
    Problem model - represents educational problems/questions
    """
    __tablename__ = "problems"

    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False, index=True)
    type = Column(String(100), nullable=False)  # e.g., 'fraction_addition', 'algebra_solve'
    question = Column(Text, nullable=False)
    difficulty = Column(Integer, nullable=False, default=1)  # 1-5 scale
    correct_answer = Column(Text, nullable=False)

    # Relationships
    module = relationship("Module", back_populates="problems")
    hints = relationship("Hint", back_populates="problem", cascade="all, delete-orphan")
    student_progress = relationship("StudentProgress", back_populates="problem", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Problem(id={self.id}, type={self.type}, difficulty={self.difficulty})>"
