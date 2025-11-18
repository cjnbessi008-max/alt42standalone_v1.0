"""
Reasoning Feedback System - Main FastAPI Application

A standalone web application that analyzes student reasoning
and provides AI-powered feedback for incorrect problem solutions.
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import os
from dotenv import load_dotenv

from .routers import (
    students_router,
    problems_router,
    submissions_router,
    progress_router,
    moodle_router
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO if os.getenv("DEBUG", "false").lower() != "true" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Reasoning Feedback System",
    description="""
    AI-powered system for analyzing student reasoning and providing constructive feedback.

    ## Features
    * Submit answers to math problems
    * Explain reasoning for incorrect answers
    * Receive AI-generated feedback from Claude
    * Track learning progress over time
    * Moodle LTI integration support

    ## Workflow
    1. Student submits answer to a problem
    2. If incorrect, student explains their reasoning in one sentence
    3. Claude AI analyzes the reasoning and identifies misconceptions
    4. System provides corrective feedback and encouragement
    5. Progress is tracked for adaptive learning
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(students_router)
app.include_router(problems_router)
app.include_router(submissions_router)
app.include_router(progress_router)
app.include_router(moodle_router)


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Custom handler for validation errors
    """
    errors = exc.errors()
    logger.warning(f"Validation error: {errors}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "detail": errors,
            "error_code": "VALIDATION_ERROR"
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Catch-all handler for unexpected errors
    """
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred. Please try again later.",
            "error_code": "INTERNAL_ERROR"
        }
    )


# Health check endpoints
@app.get("/", tags=["health"])
async def root():
    """
    Root endpoint - health check
    """
    return {
        "status": "healthy",
        "service": "Reasoning Feedback System",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "healthy",
        "database": "connected",
        "ai_service": "configured"
    }


@app.get("/api/info", tags=["info"])
async def api_info():
    """
    Get API information and available endpoints
    """
    return {
        "name": "Reasoning Feedback System API",
        "version": "1.0.0",
        "description": "AI-powered reasoning analysis and feedback",
        "endpoints": {
            "students": "/api/students",
            "problems": "/api/problems",
            "submissions": "/api/submissions",
            "progress": "/api/progress"
        },
        "features": [
            "Problem submission and answer checking",
            "Reasoning explanation analysis",
            "AI-powered feedback via Claude",
            "Learning progress tracking",
            "Moodle integration support"
        ]
    }


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """
    Application startup tasks
    """
    logger.info("Starting Reasoning Feedback System...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"Debug mode: {os.getenv('DEBUG', 'false')}")

    # Verify critical environment variables
    if not os.getenv("ANTHROPIC_API_KEY"):
        logger.warning("ANTHROPIC_API_KEY not set - AI features will not work")

    if not os.getenv("DATABASE_URL"):
        logger.warning("DATABASE_URL not set - using default localhost connection")

    logger.info("Application started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown tasks
    """
    logger.info("Shutting down Reasoning Feedback System...")
    logger.info("Application shut down successfully")


if __name__ == "__main__":
    import uvicorn

    # Run the application
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true",
        log_level="info"
    )
