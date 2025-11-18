"""
Analysis schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class AnalysisRequest(BaseModel):
    """Request schema for code analysis"""
    code: str = Field(..., description="PHP code to analyze", min_length=1, max_length=50000)
    student_id: Optional[str] = Field(None, description="Student ID (optional)")
    assignment_id: Optional[int] = Field(None, description="Moodle assignment ID (optional)")


class InefficientDetection(BaseModel):
    """Schema for individual inefficiency detection"""
    type: str
    severity: str
    line_number: int
    end_line_number: int
    message: str
    suggestion: str
    code_snippet: str
    estimated_complexity_before: str
    estimated_complexity_after: str
    context: Dict[str, Any] = {}


class AnalysisResponse(BaseModel):
    """Response schema for code analysis"""
    submission_id: Optional[str] = None
    total_loops: int
    inefficient_loops: int
    efficiency_score: float = Field(..., ge=0, le=100)
    total_issues: int
    critical_issues: int
    warning_issues: int
    info_issues: int
    inefficiencies: List[InefficientDetection]
    recommendations: List[str] = []
    analysis_duration_ms: int
    analyzed_at: datetime

    class Config:
        from_attributes = True
