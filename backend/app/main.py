"""
Main FastAPI application for AI Education System - Learning Analytics
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api import sessions, lms_integration

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Learning analytics system with thinking flow analysis for AI-powered education",
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
app.include_router(sessions.router)
app.include_router(lms_integration.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Education System - Learning Analytics API",
        "version": settings.APP_VERSION,
        "status": "healthy",
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "service": "learning-analytics",
        "version": settings.APP_VERSION,
    }
