"""
FastAPI Main Application for Daily Mission LMS
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.services.database import init_db
from app.routes import missions, lms


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events for application startup and shutdown
    """
    # Startup
    print("🚀 Starting Daily Mission LMS...")
    print(f"📚 Application: {settings.APP_NAME} v{settings.APP_VERSION}")

    # Initialize database
    try:
        init_db()
        print("✅ Database initialized")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")

    # Check LMS connection
    from app.services.lms_integration import LMSIntegrationService
    lms_service = LMSIntegrationService()
    lms_status = lms_service.get_lms_connection_status()
    if lms_status['connected']:
        print(f"✅ LMS connected: {lms_status['lms_url']}")
    else:
        print(f"⚠️  LMS not connected: {lms_status['message']}")

    print("✅ Application startup complete")

    yield

    # Shutdown
    print("👋 Shutting down Daily Mission LMS...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Daily Mission Learning Management System with LMS Integration",
    lifespan=lifespan
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
app.include_router(missions.router)
app.include_router(lms.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Daily Mission LMS API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
