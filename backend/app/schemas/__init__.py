"""
Pydantic schemas for request/response validation.
"""
from .user import TeacherCreate, TeacherResponse, StudentCreate, StudentResponse
from .module import ModuleCreate, ModuleResponse, ProblemCreate, ProblemResponse
from .attempt import AttemptCreate, AttemptResponse
from .efficiency import EfficiencyScoreResponse, TESCalculationRequest, TESCalculationResponse

__all__ = [
    "TeacherCreate",
    "TeacherResponse",
    "StudentCreate",
    "StudentResponse",
    "ModuleCreate",
    "ModuleResponse",
    "ProblemCreate",
    "ProblemResponse",
    "AttemptCreate",
    "AttemptResponse",
    "EfficiencyScoreResponse",
    "TESCalculationRequest",
    "TESCalculationResponse",
]
