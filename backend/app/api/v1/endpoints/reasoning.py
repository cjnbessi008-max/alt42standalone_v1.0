"""Reasoning density calculation API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from app.core.database import get_db
from app.models.moodle import QuizAttempt, QuestionAttempt
from app.services.reasoning_density_service import (
    get_reasoning_calculator,
    save_reasoning_density_score,
)

router = APIRouter()


@router.post("/calculate/quiz-attempt/{attempt_id}", response_model=Dict[str, Any])
async def calculate_quiz_attempt_density(
    attempt_id: int,
    db: Session = Depends(get_db),
):
    """Calculate reasoning density for an entire quiz attempt."""
    quiz_attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()

    if not quiz_attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")

    calculator = get_reasoning_calculator()
    result = calculator.calculate_for_quiz_attempt(quiz_attempt, db)

    if not result:
        raise HTTPException(
            status_code=400,
            detail="Unable to calculate reasoning density. No question attempts found.",
        )

    # Save aggregate score for the quiz attempt
    aggregate_scores = {
        "time_density_score": result.get("mean_density_score", 0),
        "attempt_intensity_score": result.get("mean_density_score", 0),
        "cognitive_load_score": result.get("mean_density_score", 0),
        "complexity_coefficient": result.get("mean_density_score", 0),
        "solution_path_score": result.get("mean_density_score", 0),
        "overall_density_score": result.get("mean_density_score", 0),
        "intensity_level": "medium",  # TODO: Calculate from aggregate
    }

    save_reasoning_density_score(
        db=db,
        student_id=quiz_attempt.student_id,
        quiz_attempt_id=attempt_id,
        question_attempt_id=None,
        scores=aggregate_scores,
    )

    return result


@router.post(
    "/calculate/question-attempt/{question_attempt_id}",
    response_model=Dict[str, Any],
)
async def calculate_question_attempt_density(
    question_attempt_id: int,
    difficulty_level: int = 3,
    db: Session = Depends(get_db),
):
    """Calculate reasoning density for a single question attempt."""
    question_attempt = (
        db.query(QuestionAttempt)
        .filter(QuestionAttempt.id == question_attempt_id)
        .first()
    )

    if not question_attempt:
        raise HTTPException(status_code=404, detail="Question attempt not found")

    calculator = get_reasoning_calculator()
    scores = calculator.calculate_for_question_attempt(
        question_attempt,
        difficulty_level=difficulty_level,
    )

    # Save to database
    quiz_attempt = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.id == question_attempt.quiz_attempt_id)
        .first()
    )

    if quiz_attempt:
        save_reasoning_density_score(
            db=db,
            student_id=quiz_attempt.student_id,
            quiz_attempt_id=quiz_attempt.id,
            question_attempt_id=question_attempt_id,
            scores=scores,
        )

    return scores


@router.get("/student/{student_id}", response_model=Dict[str, Any])
async def get_student_reasoning_metrics(
    student_id: int,
    db: Session = Depends(get_db),
):
    """Get reasoning density metrics for a student."""
    from app.models.analysis import ReasoningDensityScore

    scores = (
        db.query(ReasoningDensityScore)
        .filter(ReasoningDensityScore.student_id == student_id)
        .all()
    )

    if not scores:
        raise HTTPException(
            status_code=404,
            detail="No reasoning density scores found for this student",
        )

    # Calculate aggregate statistics
    overall_scores = [float(s.overall_density_score or 0) for s in scores]

    import numpy as np

    return {
        "student_id": student_id,
        "total_assessments": len(scores),
        "mean_density": round(np.mean(overall_scores), 2),
        "median_density": round(np.median(overall_scores), 2),
        "std_density": round(np.std(overall_scores), 2),
        "min_density": round(np.min(overall_scores), 2),
        "max_density": round(np.max(overall_scores), 2),
        "recent_scores": [
            {
                "quiz_attempt_id": s.quiz_attempt_id,
                "overall_score": float(s.overall_density_score or 0),
                "intensity_level": s.intensity_level.value if s.intensity_level else None,
                "calculated_at": s.calculated_at.isoformat() if s.calculated_at else None,
            }
            for s in scores[-10:]  # Last 10 scores
        ],
    }


@router.get("/quiz/{quiz_id}", response_model=Dict[str, Any])
async def get_quiz_reasoning_metrics(
    quiz_id: int,
    db: Session = Depends(get_db),
):
    """Get reasoning density metrics for a quiz across all students."""
    from app.models.analysis import ReasoningDensityScore

    # Get all quiz attempts for this quiz
    quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.quiz_id == quiz_id).all()

    if not quiz_attempts:
        raise HTTPException(
            status_code=404,
            detail="No quiz attempts found for this quiz",
        )

    attempt_ids = [qa.id for qa in quiz_attempts]

    # Get reasoning density scores for these attempts
    scores = (
        db.query(ReasoningDensityScore)
        .filter(ReasoningDensityScore.quiz_attempt_id.in_(attempt_ids))
        .all()
    )

    if not scores:
        return {
            "quiz_id": quiz_id,
            "total_attempts": len(quiz_attempts),
            "analyzed_attempts": 0,
            "message": "No reasoning density scores calculated yet",
        }

    # Calculate aggregate statistics
    overall_scores = [float(s.overall_density_score or 0) for s in scores]

    import numpy as np

    return {
        "quiz_id": quiz_id,
        "total_attempts": len(quiz_attempts),
        "analyzed_attempts": len(scores),
        "mean_density": round(np.mean(overall_scores), 2),
        "median_density": round(np.median(overall_scores), 2),
        "std_density": round(np.std(overall_scores), 2),
        "distribution": {
            "low": sum(1 for s in scores if s.intensity_level and s.intensity_level.value == "low"),
            "medium": sum(1 for s in scores if s.intensity_level and s.intensity_level.value == "medium"),
            "high": sum(1 for s in scores if s.intensity_level and s.intensity_level.value == "high"),
        },
    }
