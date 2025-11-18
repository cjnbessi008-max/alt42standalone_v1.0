"""API routes for question suggestions."""
from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
import asyncpg

from app.models.database import get_db_connection
from app.models.schemas import (
    QuestionSuggestionRequest,
    QuestionSuggestionResponse,
    QuestionFeedbackRequest,
    SuggestedQuestion
)
from app.services.question_service import question_service

router = APIRouter(prefix="/question-suggestions", tags=["question-suggestions"])


@router.post(
    "/generate",
    response_model=QuestionSuggestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate question suggestions",
    description="Generate 3 personalized self-reflection questions for a student solving a problem"
)
async def generate_suggestions(
    request: QuestionSuggestionRequest,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Generate 3 AI-powered question suggestions for a student.

    The questions help students:
    - Clarify their understanding
    - Think about problem-solving strategies
    - Reflect on their approach

    Returns:
        QuestionSuggestionResponse with 3 suggested questions
    """
    try:
        result = await question_service.generate_suggestions(
            conn=conn,
            student_id=request.student_id,
            problem_id=request.problem_id,
            current_attempt_data=request.current_attempt_data
        )

        # Convert to response model
        return QuestionSuggestionResponse(
            suggestion_id=result["suggestion_id"],
            student_id=result["student_id"],
            problem_id=result["problem_id"],
            suggestions=[
                SuggestedQuestion(**q) for q in result["suggestions"]
            ],
            context_used=result.get("context_used"),
            created_at=result.get("created_at", None)
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        print(f"Error generating suggestions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate question suggestions"
        )


@router.post(
    "/feedback",
    status_code=status.HTTP_200_OK,
    summary="Submit feedback on suggestions",
    description="Record which suggestion was helpful and provide rating"
)
async def submit_feedback(
    feedback: QuestionFeedbackRequest,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Submit feedback on question suggestions.

    Args:
        feedback: Feedback data including rating and selected question

    Returns:
        Success confirmation
    """
    try:
        success = await question_service.record_feedback(
            conn=conn,
            suggestion_id=feedback.suggestion_id,
            student_id=feedback.student_id,
            accepted_suggestion=feedback.accepted_suggestion,
            helpfulness_rating=feedback.helpfulness_rating,
            comment=feedback.comment
        )

        return {
            "success": success,
            "message": "Feedback recorded successfully"
        }

    except Exception as e:
        print(f"Error recording feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record feedback"
        )


@router.get(
    "/history/{student_id}",
    summary="Get suggestion history",
    description="Retrieve past question suggestions for a student"
)
async def get_suggestion_history(
    student_id: UUID,
    limit: int = 10,
    conn: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Get suggestion history for a student.

    Args:
        student_id: Student UUID
        limit: Maximum number of records to return

    Returns:
        List of past suggestions
    """
    try:
        rows = await conn.fetch(
            """
            SELECT qs.id, qs.problem_id, qs.suggestions, qs.accepted_suggestion,
                   qs.feedback, qs.created_at, p.title as problem_title
            FROM question_suggestions qs
            JOIN problems p ON qs.problem_id = p.id
            WHERE qs.student_id = $1
            ORDER BY qs.created_at DESC
            LIMIT $2
            """,
            student_id,
            limit
        )

        return [
            {
                "suggestion_id": str(row["id"]),
                "problem_id": str(row["problem_id"]),
                "problem_title": row["problem_title"],
                "suggestions": row["suggestions"],
                "accepted_suggestion": row["accepted_suggestion"],
                "feedback": row["feedback"],
                "created_at": row["created_at"].isoformat() if row["created_at"] else None
            }
            for row in rows
        ]

    except Exception as e:
        print(f"Error fetching suggestion history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch suggestion history"
        )
