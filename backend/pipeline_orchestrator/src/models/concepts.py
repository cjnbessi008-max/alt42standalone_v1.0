from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID, uuid4


class ConceptBase(BaseModel):
    """Base model for concept data"""
    concept_name: str = Field(..., max_length=255, description="Name of the concept")
    one_line_summary: str = Field(..., max_length=200, description="One-line summary of the concept")
    concept_description: Optional[str] = Field(None, description="Detailed description")
    difficulty_level: int = Field(default=1, ge=1, le=5, description="Difficulty level (1-5)")
    prerequisite_concepts: List[str] = Field(default_factory=list)
    teacher_notes: Optional[str] = None


class ConceptCreate(ConceptBase):
    """Model for creating a new concept"""
    module_id: UUID
    problem_id: Optional[UUID] = None


class ConceptUpdate(BaseModel):
    """Model for updating an existing concept"""
    one_line_summary: Optional[str] = Field(None, max_length=200)
    concept_description: Optional[str] = None
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)
    prerequisite_concepts: Optional[List[str]] = None
    teacher_verified: Optional[bool] = None
    teacher_notes: Optional[str] = None


class Concept(ConceptBase):
    """Full concept model with database fields"""
    id: UUID = Field(default_factory=uuid4)
    module_id: UUID
    problem_id: Optional[UUID] = None
    generated_by_ai: bool = True
    auto_generated_summary: Optional[str] = None
    teacher_verified: bool = False
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConceptSummaryBase(BaseModel):
    """Base model for concept summary"""
    summary_text: str = Field(..., max_length=200, description="The summary text")
    generation_prompt: Optional[str] = None
    llm_model: str = Field(default="claude-3-sonnet-20240229")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class ConceptSummaryCreate(ConceptSummaryBase):
    """Model for creating a concept summary"""
    concept_id: UUID
    summary_version: int = 1


class ConceptSummary(ConceptSummaryBase):
    """Full concept summary model"""
    id: UUID = Field(default_factory=uuid4)
    concept_id: UUID
    summary_version: int
    approved_by_teacher: bool = False
    teacher_id: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConceptSummaryRequest(BaseModel):
    """Request model for generating concept summaries"""
    concept_name: str
    concept_description: Optional[str] = None
    grade_level: int = Field(..., ge=1, le=12)
    module_context: Optional[str] = None
    related_concepts: List[str] = Field(default_factory=list)


class ConceptSummaryResponse(BaseModel):
    """Response model from AI generation"""
    summary: str = Field(..., max_length=200)
    alternative_summaries: List[str] = Field(default_factory=list)
    confidence: float = Field(..., ge=0.0, le=1.0)
    rationale: str


class ConceptWithSummaries(Concept):
    """Concept model with all its summaries"""
    summaries: List[ConceptSummary] = Field(default_factory=list)
    current_summary: Optional[ConceptSummary] = None
