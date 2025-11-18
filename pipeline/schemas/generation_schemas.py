"""
Pydantic schemas for generation pipeline endpoints
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from enum import Enum


class RequestType(str, Enum):
    """Types of generation requests"""
    NEW_MODULE = "new_module"
    MODIFY_MODULE = "modify_module"
    GENERATE_PROBLEMS = "generate_problems"


class GenerationStatus(str, Enum):
    """Status of generation requests"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class GenerationRequestCreate(BaseModel):
    """Schema for creating a generation request"""
    teacher_id: UUID = Field(..., description="ID of the requesting teacher")
    request_text: str = Field(..., description="Natural language request from teacher")
    request_type: RequestType = Field(default=RequestType.NEW_MODULE)
    module_type: Optional[str] = Field(None, description="Target module type")


class GenerationRequestResponse(BaseModel):
    """Schema for generation request responses"""
    id: UUID
    teacher_id: UUID
    request_text: str
    status: GenerationStatus
    current_stage: Optional[str]
    progress_percentage: int = 0
    created_at: datetime

    class Config:
        from_attributes = True
