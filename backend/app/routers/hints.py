from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from ..database import get_db
from ..services.hint_service import HintService
from ..models.hint import Hint

router = APIRouter(prefix="/api/hints", tags=["hints"])


# Pydantic schemas for request/response
class HintContext(BaseModel):
    """Context information for hint generation"""

    current_attempt: Optional[str] = None
    previous_hints: Optional[List[str]] = None
    time_spent: Optional[int] = None  # in seconds


class HintRequest(BaseModel):
    """Request schema for hint generation"""

    student_id: UUID
    problem_id: UUID
    level: int = Field(..., ge=1, le=3, description="Hint level: 1 (light), 2 (medium), 3 (detailed)")
    context: Optional[HintContext] = None


class HintMetadata(BaseModel):
    """Metadata about hint generation"""

    generation_time: float
    model_used: str
    context_provided: bool = False


class HintResponse(BaseModel):
    """Response schema for generated hint"""

    id: UUID
    problem_id: UUID
    student_id: UUID
    level: int
    content: str
    created_at: datetime
    metadata: Optional[dict] = None

    class Config:
        from_attributes = True


class HintHistoryResponse(BaseModel):
    """Response schema for hint history"""

    hints: List[HintResponse]
    total_count: int


@router.post("/generate", response_model=HintResponse, status_code=status.HTTP_201_CREATED)
async def generate_hint(
    request: HintRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a hint for a problem at a specific level

    - **student_id**: UUID of the student requesting the hint
    - **problem_id**: UUID of the problem
    - **level**: Hint level (1=light, 2=medium, 3=detailed)
    - **context**: Optional context information (current attempt, previous hints, time spent)

    Returns the generated hint with metadata
    """
    try:
        hint_service = HintService()

        # Convert context to dict if provided
        context_dict = None
        if request.context:
            context_dict = request.context.model_dump(exclude_none=True)

        # Generate hint
        hint = await hint_service.generate_hint(
            db=db,
            student_id=str(request.student_id),
            problem_id=str(request.problem_id),
            level=request.level,
            context=context_dict,
        )

        return hint

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate hint: {str(e)}",
        )


@router.get("/history/{student_id}/{problem_id}", response_model=HintHistoryResponse)
async def get_hint_history(
    student_id: UUID,
    problem_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all hints previously given to a student for a specific problem

    - **student_id**: UUID of the student
    - **problem_id**: UUID of the problem

    Returns list of all hints ordered by creation time
    """
    try:
        hint_service = HintService()

        hints = await hint_service.get_hint_history(
            db=db, student_id=str(student_id), problem_id=str(problem_id)
        )

        return {"hints": hints, "total_count": len(hints)}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve hint history: {str(e)}",
        )


@router.get("/{hint_id}", response_model=HintResponse)
async def get_hint(
    hint_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific hint by ID

    - **hint_id**: UUID of the hint

    Returns the hint details
    """
    from sqlalchemy import select

    try:
        result = await db.execute(select(Hint).where(Hint.id == hint_id))
        hint = result.scalar_one_or_none()

        if not hint:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hint not found")

        return hint

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve hint: {str(e)}",
        )
