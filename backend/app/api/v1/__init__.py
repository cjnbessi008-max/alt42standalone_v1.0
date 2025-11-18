"""
API v1 Router
모든 v1 엔드포인트를 통합
"""

from fastapi import APIRouter
from app.api.v1.endpoints import focus_intensity

api_router = APIRouter()

# Focus Intensity 엔드포인트 등록
api_router.include_router(
    focus_intensity.router,
    tags=["Focus Intensity"]
)

# 향후 추가 엔드포인트
# api_router.include_router(lms.router, prefix="/lms", tags=["LMS Integration"])
# api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
