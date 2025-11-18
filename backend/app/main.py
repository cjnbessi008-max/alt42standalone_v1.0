"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .api.v1 import students, modules, attempts, efficiency

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    debug=settings.DEBUG,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(students.router, prefix="/api/v1/students", tags=["students"])
app.include_router(modules.router, prefix="/api/v1/modules", tags=["modules"])
app.include_router(attempts.router, prefix="/api/v1/attempts", tags=["attempts"])
app.include_router(efficiency.router, prefix="/api/v1/efficiency", tags=["efficiency"])


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    print(f"✅ {settings.APP_NAME} v{settings.VERSION} started!")
    print(f"📊 Database: {settings.DATABASE_URL.split('@')[-1]}")  # Hide credentials


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
