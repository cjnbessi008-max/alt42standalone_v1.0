"""
LMS Integration API Endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging

from services.mock_lms import mock_lms_service
from config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Models
# ============================================================================

class ProblemResponse(BaseModel):
    id: str
    type: str
    title: str
    description: str
    difficulty: int
    grade_level: str
    cases: Optional[List[Dict[str, Any]]] = []


class ProgressUpdateRequest(BaseModel):
    studentId: str
    problemId: str
    progress: float  # 0-100
    completed: bool = False
    score: Optional[float] = None


class GradeSubmission(BaseModel):
    studentId: str
    problemId: str
    grade: float  # 0-100
    feedback: Optional[str] = None


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/problems/{problem_id}", response_model=ProblemResponse)
async def get_problem(problem_id: str):
    """
    Get problem data from LMS (currently mock)

    In production, this would fetch from real Moodle/LMS API
    """
    try:
        logger.info(f"Fetching problem from LMS: {problem_id}")

        problem = await mock_lms_service.get_problem(problem_id)

        if not problem:
            raise HTTPException(status_code=404, detail=f"Problem {problem_id} not found")

        return ProblemResponse(**problem)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching problem: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/problems", response_model=List[ProblemResponse])
async def get_all_problems(
    problem_type: Optional[str] = None,
    grade_level: Optional[str] = None,
    difficulty: Optional[int] = None
):
    """
    Get all problems with optional filters
    """
    try:
        logger.info(f"Fetching problems - Type: {problem_type}, Grade: {grade_level}, Difficulty: {difficulty}")

        problems = await mock_lms_service.get_all_problems(
            problem_type=problem_type,
            grade_level=grade_level,
            difficulty=difficulty
        )

        return [ProblemResponse(**p) for p in problems]

    except Exception as e:
        logger.error(f"Error fetching problems: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/progress/update")
async def update_progress(request: ProgressUpdateRequest):
    """
    Update student progress in LMS
    """
    try:
        logger.info(f"Updating progress - Student: {request.studentId}, Problem: {request.problemId}")

        success = await mock_lms_service.update_student_progress(
            student_id=request.studentId,
            problem_id=request.problemId,
            progress=request.progress,
            completed=request.completed,
            score=request.score
        )

        if not success:
            raise HTTPException(status_code=500, detail="Failed to update progress")

        return {
            "success": True,
            "message": "Progress updated successfully",
            "lms_type": settings.LMS_TYPE
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/grades/submit")
async def submit_grade(request: GradeSubmission):
    """
    Submit grade to LMS gradebook
    """
    try:
        logger.info(f"Submitting grade - Student: {request.studentId}, Problem: {request.problemId}")

        success = await mock_lms_service.submit_grade(
            student_id=request.studentId,
            problem_id=request.problemId,
            grade=request.grade,
            feedback=request.feedback
        )

        if not success:
            raise HTTPException(status_code=500, detail="Failed to submit grade")

        return {
            "success": True,
            "message": "Grade submitted successfully",
            "lms_type": settings.LMS_TYPE
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting grade: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/{student_id}")
async def get_student_info(student_id: str):
    """
    Get student information from LMS
    """
    try:
        logger.info(f"Fetching student info: {student_id}")

        student = await mock_lms_service.get_student_info(student_id)

        return {
            "success": True,
            "student": student,
            "lms_type": settings.LMS_TYPE
        }

    except Exception as e:
        logger.error(f"Error fetching student info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def lms_status():
    """
    Get LMS integration status
    """
    return {
        "status": "connected",
        "lms_type": settings.LMS_TYPE,
        "is_mock": settings.LMS_TYPE == "mock",
        "message": "Using mock LMS service for development" if settings.LMS_TYPE == "mock" else "Connected to real LMS"
    }
