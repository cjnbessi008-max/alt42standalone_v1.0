from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel


class ChecklistType(str, enum.Enum):
    """Checklist type enum"""
    GENERATION_PIPELINE = "generation_pipeline"  # For teachers tracking module creation
    LEARNING_PROGRESS = "learning_progress"  # For students tracking learning steps
    QUALITY_ASSURANCE = "quality_assurance"  # For admins reviewing modules


class Checklist(BaseModel):
    """Checklist model for tracking progress"""
    __tablename__ = "checklists"

    title = Column(String(255), nullable=False)
    description = Column(Text)
    checklist_type = Column(Enum(ChecklistType), nullable=False)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"), nullable=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=True)
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("teachers.id"), nullable=True)
    total_items = Column(Integer, default=0)
    completed_items = Column(Integer, default=0)
    auto_generated = Column(Boolean, default=True)

    # Relationships
    module = relationship("Module", back_populates="checklists")
    items = relationship("ChecklistItem", back_populates="checklist", cascade="all, delete-orphan")


class ChecklistItem(BaseModel):
    """Individual checklist item"""
    __tablename__ = "checklist_items"

    checklist_id = Column(UUID(as_uuid=True), ForeignKey("checklists.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    order = Column(Integer, nullable=False)
    is_completed = Column(Boolean, default=False)
    is_required = Column(Boolean, default=True)
    depends_on = Column(UUID(as_uuid=True), ForeignKey("checklist_items.id"), nullable=True)

    # Link to pipeline stage for generation checklists
    pipeline_stage = Column(String(50), nullable=True)

    # Progress tracking
    progress_percentage = Column(Integer, default=0)

    # Relationships
    checklist = relationship("Checklist", back_populates="items")
