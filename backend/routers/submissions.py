"""
API routes for problem submissions and reasoning analysis
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from uuid import UUID
from typing import Dict, Any
import logging

from ..database import get_db
from ..models import (
    ProblemSubmission,
    ReasoningSubmission,
    AttemptWithFeedbackResponse,
    AttemptResponse,
    ReasoningAnalysisResponse,
    ReasoningExplanationResponse,
    AIFeedbackResponse,
    ProblemResponse,
    ErrorResponse
)
from ..ai_service import get_reasoning_analyzer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/submissions", tags=["submissions"])


@router.post(
    "/submit-answer",
    response_model=AttemptWithFeedbackResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def submit_answer(
    submission: ProblemSubmission,
    db: Session = Depends(get_db)
):
    """
    Submit an answer to a problem.

    If the answer is incorrect, the response will indicate that the student
    needs to provide a reasoning explanation.

    **Flow:**
    1. Student submits answer
    2. System checks if correct
    3. If incorrect → prompt for reasoning explanation
    4. If correct → record success and move on
    """
    try:
        # Verify student exists
        student_check = db.execute(
            text("SELECT id FROM students WHERE id = :student_id"),
            {"student_id": str(submission.student_id)}
        ).fetchone()

        if not student_check:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with id {submission.student_id} not found"
            )

        # Get problem details
        problem_row = db.execute(
            text("""
                SELECT id, title, description, problem_type, difficulty_level,
                       correct_answer, answer_type, metadata, created_at, updated_at
                FROM problems
                WHERE id = :problem_id
            """),
            {"problem_id": str(submission.problem_id)}
        ).fetchone()

        if not problem_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Problem with id {submission.problem_id} not found"
            )

        # Check if answer is correct
        correct_answer = problem_row.correct_answer.strip().lower()
        submitted_answer = submission.submitted_answer.strip().lower()
        is_correct = (submitted_answer == correct_answer)

        # Create attempt record
        result = db.execute(
            text("""
                INSERT INTO student_attempts
                (student_id, problem_id, submitted_answer, is_correct, time_spent_seconds)
                VALUES (:student_id, :problem_id, :submitted_answer, :is_correct, :time_spent)
                RETURNING id, student_id, problem_id, submitted_answer, is_correct,
                          time_spent_seconds, attempted_at
            """),
            {
                "student_id": str(submission.student_id),
                "problem_id": str(submission.problem_id),
                "submitted_answer": submission.submitted_answer,
                "is_correct": is_correct,
                "time_spent": submission.time_spent_seconds
            }
        )
        db.commit()

        attempt_row = result.fetchone()

        # Build response
        attempt_response = AttemptResponse(
            id=attempt_row.id,
            student_id=attempt_row.student_id,
            problem_id=attempt_row.problem_id,
            submitted_answer=attempt_row.submitted_answer,
            is_correct=attempt_row.is_correct,
            time_spent_seconds=attempt_row.time_spent_seconds,
            attempted_at=attempt_row.attempted_at
        )

        problem_response = ProblemResponse(
            id=problem_row.id,
            title=problem_row.title,
            description=problem_row.description,
            problem_type=problem_row.problem_type,
            difficulty_level=problem_row.difficulty_level,
            correct_answer=problem_row.correct_answer,
            answer_type=problem_row.answer_type,
            metadata=problem_row.metadata,
            created_at=problem_row.created_at,
            updated_at=problem_row.updated_at
        )

        # Update learning progress
        _update_learning_progress(
            db,
            submission.student_id,
            problem_row.problem_type,
            is_correct
        )

        return AttemptWithFeedbackResponse(
            attempt=attempt_response,
            needs_explanation=not is_correct,
            problem_details=problem_response if not is_correct else None
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in submit_answer: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process answer submission: {str(e)}"
        )


@router.post(
    "/submit-reasoning",
    response_model=ReasoningAnalysisResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def submit_reasoning(
    reasoning: ReasoningSubmission,
    db: Session = Depends(get_db)
):
    """
    Submit reasoning explanation for an incorrect answer.

    This triggers AI analysis of the student's reasoning and returns
    constructive feedback.

    **Flow:**
    1. Student explains their reasoning in one sentence
    2. AI (Claude) analyzes the reasoning
    3. AI identifies misconception and provides corrective feedback
    4. System returns encouraging, actionable guidance
    """
    try:
        # Get attempt details
        attempt_row = db.execute(
            text("""
                SELECT a.id, a.student_id, a.problem_id, a.submitted_answer, a.is_correct,
                       p.description, p.correct_answer, p.problem_type
                FROM student_attempts a
                JOIN problems p ON a.problem_id = p.id
                WHERE a.id = :attempt_id AND a.student_id = :student_id
            """),
            {
                "attempt_id": str(reasoning.attempt_id),
                "student_id": str(reasoning.student_id)
            }
        ).fetchone()

        if not attempt_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Attempt not found or does not belong to this student"
            )

        if attempt_row.is_correct:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot submit reasoning for a correct answer"
            )

        # Save reasoning explanation
        reasoning_result = db.execute(
            text("""
                INSERT INTO reasoning_explanations
                (attempt_id, student_id, problem_id, explanation_text, language)
                VALUES (:attempt_id, :student_id, :problem_id, :explanation, :language)
                RETURNING id, attempt_id, student_id, problem_id, explanation_text,
                          language, submitted_at
            """),
            {
                "attempt_id": str(reasoning.attempt_id),
                "student_id": str(reasoning.student_id),
                "problem_id": str(attempt_row.problem_id),
                "explanation": reasoning.explanation_text,
                "language": reasoning.language
            }
        )
        db.commit()

        reasoning_row = reasoning_result.fetchone()

        # Get AI analysis
        analyzer = get_reasoning_analyzer()
        analysis = await analyzer.analyze_reasoning(
            problem_description=attempt_row.description,
            correct_answer=attempt_row.correct_answer,
            student_answer=attempt_row.submitted_answer,
            student_explanation=reasoning.explanation_text,
            language=reasoning.language
        )

        # Save AI feedback
        feedback_result = db.execute(
            text("""
                INSERT INTO ai_feedback
                (reasoning_explanation_id, student_id, identified_misconception,
                 reasoning_error_type, corrective_feedback, encouragement,
                 ai_model, confidence_score, processing_time_ms)
                VALUES (:reasoning_id, :student_id, :misconception, :error_type,
                        :feedback, :encouragement, :model, :confidence, :processing_time)
                RETURNING id, reasoning_explanation_id, student_id, identified_misconception,
                          reasoning_error_type, corrective_feedback, encouragement,
                          ai_model, confidence_score, processing_time_ms, created_at
            """),
            {
                "reasoning_id": str(reasoning_row.id),
                "student_id": str(reasoning.student_id),
                "misconception": analysis["identified_misconception"],
                "error_type": analysis["reasoning_error_type"],
                "feedback": analysis["corrective_feedback"],
                "encouragement": analysis.get("encouragement"),
                "model": "claude-3-5-sonnet-20241022",
                "confidence": analysis.get("confidence_score"),
                "processing_time": analysis.get("processing_time_ms")
            }
        )
        db.commit()

        feedback_row = feedback_result.fetchone()

        # Build response
        reasoning_response = ReasoningExplanationResponse(
            id=reasoning_row.id,
            attempt_id=reasoning_row.attempt_id,
            student_id=reasoning_row.student_id,
            problem_id=reasoning_row.problem_id,
            explanation_text=reasoning_row.explanation_text,
            language=reasoning_row.language,
            submitted_at=reasoning_row.submitted_at
        )

        ai_feedback_response = AIFeedbackResponse(
            id=feedback_row.id,
            reasoning_explanation_id=feedback_row.reasoning_explanation_id,
            student_id=feedback_row.student_id,
            identified_misconception=feedback_row.identified_misconception,
            reasoning_error_type=feedback_row.reasoning_error_type,
            corrective_feedback=feedback_row.corrective_feedback,
            encouragement=feedback_row.encouragement,
            ai_model=feedback_row.ai_model,
            confidence_score=feedback_row.confidence_score,
            processing_time_ms=feedback_row.processing_time_ms,
            created_at=feedback_row.created_at
        )

        # Determine next steps
        next_steps = _get_next_steps(attempt_row.problem_type, reasoning.language)

        return ReasoningAnalysisResponse(
            reasoning_explanation=reasoning_response,
            ai_feedback=ai_feedback_response,
            next_steps=next_steps
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in submit_reasoning: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process reasoning submission: {str(e)}"
        )


def _update_learning_progress(
    db: Session,
    student_id: UUID,
    problem_type: str,
    is_correct: bool
):
    """
    Update student's learning progress for a problem type
    """
    try:
        # Check if progress record exists
        existing = db.execute(
            text("""
                SELECT id, total_attempts, correct_attempts
                FROM learning_progress
                WHERE student_id = :student_id AND problem_type = :problem_type
            """),
            {"student_id": str(student_id), "problem_type": problem_type}
        ).fetchone()

        if existing:
            # Update existing record
            new_total = existing.total_attempts + 1
            new_correct = existing.correct_attempts + (1 if is_correct else 0)
            new_mastery = new_correct / new_total if new_total > 0 else 0.0

            db.execute(
                text("""
                    UPDATE learning_progress
                    SET total_attempts = :total,
                        correct_attempts = :correct,
                        mastery_level = :mastery,
                        last_attempt_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = :id
                """),
                {
                    "id": str(existing.id),
                    "total": new_total,
                    "correct": new_correct,
                    "mastery": new_mastery
                }
            )
        else:
            # Create new record
            db.execute(
                text("""
                    INSERT INTO learning_progress
                    (student_id, problem_type, total_attempts, correct_attempts,
                     mastery_level, last_attempt_at)
                    VALUES (:student_id, :problem_type, 1, :correct, :mastery, CURRENT_TIMESTAMP)
                """),
                {
                    "student_id": str(student_id),
                    "problem_type": problem_type,
                    "correct": 1 if is_correct else 0,
                    "mastery": 1.0 if is_correct else 0.0
                }
            )

        db.commit()

    except Exception as e:
        logger.error(f"Error updating learning progress: {str(e)}")
        db.rollback()


def _get_next_steps(problem_type: str, language: str) -> str:
    """
    Get suggested next steps for the student
    """
    if language == "ko":
        return f"피드백을 읽고 이해한 후, 비슷한 {problem_type} 문제를 다시 풀어보세요."
    else:
        return f"After reading and understanding the feedback, try solving a similar {problem_type} problem again."
