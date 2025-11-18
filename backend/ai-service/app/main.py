from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import logging

from .config.settings import settings
from .config.database import db
from .api import analysis
from .models.schemas import HealthResponse, ErrorResponse

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered reasoning analysis and fallacy detection service",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup"""
    try:
        db.connect()
        db.connect_redis()
        logger.info("=" * 50)
        logger.info("🚀 ALT42 AI Reasoning Analysis Service")
        logger.info("=" * 50)
        logger.info(f"Environment: {settings.environment}")
        logger.info(f"Version: {settings.app_version}")
        logger.info(f"Claude Model: {settings.claude_model}")
        logger.info("=" * 50)
    except Exception as e:
        logger.error(f"Failed to initialize service: {e}")
        raise


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up connections on shutdown"""
    db.close()
    logger.info("Service shut down gracefully")


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if settings.environment == "development" else None,
            timestamp=datetime.now()
        ).dict()
    )


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        message="AI Reasoning Analysis Service is running",
        timestamp=datetime.now(),
        version=settings.app_version
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "environment": settings.environment,
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "analyze": "/api/analyze",
            "fallacies": "/api/fallacies/{fallacy_name}"
        }
    }


# Include routers
app.include_router(analysis.router, prefix="/api", tags=["analysis"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=(settings.environment == "development"),
        log_level=settings.log_level.lower()
    )
