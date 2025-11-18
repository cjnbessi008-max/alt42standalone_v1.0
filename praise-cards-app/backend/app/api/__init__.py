from fastapi import APIRouter
from .students import router as students_router
from .learning_sessions import router as learning_sessions_router
from .praise_cards import router as praise_cards_router
from .interactions import router as interactions_router

api_router = APIRouter()

api_router.include_router(students_router, prefix="/students", tags=["students"])
api_router.include_router(
    learning_sessions_router, prefix="/learning-sessions", tags=["learning-sessions"]
)
api_router.include_router(praise_cards_router, prefix="/praise-cards", tags=["praise-cards"])
api_router.include_router(interactions_router, prefix="/interactions", tags=["interactions"])
