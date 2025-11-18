"""Recommendations API endpoints."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.recommendation_engine import RecommendationEngine

router = APIRouter()


class RecommendationGenerateRequest(BaseModel):
    """Request to generate recommendations."""

    user_id: UUID
    problem_id: UUID
    max_recommendations: int = 3


class RecommendationUpdateRequest(BaseModel):
    """Request to update recommendation status."""

    status: str  # 'accepted', 'skipped', 'completed'


@router.post("/generate", response_model=list[dict])
async def generate_recommendations(
    request: RecommendationGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate personalized strategy recommendations for a student.

    Args:
        request: Recommendation generation request
        db: Database session

    Returns:
        List of recommendations
    """
    try:
        engine = RecommendationEngine(db)
        recommendations = await engine.generate_recommendations(
            user_id=request.user_id,
            problem_id=request.problem_id,
            max_recommendations=request.max_recommendations,
        )
        return recommendations
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.get("/user/{user_id}/pending", response_model=list[dict])
async def get_pending_recommendations(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get pending recommendations for a user.

    Args:
        user_id: User ID
        db: Database session

    Returns:
        List of pending recommendations
    """
    engine = RecommendationEngine(db)
    recommendations = await engine.get_pending_recommendations(user_id)
    return recommendations


@router.patch("/{recommendation_id}", response_model=dict)
async def update_recommendation(
    recommendation_id: UUID,
    request: RecommendationUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update recommendation status.

    Args:
        recommendation_id: Recommendation ID
        request: Update request
        db: Database session

    Returns:
        Success status
    """
    if request.status not in ["accepted", "skipped", "completed"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be 'accepted', 'skipped', or 'completed'",
        )

    engine = RecommendationEngine(db)
    success = await engine.update_recommendation_status(
        recommendation_id=recommendation_id,
        status=request.status,
    )

    if not success:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    return {"success": True, "recommendation_id": str(recommendation_id)}


@router.get("/user/{user_id}/profile", response_model=dict)
async def get_student_profile(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get student's learning profile and statistics.

    Args:
        user_id: User ID
        db: Database session

    Returns:
        Student profile data
    """
    try:
        engine = RecommendationEngine(db)
        profile = await engine.get_student_profile(user_id)
        return profile
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
