from sqlalchemy import Column, Enum, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel


class PipelineStage(str, enum.Enum):
    """Pipeline stage enum"""
    WORLD_MODEL = "world_model"
    RULES = "rules"
    DATA = "data"
    INPUT_STRATEGY = "input_strategy"
    UI = "ui"
    DEPLOYMENT = "deployment"


class JobStatus(str, enum.Enum):
    """Job status enum"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class GenerationJob(BaseModel):
    """Generation job tracking model"""
    __tablename__ = "generation_jobs"

    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=False)
    stage = Column(Enum(PipelineStage), nullable=False)
    status = Column(Enum(JobStatus), default=JobStatus.PENDING, nullable=False)
    input_data = Column(JSONB)
    output_data = Column(JSONB)
    error_log = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

    # Relationships
    module = relationship("Module", back_populates="generation_jobs")
