from pydantic import BaseModel, Field
from typing import List, Literal


class ValidationError(BaseModel):
    field: str
    message: str
    type: Literal['bracket', 'sign', 'format', 'general']


class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[ValidationError]


class SubmissionData(BaseModel):
    answer: str = Field(..., min_length=1, description="학생이 제출한 답안")
    problem_id: str | None = Field(None, description="문제 ID")
    student_id: str | None = Field(None, description="학생 ID")


class SubmissionResponse(BaseModel):
    success: bool
    validation_result: ValidationResult
    message: str
