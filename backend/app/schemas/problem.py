"""
Problem and Pattern schemas
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Any
from ..models.problem import DifficultyLevel


class PatternTypeResponse(BaseModel):
    """Pattern type response schema"""
    id: int
    name: str
    description: Optional[str]
    difficulty_level: DifficultyLevel
    pattern_rule: str

    class Config:
        from_attributes = True


class ProblemBase(BaseModel):
    """Base problem schema"""
    title: str
    description: Optional[str] = None
    pattern_hint: Optional[str] = None
    difficulty_level: DifficultyLevel
    time_limit_seconds: int = 300
    max_attempts: int = 3
    points: int = 10


class ProblemCreate(ProblemBase):
    """Problem creation schema"""
    pattern_type_id: int
    moodle_question_id: Optional[int] = None
    initial_sequence: List[str]
    target_sequence: List[str]


class ProblemResponse(ProblemBase):
    """Problem response schema"""
    id: int
    pattern_type_id: int
    moodle_question_id: Optional[int]
    initial_sequence: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProblemDetailResponse(ProblemResponse):
    """Detailed problem response with pattern type"""
    pattern_type: PatternTypeResponse


class AttemptCreate(BaseModel):
    """Attempt creation schema"""
    problem_id: int
    student_id: int
    submitted_sequence: List[str]
    time_spent_seconds: Optional[int] = None


class AttemptResponse(BaseModel):
    """Attempt response schema"""
    id: int
    student_id: int
    problem_id: int
    submitted_sequence: List[str]
    is_correct: bool
    time_spent_seconds: Optional[int]
    score: int
    attempt_number: int
    feedback: Optional[str]
    submitted_at: datetime

    class Config:
        from_attributes = True


class StudentProgressResponse(BaseModel):
    """Student progress response schema"""
    id: int
    student_id: int
    pattern_type_id: int
    problems_attempted: int
    problems_solved: int
    total_score: int
    average_time_seconds: Optional[float]
    mastery_level: float
    last_activity_at: datetime
    pattern_type: PatternTypeResponse

    class Config:
        from_attributes = True
