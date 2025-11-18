"""
FastAPI Main Application for Emotion Detection System

This is the main entry point for the emotion detection backend API.
It integrates with LMS platforms to send emotion analysis data.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from backend.api import emotion_routes

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add(
    "logs/emotion_detection_{time}.log",
    rotation="1 day",
    retention="30 days",
    level="DEBUG"
)

# Create FastAPI application
app = FastAPI(
    title="Emotion Detection API",
    description="AI-powered emotion detection system for learning environments. Detects frustration (좌절), concentration (집중), and confusion (답답함) from student behavior patterns.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default port
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(emotion_routes.router)


@app.on_event("startup")
async def startup_event():
    """
    Application startup event handler
    """
    logger.info("=" * 60)
    logger.info("Starting Emotion Detection API")
    logger.info("=" * 60)
    logger.info("Emotion patterns detected: Frustration (좌절), Concentration (집중), Confusion (답답함)")
    logger.info("API Documentation: http://localhost:8000/api/docs")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event handler
    """
    logger.info("Shutting down Emotion Detection API")


@app.get("/")
async def root():
    """
    Root endpoint - API information
    """
    return {
        "service": "Emotion Detection API",
        "version": "1.0.0",
        "description": "AI-powered emotion detection for learning environments",
        "emotions_detected": ["frustration", "concentration", "confusion"],
        "documentation": "/api/docs",
        "health_check": "/api/emotions/health",
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for load balancers and monitoring
    """
    return {
        "status": "healthy",
        "service": "emotion-detection-api",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
