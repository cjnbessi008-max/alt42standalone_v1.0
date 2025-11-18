"""
Pydantic schemas for request/response validation
"""
from app.schemas.analysis import AnalysisRequest, AnalysisResponse, InefficientDetection
from app.schemas.submission import SubmissionCreate, SubmissionResponse
from app.schemas.student import StudentCreate, StudentResponse

__all__ = [
    "AnalysisRequest",
    "AnalysisResponse",
    "InefficientDetection",
    "SubmissionCreate",
    "SubmissionResponse",
    "StudentCreate",
    "StudentResponse",
]
