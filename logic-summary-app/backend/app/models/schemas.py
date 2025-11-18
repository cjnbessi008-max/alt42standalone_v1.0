from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PropositionItem(BaseModel):
    """Single logical proposition extracted from a problem"""
    id: str
    text: str
    type: str  # premise, conclusion, assumption, etc.
    confidence: float = Field(ge=0.0, le=1.0)

class ProblemCreate(BaseModel):
    """Schema for creating a new problem"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    problem_type: str = Field(default="logic")
    grade_level: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Fraction Addition Problem",
                "content": "If you have 1/4 of a pizza and your friend gives you 2/4 of a pizza, how much pizza do you have in total?",
                "problem_type": "math",
                "grade_level": "3rd grade"
            }
        }

class ProblemResponse(BaseModel):
    """Schema for problem response"""
    id: int
    title: str
    content: str
    problem_type: str
    grade_level: Optional[str]
    propositions: Optional[List[PropositionItem]]
    logic_summary: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LogicSummaryRequest(BaseModel):
    """Request to generate logic summary for a problem"""
    problem_id: int

class LogicSummaryResponse(BaseModel):
    """Response containing logic summary"""
    problem_id: int
    propositions: List[PropositionItem]
    logic_summary: str
    visualization_data: Optional[dict] = None
