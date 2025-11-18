from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class ChecklistType(str, Enum):
    """Checklist type enum"""
    GENERATION_PIPELINE = "generation_pipeline"
    LEARNING_PROGRESS = "learning_progress"
    QUALITY_ASSURANCE = "quality_assurance"


class ChecklistItemBase(BaseModel):
    """Base checklist item schema"""
    title: str
    description: Optional[str] = None
    order: int
    is_required: bool = True
    depends_on: Optional[UUID] = None
    pipeline_stage: Optional[str] = None


class ChecklistItemCreate(ChecklistItemBase):
    """Schema for creating checklist item"""
    pass


class ChecklistItemUpdate(BaseModel):
    """Schema for updating checklist item"""
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)


class ChecklistItemResponse(ChecklistItemBase):
    """Schema for checklist item response"""
    id: UUID
    checklist_id: UUID
    is_completed: bool
    progress_percentage: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChecklistBase(BaseModel):
    """Base checklist schema"""
    title: str
    description: Optional[str] = None
    checklist_type: ChecklistType


class ChecklistCreate(ChecklistBase):
    """Schema for creating checklist"""
    module_id: Optional[UUID] = None
    student_id: Optional[UUID] = None
    teacher_id: Optional[UUID] = None


class ChecklistResponse(ChecklistBase):
    """Schema for checklist response"""
    id: UUID
    module_id: Optional[UUID] = None
    student_id: Optional[UUID] = None
    teacher_id: Optional[UUID] = None
    total_items: int
    completed_items: int
    auto_generated: bool
    created_at: datetime
    updated_at: datetime
    items: List[ChecklistItemResponse] = []

    class Config:
        from_attributes = True


class ChecklistProgressUpdate(BaseModel):
    """Schema for updating checklist progress"""
    item_id: UUID
    is_completed: bool
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
