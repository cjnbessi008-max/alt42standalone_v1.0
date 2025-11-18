"""Main FastAPI application."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import problems, strategies, attempts, recommendations, analytics, moodle
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="LMS Practice Integration - AI-powered alternative problem-solving strategies",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    problems.router,
    prefix=f"{settings.API_V1_PREFIX}/problems",
    tags=["problems"],
)
app.include_router(
    strategies.router,
    prefix=f"{settings.API_V1_PREFIX}/strategies",
    tags=["strategies"],
)
app.include_router(
    attempts.router,
    prefix=f"{settings.API_V1_PREFIX}/attempts",
    tags=["attempts"],
)
app.include_router(
    recommendations.router,
    prefix=f"{settings.API_V1_PREFIX}/recommendations",
    tags=["recommendations"],
)
app.include_router(
    analytics.router,
    prefix=f"{settings.API_V1_PREFIX}/analytics",
    tags=["analytics"],
)
app.include_router(
    moodle.router,
    prefix=f"{settings.API_V1_PREFIX}/moodle",
    tags=["moodle"],
)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
