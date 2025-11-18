"""
AI Education System Pipeline Orchestrator
FastAPI application for managing AI-driven educational content generation
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio
from loguru import logger
import sys

from config import settings
from routers import generation, problems, health
from database import engine, Base
from services.cache_service import CacheService

# Configure logging
logger.remove()
logger.add(sys.stderr, level=settings.log_level)
logger.add(
    "logs/pipeline_{time:YYYY-MM-DD}.log",
    rotation="00:00",
    retention="30 days",
    level=settings.log_level
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown events"""
    # Startup
    logger.info("Starting AI Education Pipeline Orchestrator")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Database: {settings.database_url.split('@')[1] if '@' in settings.database_url else 'configured'}")

    # Initialize cache
    cache = CacheService()
    await cache.connect()

    # Create tables if needed (in dev mode)
    if settings.environment == "development":
        logger.info("Development mode: Creating database tables if needed")
        # Note: In production, use Alembic migrations

    yield

    # Shutdown
    logger.info("Shutting down AI Education Pipeline Orchestrator")
    await cache.disconnect()


# Create FastAPI app
app = FastAPI(
    title="AI Education Pipeline API",
    description="AI-powered educational content generation pipeline",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(generation.router, prefix="/api/v1/generation", tags=["Generation"])
app.include_router(problems.router, prefix="/api/v1/problems", tags=["Problems"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Education Pipeline Orchestrator",
        "version": "1.0.0",
        "status": "operational",
        "environment": settings.environment
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.environment == "development" else "An error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development"
    )
