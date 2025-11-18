"""
Problem model
"""
from sqlalchemy import Column, String, Text, Enum, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class ProblemDifficulty(str, enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"
    EXPERT = "EXPERT"


class ProblemSubject(str, enum.Enum):
    MATHEMATICS = "MATHEMATICS"
    PHYSICS = "PHYSICS"
    CHEMISTRY = "CHEMISTRY"
    PROGRAMMING = "PROGRAMMING"
    LOGIC = "LOGIC"


class Problem(Base):
    __tablename__ = "problems"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    subject = Column(Enum(ProblemSubject), nullable=False)
    difficulty = Column(Enum(ProblemDifficulty), nullable=False)
    expected_steps = Column(JSONB, nullable=False, default=[])
    expected_reasoning = Column(Text)
    metadata = Column(JSONB, default={})
    created_by = Column(String(255))
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())
