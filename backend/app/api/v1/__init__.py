"""API v1 router configuration."""
from fastapi import APIRouter

from app.api.v1.endpoints import moodle, reasoning, correlation

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(moodle.router, prefix="/moodle", tags=["moodle"])
api_router.include_router(reasoning.router, prefix="/reasoning", tags=["reasoning"])
api_router.include_router(correlation.router, prefix="/correlation", tags=["correlation"])
