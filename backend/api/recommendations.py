"""Time recommendation API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..schemas.time_recommendation import TimeRecommendationResponse, TimeRecommendationSummary
from ..models.time_recommendation import TimeRecommendation
from ..services.recommendation_engine import RecommendationEngine
from ..api.auth import oauth2_scheme
from ..services.auth_service import AuthService

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.post("/generate", response_model=List[TimeRecommendationResponse])
def generate_recommendations(
    top_n: int = Query(5, ge=1, le=10, description="Number of recommendations to generate"),
    min_focus_score: float = Query(None, ge=0, le=100, description="Minimum focus score"),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Generate new time recommendations for current user."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    recommendations = RecommendationEngine.generate_recommendations(
        user.id, db, top_n=top_n, min_focus_score=min_focus_score
    )

    if not recommendations:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient data to generate recommendations. Need more focus sessions."
        )

    return recommendations


@router.get("", response_model=List[TimeRecommendationResponse])
def get_recommendations(
    active_only: bool = Query(True, description="Get only active recommendations"),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get time recommendations for current user."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    query = db.query(TimeRecommendation).filter(TimeRecommendation.user_id == user.id)

    if active_only:
        query = query.filter(TimeRecommendation.is_active == 1)

    recommendations = query.order_by(TimeRecommendation.confidence_score.desc()).all()

    return recommendations


@router.get("/summary", response_model=TimeRecommendationSummary)
def get_recommendation_summary(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get summary of recommendations for current user."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    summary = RecommendationEngine.get_recommendation_summary(user.id, db)

    return summary


@router.get("/optimal-days", response_model=List[str])
def get_optimal_days(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get optimal learning days for current user."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    days = RecommendationEngine.get_optimal_days(user.id, db)

    return days


@router.get("/optimal-hours", response_model=List[int])
def get_optimal_hours(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get optimal learning hours for current user."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    hours = RecommendationEngine.get_optimal_hours(user.id, db)

    return hours
