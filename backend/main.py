"""
FastAPI Backend for AI Education System
Student Solution Flowchart Feature
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.api.routes import student_solutions, flowchart, lms_integration, auth, recommendations
from app.core.config import settings
from app.db.database import engine, Base

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the application"""
    # Startup
    logger.info("Starting up AI Education System...")
    # Create database tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")

    yield

    # Shutdown
    logger.info("Shutting down...")


app = FastAPI(
    title="AI Education System - Standalone Web App",
    description="AI-powered learning platform with personalized recommendations and visual flowcharts",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Authentication"]
)
app.include_router(
    student_solutions.router,
    prefix="/api/v1/solutions",
    tags=["Student Solutions"]
)
app.include_router(
    flowchart.router,
    prefix="/api/v1/flowchart",
    tags=["Flowchart Visualization"]
)
app.include_router(
    recommendations.router,
    prefix="/api/v1/recommendations",
    tags=["AI Recommendations"]
)
app.include_router(
    lms_integration.router,
    prefix="/api/v1/lms",
    tags=["LMS Integration (Optional)"]
)


@app.get("/")
async def root():
    return {
        "message": "AI Education System - Standalone Web App",
        "version": "2.0.0",
        "features": [
            "Standalone Authentication",
            "Student Solution Tracking",
            "Visual Flowchart Generation",
            "AI-Powered Personalized Recommendations",
            "Learning Pattern Analysis",
            "Teacher Intervention Insights",
            "Optional LMS Integration"
        ],
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
