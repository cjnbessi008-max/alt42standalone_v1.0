"""
Pydantic Schemas for Problem API
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class RuleType(str, Enum):
    """Derivative rule types"""
    POWER_RULE = "power_rule"
    CHAIN_RULE = "chain_rule"
    PRODUCT_RULE = "product_rule"
    QUOTIENT_RULE = "quotient_rule"
    CONSTANT_RULE = "constant_rule"
    SUM_RULE = "sum_rule"


class DifficultyLevel(str, Enum):
    """Problem difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class DerivativeRuleBase(BaseModel):
    """Base schema for derivative rules"""
    rule_name: str
    rule_type: RuleType
    rule_formula: str
    description: Optional[str] = None


class DerivativeRuleResponse(DerivativeRuleBase):
    """Response schema for derivative rules"""
    id: int
    display_order: int
    is_core_rule: bool

    class Config:
        from_attributes = True


class DetectedRuleResponse(BaseModel):
    """Response schema for detected rules"""
    rule_id: int
    rule_name: str
    rule_type: RuleType
    rule_formula: str
    matched_expression: Optional[str] = None
    highlight_start: Optional[int] = None
    highlight_end: Optional[int] = None
    confidence_score: float = 1.0
    ai_explanation: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class ProblemCreate(BaseModel):
    """Schema for creating a problem"""
    problem_text: str = Field(..., min_length=1)
    problem_latex: Optional[str] = None
    difficulty_level: DifficultyLevel = DifficultyLevel.MEDIUM


class ProblemFromMoodle(BaseModel):
    """Schema for fetching problem from Moodle"""
    question_id: int = Field(..., gt=0)


class ProblemResponse(BaseModel):
    """Response schema for problems"""
    id: int
    moodle_question_id: Optional[int] = None
    problem_text: str
    problem_latex: Optional[str] = None
    difficulty_level: DifficultyLevel
    ai_analysis: Optional[str] = None
    detected_rules: List[DetectedRuleResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AnalysisRequest(BaseModel):
    """Schema for analysis request"""
    problem_text: str = Field(..., min_length=1)
    use_ai: bool = True


class AnalysisResponse(BaseModel):
    """Schema for analysis response"""
    success: bool
    problem_id: int
    problem_text: str
    problem_latex: Optional[str] = None
    detected_rules: List[DetectedRuleResponse]
    ai_analysis: Optional[str] = None
    processing_time_ms: float
