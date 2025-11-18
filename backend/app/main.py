"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .api import students, concept_tools, usage_sessions, bias_analysis, import_data
from .database import engine, Base

# Create database tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events."""
    # Startup
    print("🚀 Starting Concept Tool Bias Analysis System...")
    print("📊 Database tables initialized")
    yield
    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="Concept Tool Bias Analysis API",
    description="API for analyzing bias in educational concept tool usage patterns",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(concept_tools.router, prefix="/api/tools", tags=["Concept Tools"])
app.include_router(usage_sessions.router, prefix="/api/sessions", tags=["Usage Sessions"])
app.include_router(bias_analysis.router, prefix="/api/analysis", tags=["Bias Analysis"])
app.include_router(import_data.router, prefix="/api/import", tags=["Data Import"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Concept Tool Bias Analysis API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "concept-tool-bias-api"}
