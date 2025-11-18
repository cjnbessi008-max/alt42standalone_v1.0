"""
Efficiency Score models - TES calculation and history.
"""
from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, Numeric, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid

from ..database import Base


class EfficiencyScore(Base):
    """
    Current Thought Efficiency Score (TES) for a student in a module.
    """

    __tablename__ = "efficiency_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Student and module
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False, index=True)

    # Overall TES
    tes_score = Column(Numeric(5, 2), nullable=False)  # 0-100
    tes_percentile = Column(Integer, nullable=True)  # 0-100
    tes_grade = Column(String(2), nullable=True)  # A, B, C, D, F

    # Component scores (0-100 each)
    correctness_score = Column(Numeric(5, 2), nullable=False)
    speed_score = Column(Numeric(5, 2), nullable=False)
    first_try_score = Column(Numeric(5, 2), nullable=False)
    consistency_score = Column(Numeric(5, 2), nullable=False)

    # Raw metrics
    total_attempts = Column(Integer, nullable=False)
    correct_attempts = Column(Integer, nullable=False)
    total_problems = Column(Integer, nullable=False)
    first_try_correct = Column(Integer, nullable=False)
    avg_time_seconds = Column(Numeric(10, 2), nullable=False)

    # Problem type breakdown (JSONB for flexibility)
    problem_type_scores = Column(JSONB, nullable=True)  # {"visualization": 95, "addition": 85}

    # Cohort context
    cohort_id = Column(String(100), nullable=True, index=True)
    cohort_median_time = Column(Numeric(10, 2), nullable=True)
    cohort_avg_tes = Column(Numeric(5, 2), nullable=True)

    # Data quality flag
    sufficient_data = Column(Boolean, default=False, index=True)  # True if >= 10 attempts

    # Timestamps
    calculated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    data_last_updated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="efficiency_scores")
    module = relationship("Module", back_populates="efficiency_scores")
    history = relationship("EfficiencyScoreHistory", back_populates="efficiency_score", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<EfficiencyScore {self.tes_score} ({self.tes_grade}) - Student {self.student_id}>"


class EfficiencyScoreHistory(Base):
    """
    Historical snapshots of TES scores for trend analysis.
    """

    __tablename__ = "efficiency_score_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Reference to current score
    efficiency_score_id = Column(UUID(as_uuid=True), ForeignKey("efficiency_scores.id"), nullable=False, index=True)

    # Denormalized for faster queries
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False, index=True)

    # Snapshot data
    tes_score = Column(Numeric(5, 2), nullable=False)
    correctness_score = Column(Numeric(5, 2), nullable=False)
    speed_score = Column(Numeric(5, 2), nullable=False)
    first_try_score = Column(Numeric(5, 2), nullable=False)
    consistency_score = Column(Numeric(5, 2), nullable=False)

    # Context at snapshot time
    total_attempts_at_snapshot = Column(Integer, nullable=False)
    snapshot_date = Column(Date, nullable=False, index=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    efficiency_score = relationship("EfficiencyScore", back_populates="history")

    def __repr__(self):
        return f"<EfficiencyScoreHistory {self.snapshot_date} - TES {self.tes_score}>"
