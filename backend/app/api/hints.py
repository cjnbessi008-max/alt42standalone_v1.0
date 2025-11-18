"""
API endpoints for hint generation
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from ..models import HintRequest, HintResponse, ProblemContext
from ..services.hint_service import hint_generator

router = APIRouter(prefix="/api/hints", tags=["hints"])


@router.post("/generate", response_model=HintResponse)
async def generate_hint(
    request: HintRequest,
    problem_context: Optional[ProblemContext] = None
):
    """
    Generate a thinking-direction hint for a student

    This endpoint generates hints that guide student thinking
    without revealing the answer.

    - **student_id**: Unique identifier for the student
    - **problem_id**: Unique identifier for the problem
    - **problem_description**: Full description of the problem
    - **student_work**: Optional - what the student has tried so far
    - **previous_hints**: List of hints already given to the student
    - **hint_level**: Integer 1-5, where 1 is most subtle and 5 is most direct
    - **subject**: Subject area (default: mathematics)
    - **grade_level**: Optional grade level for appropriate language

    Returns a hint that guides thinking without revealing answers.
    """
    try:
        # Validate hint level
        if request.hint_level < 1 or request.hint_level > 5:
            raise HTTPException(
                status_code=400,
                detail="Hint level must be between 1 and 5"
            )

        # Generate hint
        hint_response = await hint_generator.generate_hint(request, problem_context)

        return hint_response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating hint: {str(e)}"
        )


@router.post("/validate")
async def validate_hint(
    hint_text: str,
    problem_answer: Optional[str] = None
):
    """
    Validate that a hint doesn't reveal the answer

    This is useful for quality control and testing.

    - **hint_text**: The hint text to validate
    - **problem_answer**: The correct answer to check against

    Returns validation results.
    """
    try:
        validation_result = await hint_generator.validate_hint(hint_text, problem_answer)
        return validation_result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error validating hint: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint

    Returns the status of the hint generation service.
    """
    return {
        "status": "healthy",
        "service": "hint_generator",
        "model": hint_generator.model
    }
