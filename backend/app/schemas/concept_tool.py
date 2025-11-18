"""Concept Tool schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ConceptToolBase(BaseModel):
    """Base concept tool schema."""
    tool_name: str = Field(..., description="Unique tool name")
    tool_category: Optional[str] = Field(None, description="Tool category")
    description: Optional[str] = Field(None, description="Tool description")
    difficulty_level: Optional[str] = Field(None, description="Difficulty: easy, medium, hard")
    target_grade_levels: Optional[str] = Field(None, description="Comma-separated grade levels")
    learning_objectives: Optional[List[str]] = Field(None, description="Learning objectives")


class ConceptToolCreate(ConceptToolBase):
    """Schema for creating a concept tool."""
    pass


class ConceptToolResponse(ConceptToolBase):
    """Schema for concept tool response."""
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
