"""
Pydantic schemas for problem-related endpoints
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class InverseProblemBase(BaseModel):
    """Base schema for inverse problems"""
    function_type: str = Field(..., description="Type of function (linear, quadratic, etc.)")
    original_function: str = Field(..., description="Original function expression")
    difficulty_level: str = Field("medium", regex="^(easy|medium|hard)$")
    tags: Optional[List[str]] = None


class InverseProblemCreate(InverseProblemBase):
    """Schema for creating a new problem"""
    module_id: Optional[UUID] = None
    external_question_id: Optional[str] = None
    domain_min: Optional[Decimal] = -10
    domain_max: Optional[Decimal] = 10


class InverseProblemUpdate(BaseModel):
    """Schema for updating a problem"""
    function_type: Optional[str] = None
    original_function: Optional[str] = None
    inverse_function: Optional[str] = None
    difficulty_level: Optional[str] = None
    tags: Optional[List[str]] = None
    visualization_config: Optional[Dict[str, Any]] = None


class InverseProblemResponse(InverseProblemBase):
    """Schema for problem responses"""
    id: UUID
    module_id: Optional[UUID]
    inverse_function: str
    domain_min: Optional[Decimal]
    domain_max: Optional[Decimal]
    hints: Optional[List[Dict[str, Any]]] = []
    solution_steps: Optional[List[str]] = []
    key_concepts: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GenerateProblemRequest(BaseModel):
    """Request schema for AI problem generation"""
    original_function: str = Field(..., description="Original function to analyze")
    function_type: str = Field(..., description="Type of function")
    difficulty_level: str = Field("medium", regex="^(easy|medium|hard)$")
    module_id: Optional[UUID] = None
    tags: Optional[List[str]] = None
    visualization_config: Optional[Dict[str, Any]] = Field(
        default={
            "show_grid": True,
            "show_reflection_line": True,
            "animation_speed": "medium",
            "color_original": "#2196F3",
            "color_inverse": "#F44336",
            "color_reflection_line": "#4CAF50"
        }
    )
