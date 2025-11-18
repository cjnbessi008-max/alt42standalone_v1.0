"""
FastAPI Backend for AI Education System
Focus: Confidence-building easy problems API
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import uvicorn

# Import confidence builder service
from services.confidence_builder import (
    ConfidenceBuilderService,
    AttemptResult,
    ConfidenceScore,
    EasyProblem
)

# Initialize FastAPI app
app = FastAPI(
    title="AI Education System - Easy Problems API",
    description="API for confidence-building easy problems",
    version="1.0.0"
)

# CORS configuration for web app integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Request/Response Models
# ============================================

class ConfidenceResponse(BaseModel):
    """Response model for confidence score"""
    student_id: str
    module_id: str
    current_score: float = Field(..., ge=0, le=100, description="Current confidence score (0-100)")
    confidence_level: str = Field(..., description="Human-readable confidence level")
    consecutive_correct: int = Field(..., ge=0)
    mastery_count: int = Field(..., ge=0)
    recommended_difficulty: int = Field(..., ge=1, le=3)
    last_updated: datetime


class ProblemData(BaseModel):
    """Problem data model"""
    problem_id: str
    problem_type: str
    difficulty_level: int
    problem_text: str
    hint_text: Optional[str]
    visual_representation: Optional[str]
    # Fraction-specific fields
    numerator_1: Optional[int]
    denominator_1: Optional[int]
    numerator_2: Optional[int]
    denominator_2: Optional[int]
    operation: Optional[str]


class EasyProblemResponse(BaseModel):
    """Response model for easy problem"""
    problem_id: str
    module_id: str
    difficulty_level: int = Field(..., ge=1, le=3)
    confidence_boost: float
    success_rate: Optional[float]
    problem_data: ProblemData


class SubmitAnswerRequest(BaseModel):
    """Request model for submitting an answer"""
    student_id: str
    module_id: str
    problem_id: str
    answer_numerator: int
    answer_denominator: int
    time_spent_seconds: int = Field(..., ge=0)
    hint_used: bool = False


class SubmitAnswerResponse(BaseModel):
    """Response model for answer submission"""
    is_correct: bool
    confidence_before: float
    confidence_after: float
    confidence_delta: float
    correct_answer: Dict
    explanation: str
    encouragement: str


class ConfidenceSummaryResponse(BaseModel):
    """Response model for confidence summary"""
    current_confidence: float
    confidence_level: str
    consecutive_correct: int
    mastery_count: int
    recommended_difficulty: int
    recent_attempts: int
    recent_correct: int
    recent_accuracy: float
    avg_time_seconds: float
    last_attempt: Optional[datetime]


# ============================================
# Database Dependency (Mock for now)
# ============================================

def get_db():
    """
    Database dependency - returns database connection
    TODO: Replace with actual PostgreSQL connection
    """
    from services.confidence_builder import DatabaseConnection
    return DatabaseConnection()


def get_confidence_service(db=Depends(get_db)) -> ConfidenceBuilderService:
    """Get confidence builder service instance"""
    return ConfidenceBuilderService(db)


# ============================================
# API Endpoints
# ============================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Education System - Easy Problems API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now()}


# ============================================
# Confidence Endpoints
# ============================================

@app.get(
    "/api/confidence/{student_id}/{module_id}",
    response_model=ConfidenceResponse,
    tags=["Confidence"]
)
async def get_confidence(
    student_id: str,
    module_id: str,
    service: ConfidenceBuilderService = Depends(get_confidence_service)
):
    """
    Get current confidence score for a student in a module

    Args:
        student_id: Student UUID
        module_id: Module UUID

    Returns:
        Current confidence score and metrics
    """
    try:
        confidence = service.get_confidence_score(student_id, module_id)

        return ConfidenceResponse(
            student_id=confidence.student_id,
            module_id=confidence.module_id,
            current_score=confidence.current_score,
            confidence_level=service._get_confidence_level_label(confidence.current_score),
            consecutive_correct=confidence.consecutive_correct,
            mastery_count=confidence.mastery_count,
            recommended_difficulty=service.get_recommended_difficulty(confidence.current_score),
            last_updated=confidence.last_updated
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get confidence: {str(e)}")


@app.get(
    "/api/confidence/{student_id}/{module_id}/summary",
    response_model=ConfidenceSummaryResponse,
    tags=["Confidence"]
)
async def get_confidence_summary(
    student_id: str,
    module_id: str,
    service: ConfidenceBuilderService = Depends(get_confidence_service)
):
    """
    Get comprehensive confidence summary for a student

    Args:
        student_id: Student UUID
        module_id: Module UUID

    Returns:
        Detailed confidence metrics and recent performance
    """
    try:
        summary = service.get_confidence_summary(student_id, module_id)
        return ConfidenceSummaryResponse(**summary)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")


# ============================================
# Easy Problems Endpoints
# ============================================

@app.get(
    "/api/easy-problems/{student_id}/{module_id}",
    response_model=List[EasyProblemResponse],
    tags=["Easy Problems"]
)
async def get_easy_problems(
    student_id: str,
    module_id: str,
    count: int = 5,
    difficulty: Optional[int] = None,
    service: ConfidenceBuilderService = Depends(get_confidence_service)
):
    """
    Get easy problems suitable for the student's confidence level

    Args:
        student_id: Student UUID
        module_id: Module UUID
        count: Number of problems to return (default: 5)
        difficulty: Optional difficulty override (1-3)

    Returns:
        List of easy problems
    """
    try:
        if difficulty and (difficulty < 1 or difficulty > 3):
            raise HTTPException(
                status_code=400,
                detail="Difficulty must be between 1 and 3"
            )

        problems = service.get_easy_problems(
            student_id,
            module_id,
            count=count,
            difficulty_override=difficulty
        )

        return [
            EasyProblemResponse(
                problem_id=p.problem_id,
                module_id=p.module_id,
                difficulty_level=p.difficulty_level,
                confidence_boost=p.confidence_boost,
                success_rate=p.success_rate,
                problem_data=ProblemData(**p.problem_data)
            )
            for p in problems
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get problems: {str(e)}")


@app.get(
    "/api/easy-problems/{student_id}/{module_id}/next",
    response_model=EasyProblemResponse,
    tags=["Easy Problems"]
)
async def get_next_problem(
    student_id: str,
    module_id: str,
    service: ConfidenceBuilderService = Depends(get_confidence_service)
):
    """
    Get the next recommended easy problem for the student

    Args:
        student_id: Student UUID
        module_id: Module UUID

    Returns:
        Next recommended problem
    """
    try:
        problem = service.get_next_problem(student_id, module_id)

        if not problem:
            raise HTTPException(
                status_code=404,
                detail="No suitable problems found"
            )

        return EasyProblemResponse(
            problem_id=problem.problem_id,
            module_id=problem.module_id,
            difficulty_level=problem.difficulty_level,
            confidence_boost=problem.confidence_boost,
            success_rate=problem.success_rate,
            problem_data=ProblemData(**problem.problem_data)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get next problem: {str(e)}")


# ============================================
# Answer Submission Endpoint
# ============================================

@app.post(
    "/api/submit-answer",
    response_model=SubmitAnswerResponse,
    tags=["Answers"]
)
async def submit_answer(
    request: SubmitAnswerRequest,
    service: ConfidenceBuilderService = Depends(get_confidence_service)
):
    """
    Submit a student's answer to a problem

    Args:
        request: Answer submission data

    Returns:
        Result with correctness, confidence changes, and feedback
    """
    try:
        # Get the problem to check the answer
        problems = service.get_easy_problems(
            request.student_id,
            request.module_id,
            count=100  # Get all to find specific problem
        )

        problem = next((p for p in problems if p.problem_id == request.problem_id), None)

        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")

        # Check if answer is correct
        correct_num = problem.problem_data.get('correct_answer_numerator')
        correct_den = problem.problem_data.get('correct_answer_denominator')

        is_correct = (
            request.answer_numerator == correct_num and
            request.answer_denominator == correct_den
        )

        # Create attempt result
        attempt = AttemptResult(
            student_id=request.student_id,
            module_id=request.module_id,
            problem_id=request.problem_id,
            is_correct=is_correct,
            time_spent_seconds=request.time_spent_seconds,
            hint_used=request.hint_used,
            difficulty_level=problem.difficulty_level
        )

        # Record attempt and update confidence
        old_confidence, new_confidence = service.record_attempt(attempt)

        # Generate encouragement message
        encouragement = _generate_encouragement(
            is_correct,
            new_confidence,
            old_confidence
        )

        return SubmitAnswerResponse(
            is_correct=is_correct,
            confidence_before=old_confidence,
            confidence_after=new_confidence,
            confidence_delta=new_confidence - old_confidence,
            correct_answer={
                'numerator': correct_num,
                'denominator': correct_den
            },
            explanation=problem.problem_data.get('explanation', ''),
            encouragement=encouragement
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")


# ============================================
# Helper Functions
# ============================================

def _generate_encouragement(is_correct: bool, new_conf: float, old_conf: float) -> str:
    """Generate encouraging feedback message"""
    if is_correct:
        delta = new_conf - old_conf
        if delta > 10:
            return "Excellent! Your confidence is soaring! 🚀"
        elif delta > 5:
            return "Great job! You're building momentum! 👏"
        else:
            return "Well done! Keep up the good work! ✨"
    else:
        if new_conf > 50:
            return "Not quite, but you're still doing well! Keep trying! 💪"
        elif new_conf > 30:
            return "That's okay! Every mistake is a learning opportunity! 📚"
        else:
            return "Don't give up! Let's try an easier problem to build confidence! 🌟"


# ============================================
# Run Server
# ============================================

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
