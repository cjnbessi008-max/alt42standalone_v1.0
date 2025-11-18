"""
API routers package
"""
from .students import router as students_router
from .problems import router as problems_router
from .submissions import router as submissions_router
from .progress import router as progress_router
from .moodle import router as moodle_router

__all__ = [
    "students_router",
    "problems_router",
    "submissions_router",
    "progress_router",
    "moodle_router"
]
