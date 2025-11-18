from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class Comparison(Base):
    __tablename__ = "comparisons"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Student solution being compared
    student_solution_id = Column(String, ForeignKey("solutions.id"), nullable=False)

    # Model solution being compared against
    model_solution_id = Column(String, ForeignKey("solutions.id"), nullable=False)

    # AI-generated comparison results
    similarity_score = Column(Integer, nullable=True)  # 0-100
    feedback = Column(Text, nullable=True)  # AI feedback
    strengths = Column(JSON, nullable=True)  # List of strengths
    improvements = Column(JSON, nullable=True)  # List of suggested improvements
    differences = Column(JSON, nullable=True)  # Detailed differences

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student_solution = relationship("Solution", foreign_keys=[student_solution_id], back_populates="comparisons")
    model_solution_obj = relationship("Solution", foreign_keys=[model_solution_id])
