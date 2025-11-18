from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime
from app.models.problem import ProblemType, DifficultyLevel


class ProblemBase(BaseModel):
    """Base problem schema"""
    title: str
    problem_type: ProblemType
    difficulty_level: DifficultyLevel = DifficultyLevel.MEDIUM
    subject: str
    grade_level: str
    reading_content: str = Field(..., description="Content displayed in reading stage")
    reading_visual_url: Optional[str] = Field(None, description="URL to visual aid for reading stage")
    question_text: str = Field(..., description="Question displayed in solving stage")
    correct_answer: str
    answer_options: Optional[Dict[str, str]] = Field(None, description="Options for multiple choice")
    explanation: Optional[str] = Field(None, description="Explanation shown after submission")
    tags: List[str] = Field(default_factory=list)


class ProblemCreate(ProblemBase):
    """Schema for creating a new problem"""
    pass


class ProblemUpdate(BaseModel):
    """Schema for updating a problem"""
    title: Optional[str] = None
    problem_type: Optional[ProblemType] = None
    difficulty_level: Optional[DifficultyLevel] = None
    subject: Optional[str] = None
    grade_level: Optional[str] = None
    reading_content: Optional[str] = None
    reading_visual_url: Optional[str] = None
    question_text: Optional[str] = None
    correct_answer: Optional[str] = None
    answer_options: Optional[Dict[str, str]] = None
    explanation: Optional[str] = None
    tags: Optional[List[str]] = None


class ProblemResponse(ProblemBase):
    """Schema for problem response"""
    id: str
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProblemReadingStage(BaseModel):
    """Schema for reading stage content (hides answer)"""
    id: str
    title: str
    problem_type: ProblemType
    difficulty_level: DifficultyLevel
    subject: str
    grade_level: str
    reading_content: str
    reading_visual_url: Optional[str]
    tags: List[str]

    class Config:
        from_attributes = True


class ProblemSolvingStage(BaseModel):
    """Schema for solving stage content"""
    id: str
    title: str
    problem_type: ProblemType
    question_text: str
    answer_options: Optional[Dict[str, str]]

    class Config:
        from_attributes = True
