"""
FastAPI Main Application
Entry point for Emotion Detection API Server
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import logging

from backend.api.emotion_routes import router as emotion_router

# ============================================================================
# Logging Configuration
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Application Lifespan
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info("Starting Emotion Detection API Server...")
    logger.info("Emotion detection service initialized")

    yield

    # Shutdown
    logger.info("Shutting down Emotion Detection API Server...")

# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="LMS Emotion-Based Color Mode API",
    description="Real-time emotional state detection and adaptive color mode system for educational LMS",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ============================================================================
# CORS Middleware
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://localhost:8000",  # Local testing
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        # Add your production frontend URL here
        # "https://your-production-frontend.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Global Exception Handler
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unexpected errors
    """
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "path": str(request.url)
        }
    )

# ============================================================================
# Routes
# ============================================================================

@app.get("/")
async def root():
    """
    Root endpoint - API information
    """
    return {
        "name": "LMS Emotion-Based Color Mode API",
        "version": "1.0.0",
        "description": "Real-time emotional state detection and adaptive color mode system",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "service": "emotion_detection_api",
        "version": "1.0.0"
    }

# Include emotion detection routes
app.include_router(emotion_router)

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload for development
        log_level="info",
        ws_ping_interval=30,
        ws_ping_timeout=10,
    )
