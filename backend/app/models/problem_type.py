"""
Problem Type model
"""
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from ..database import Base


class ProblemType(Base):
    __tablename__ = "problem_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # 'arithmetic', 'algebra', 'geometry'
    description = Column(Text)
    difficulty_level = Column(Integer)  # 1-5
    expected_solve_time_seconds = Column(Integer)  # Expected time to solve
    parent_type_id = Column(UUID(as_uuid=True), ForeignKey("problem_types.id"), nullable=True)
    metadata = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Self-referential relationship for hierarchy
    parent = relationship("ProblemType", remote_side=[id], backref="children")

    # Relationships
    problems = relationship("Problem", back_populates="problem_type")
    attempts = relationship("StudentAttempt", back_populates="problem_type")
    bottlenecks = relationship("BottleneckDetection", back_populates="problem_type")
    performance_metrics = relationship("PerformanceMetric", back_populates="problem_type")

    def __repr__(self):
        return f"<ProblemType(id={self.id}, name={self.name}, category={self.category})>"
