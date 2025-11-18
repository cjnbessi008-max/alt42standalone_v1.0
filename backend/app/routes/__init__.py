from app.routes.auth import router as auth_router
from app.routes.problems import router as problems_router
from app.routes.solutions import router as solutions_router
from app.routes.comparisons import router as comparisons_router

__all__ = ["auth_router", "problems_router", "solutions_router", "comparisons_router"]
