from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base
from app.routes import auth, problems, progress

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(problems.router)
app.include_router(progress.router)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "LMS Problem Stage Split API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
