"""
Database models
"""
from app.models.submission import Submission
from app.models.analysis_result import AnalysisResult
from app.models.inefficiency import Inefficiency
from app.models.student import Student

__all__ = ["Submission", "AnalysisResult", "Inefficiency", "Student"]
