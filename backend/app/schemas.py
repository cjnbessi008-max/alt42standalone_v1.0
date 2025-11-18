from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ProblemBase(BaseModel):
    problem_type: str = "fraction_addition"
    question_text: str
    correct_numerator: int
    correct_denominator: int
    difficulty: str = "medium"


class ProblemCreate(ProblemBase):
    pass


class Problem(ProblemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AnswerSubmit(BaseModel):
    student_id: str
    problem_id: int
    answer_numerator: int
    answer_denominator: int


class PredictionRequest(BaseModel):
    student_id: str
    problem_id: int
    answer_numerator: int
    answer_denominator: int
    correct_numerator: int
    correct_denominator: int


class PredictionResponse(BaseModel):
    is_likely_wrong: bool
    error_type: Optional[str] = None
    explanation: Optional[str] = None
    suggestion: Optional[str] = None
    confidence: float


class AttemptResponse(BaseModel):
    id: int
    is_correct: bool
    prediction_was_shown: bool
    correct_answer: str
    message: str

    class Config:
        from_attributes = True
