"""
API routers package
"""
from .students import router as students_router
from .activities import router as activities_router
from .insights import router as insights_router

__all__ = [
    "students_router",
    "activities_router",
    "insights_router",
]
