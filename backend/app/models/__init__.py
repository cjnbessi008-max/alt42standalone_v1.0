"""
Data models for the hint system
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DifficultyLevel(str, Enum):
    """Difficulty levels for problems"""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class HintType(str, Enum):
    """Types of hints"""
    CONCEPTUAL = "conceptual"  # Hints about underlying concepts
    STRATEGIC = "strategic"  # Hints about problem-solving strategies
    PROCEDURAL = "procedural"  # Hints about steps to take


class HintRequest(BaseModel):
    """Request for a hint"""
    student_id: str
    problem_id: str
    problem_description: str
    student_work: Optional[str] = None  # What the student has tried so far
    previous_hints: List[str] = Field(default_factory=list)
    hint_level: int = Field(default=1, ge=1, le=5)  # 1 is most subtle, 5 is most direct
    subject: str = "mathematics"
    grade_level: Optional[str] = None


class HintResponse(BaseModel):
    """Response containing the generated hint"""
    hint_id: str
    hint_text: str
    hint_type: HintType
    hint_level: int
    next_hint_available: bool
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProblemContext(BaseModel):
    """Context about a problem for hint generation"""
    problem_id: str
    problem_description: str
    correct_answer: Optional[str] = None  # NOT shared with student
    difficulty: DifficultyLevel
    concepts: List[str]  # Mathematical concepts involved
    common_mistakes: List[str] = Field(default_factory=list)


class StudentProgress(BaseModel):
    """Student's progress on a problem"""
    student_id: str
    problem_id: str
    attempts: int = 0
    hints_received: List[str] = Field(default_factory=list)
    current_hint_level: int = 0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    completed: bool = False
