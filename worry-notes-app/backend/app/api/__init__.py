"""
API Routes
"""
from fastapi import APIRouter

from app.api.routes import auth, worry_notes, responses, analytics, lms, notifications

# Create main API router
api_router = APIRouter()

# Include sub-routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(worry_notes.router, prefix="/notes", tags=["Worry Notes"])
api_router.include_router(responses.router, prefix="/responses", tags=["Responses"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(lms.router, prefix="/lms", tags=["LMS Integration"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

__all__ = ["api_router"]
