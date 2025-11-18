"""Analytics API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..services.focus_analyzer import FocusAnalyzer
from ..api.auth import oauth2_scheme
from ..services.auth_service import AuthService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/trends")
def get_focus_trends(
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get focus trends for current user."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    trends = FocusAnalyzer.get_user_focus_trends(user.id, db, days=days)
    return trends


@router.get("/time-patterns")
def get_time_patterns(
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Get time-based focus patterns for current user."""
    user = AuthService.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    from ..services.recommendation_engine import RecommendationEngine
    patterns = RecommendationEngine.analyze_time_patterns(user.id, db, days=days)

    return patterns
