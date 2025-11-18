"""
Solution models
"""
from sqlalchemy import Column, String, Text, Integer, Enum, TIMESTAMP, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class SolutionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    ANALYZED = "ANALYZED"
    REVIEWED = "REVIEWED"


class StepType(str, enum.Enum):
    GIVEN = "GIVEN"
    ASSUMPTION = "ASSUMPTION"
    CALCULATION = "CALCULATION"
    REASONING = "REASONING"
    CONCLUSION = "CONCLUSION"


class Solution(Base):
    __tablename__ = "solutions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(SolutionStatus), default=SolutionStatus.DRAFT)
    submitted_steps = Column(JSONB, nullable=False, default=[])
    raw_input = Column(Text)
    time_spent_seconds = Column(Integer, default=0)
    submitted_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class SolutionStep(Base):
    __tablename__ = "solution_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    solution_id = Column(UUID(as_uuid=True), ForeignKey("solutions.id", ondelete="CASCADE"), nullable=False)
    step_number = Column(Integer, nullable=False)
    step_type = Column(Enum(StepType), nullable=False)
    content = Column(Text, nullable=False)
    explanation = Column(Text)
    metadata = Column(JSONB, default={})
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('solution_id', 'step_number', name='uq_solution_step'),
    )
