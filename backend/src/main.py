"""
KAIST Touch Math Academy - Emotion Refresh Routine API
======================================================
Main FastAPI application for emotion tracking and refresh routines.
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import asyncpg
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from routes.emotion_routes import router as emotion_router, get_emotion_service, get_routine_generator
from services.emotion_service import EmotionService
from services.routine_generator import RoutineGeneratorService

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/kaist_academy')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
CLAUDE_MODEL = os.getenv('CLAUDE_MODEL', 'claude-sonnet-4-5-20250929')
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')

# Global state
db_pool: asyncpg.Pool = None
emotion_service: EmotionService = None
routine_generator: RoutineGeneratorService = None


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Lifespan context manager for startup and shutdown events.
    """
    global db_pool, emotion_service, routine_generator

    # Startup
    logger.info("Starting up application...")

    # Check required environment variables
    if not ANTHROPIC_API_KEY:
        logger.error("ANTHROPIC_API_KEY is not set!")
        raise ValueError("ANTHROPIC_API_KEY environment variable is required")

    try:
        # Create database connection pool
        logger.info(f"Connecting to database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'localhost'}")
        db_pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=5,
            max_size=20,
            command_timeout=60,
        )
        logger.info("Database connection pool created")

        # Initialize services
        emotion_service = EmotionService(db_pool)
        routine_generator = RoutineGeneratorService(
            db_pool=db_pool,
            anthropic_api_key=ANTHROPIC_API_KEY,
            model=CLAUDE_MODEL,
        )
        logger.info("Services initialized")

        # Test database connection
        async with db_pool.acquire() as conn:
            version = await conn.fetchval('SELECT version()')
            logger.info(f"Connected to: {version}")

        logger.info("Application startup complete")

    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down application...")

    if db_pool:
        await db_pool.close()
        logger.info("Database connection pool closed")

    logger.info("Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="KAIST Touch Math Academy - Emotion Refresh Routine API",
    description="API for emotion tracking and AI-powered refresh routines",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency overrides
async def get_emotion_service_dependency() -> EmotionService:
    """Get emotion service instance."""
    if emotion_service is None:
        raise RuntimeError("Emotion service not initialized")
    return emotion_service


async def get_routine_generator_dependency() -> RoutineGeneratorService:
    """Get routine generator service instance."""
    if routine_generator is None:
        raise RuntimeError("Routine generator service not initialized")
    return routine_generator


# Override dependencies
app.dependency_overrides[get_emotion_service] = get_emotion_service_dependency
app.dependency_overrides[get_routine_generator] = get_routine_generator_dependency

# Include routers
app.include_router(emotion_router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "KAIST Touch Math Academy - Emotion Refresh Routine API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "docs": "/docs",
            "redoc": "/redoc",
        }
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("DEBUG") else "An unexpected error occurred",
        }
    )


if __name__ == "__main__":
    import uvicorn

    # Run development server
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", "8000")),
        reload=True,
        log_level="info",
    )
