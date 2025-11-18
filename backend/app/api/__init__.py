"""
API routes
"""
from .students import router as students_router
from .attempts import router as attempts_router
from .bottlenecks import router as bottlenecks_router
from .performance import router as performance_router

__all__ = [
    "students_router",
    "attempts_router",
    "bottlenecks_router",
    "performance_router",
]
