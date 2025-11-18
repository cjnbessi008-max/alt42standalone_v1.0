"""
Gap analysis models
"""
from sqlalchemy import Column, String, Text, Integer, Numeric, Enum, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class GapSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class GapAnalysis(Base):
    __tablename__ = "gap_analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    solution_id = Column(UUID(as_uuid=True), ForeignKey("solutions.id", ondelete="CASCADE"), nullable=False)

    # Scores (0-100)
    completeness_score = Column(Numeric(5, 2), nullable=False)
    logic_continuity_score = Column(Numeric(5, 2), nullable=False)
    correctness_score = Column(Numeric(5, 2), nullable=False)
    overall_score = Column(Numeric(5, 2), nullable=False)

    # Gap metrics
    total_gaps_detected = Column(Integer, default=0)
    critical_gaps_count = Column(Integer, default=0)
    missing_steps_count = Column(Integer, default=0)
    logical_errors_count = Column(Integer, default=0)

    # AI analysis
    ai_summary = Column(Text)
    ai_feedback = Column(Text)
    ai_model_used = Column(String(100))

    detailed_analysis = Column(JSONB, default={})

    analyzed_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class DetectedGap(Base):
    __tablename__ = "detected_gaps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("gap_analyses.id", ondelete="CASCADE"), nullable=False)

    gap_type = Column(String(100), nullable=False)
    severity = Column(Enum(GapSeverity), nullable=False)

    after_step_number = Column(Integer)
    before_step_number = Column(Integer)

    description = Column(Text, nullable=False)
    expected_content = Column(Text)
    suggestion = Column(Text)

    metadata = Column(JSONB, default={})
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class StepComparison(Base):
    __tablename__ = "step_comparisons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("gap_analyses.id", ondelete="CASCADE"), nullable=False)

    student_step_number = Column(Integer)
    expected_step_number = Column(Integer)

    similarity_score = Column(Numeric(5, 2))
    match_type = Column(String(50))

    student_content = Column(Text)
    expected_content = Column(Text)

    comparison_notes = Column(Text)
    metadata = Column(JSONB, default={})

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class FeedbackItem(Base):
    __tablename__ = "feedback_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("gap_analyses.id", ondelete="CASCADE"), nullable=False)

    feedback_type = Column(String(50), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(Integer, default=1)

    related_step_number = Column(Integer)
    metadata = Column(JSONB, default={})

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
