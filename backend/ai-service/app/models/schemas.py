from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class AnalysisRequest(BaseModel):
    content: str = Field(..., min_length=50, description="The argument text to analyze")
    argument_id: str = Field(..., description="The argument ID from the database")


class FallacyInstance(BaseModel):
    name: str
    category: str
    excerpt: str
    explanation: str
    severity: str
    position_start: Optional[int] = None
    position_end: Optional[int] = None


class LogicalStructure(BaseModel):
    premises: List[str] = []
    conclusion: Optional[str] = None
    argument_type: Optional[str] = None


class PremiseAnalysis(BaseModel):
    sound_premises: List[str] = []
    questionable_premises: List[Dict[str, str]] = []


class ConclusionAnalysis(BaseModel):
    is_valid: bool
    explanation: str


class AnalysisResponse(BaseModel):
    argument_id: str
    refutation_id: str
    analysis_summary: str
    logical_structure: Optional[LogicalStructure] = None
    premise_analysis: Optional[PremiseAnalysis] = None
    conclusion_analysis: Optional[ConclusionAnalysis] = None
    refutation_text: str
    correct_reasoning: Optional[str] = None
    guided_questions: List[str] = []
    fallacies: List[FallacyInstance] = []
    confidence_score: float = Field(ge=0.0, le=1.0)
    processing_time_ms: int
    created_at: datetime


class HealthResponse(BaseModel):
    status: str
    message: str
    timestamp: datetime
    version: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    timestamp: datetime
