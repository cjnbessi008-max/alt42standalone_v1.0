"""
AI Education System Pipeline - Main FastAPI Application
Mind Wandering Detection Service
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api import behavior_tracking, mind_wandering, lms_integration
from app.core.config import settings
from app.db.database import engine, Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting AI Education System Pipeline...")
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

    yield

    # Shutdown
    logger.info("Shutting down AI Education System Pipeline...")


app = FastAPI(
    title="AI Education System Pipeline",
    description="Automated educational system generation with mind wandering detection",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    behavior_tracking.router,
    prefix="/api/v1/behavior",
    tags=["Behavior Tracking"]
)
app.include_router(
    mind_wandering.router,
    prefix="/api/v1/mind-wandering",
    tags=["Mind Wandering Detection"]
)
app.include_router(
    lms_integration.router,
    prefix="/api/v1/lms",
    tags=["LMS Integration"]
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Education System Pipeline API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-education-pipeline"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
