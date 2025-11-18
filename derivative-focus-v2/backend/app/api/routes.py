"""
API Routes
Main router for all API endpoints
"""

from fastapi import APIRouter
from app.api.endpoints import problems, rules

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(problems.router, prefix="/problems", tags=["problems"])
api_router.include_router(rules.router, prefix="/rules", tags=["rules"])
