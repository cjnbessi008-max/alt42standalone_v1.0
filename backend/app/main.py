"""
Main FastAPI application entry point
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import logging
import os

from .database import get_db, engine
from .models import HealthCheckResponse
from .api import misconceptions

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI Education System - Misconceptions Tracking API",
    description="API for tracking and analyzing student misconceptions in educational modules",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(misconceptions.router)


@app.on_event("startup")
async def startup_event():
    """
    Application startup event handler
    """
    logger.info("Starting AI Education System API...")
    logger.info(f"CORS enabled for origins: {CORS_ORIGINS}")

    # Test database connection
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✓ Database connection successful")
    except Exception as e:
        logger.error(f"✗ Database connection failed: {str(e)}")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown event handler
    """
    logger.info("Shutting down AI Education System API...")
    engine.dispose()


@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint - API information
    """
    return {
        "name": "AI Education System - Misconceptions Tracking API",
        "version": "1.0.0",
        "description": "Track and analyze student misconceptions in educational modules",
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "top_misconceptions": "/api/misconceptions/students/{student_id}/modules/{module_id}/top",
            "student_modules": "/api/misconceptions/students/{student_id}/modules",
            "all_students": "/api/misconceptions/students"
        }
    }


@app.get("/health", response_model=HealthCheckResponse, tags=["health"])
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint
    Verifies API and database connectivity
    """
    database_connected = False

    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        database_connected = True
    except Exception as e:
        logger.error(f"Health check database connection failed: {str(e)}")

    return HealthCheckResponse(
        status="healthy" if database_connected else "unhealthy",
        timestamp=datetime.utcnow(),
        database_connected=database_connected,
        version="1.0.0"
    )


if __name__ == "__main__":
    import uvicorn

    # Get configuration from environment variables
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("API_RELOAD", "true").lower() == "true"

    logger.info(f"Starting server on {host}:{port}")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )
