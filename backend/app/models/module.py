from sqlalchemy import Column, String, Text, Enum, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel


class ModuleStatus(str, enum.Enum):
    """Module status enum"""
    GENERATING = "generating"
    ACTIVE = "active"
    ARCHIVED = "archived"


class Module(BaseModel):
    """Educational module model"""
    __tablename__ = "modules"

    name = Column(String(255), nullable=False)
    description = Column(Text)
    subject = Column(String(100), default="mathematics")
    grade_level = Column(String(50))
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=False)
    status = Column(Enum(ModuleStatus), default=ModuleStatus.GENERATING, nullable=False)
    world_model = Column(JSONB)  # AI-generated domain model
    generated_schema = Column(JSONB)  # Database schema definition
    generated_ui = Column(JSONB)  # UI component definitions
    version = Column(Integer, default=1)

    # Relationships
    teacher = relationship("Teacher", back_populates="modules")
    generation_jobs = relationship("GenerationJob", back_populates="module")
    checklists = relationship("Checklist", back_populates="module")
