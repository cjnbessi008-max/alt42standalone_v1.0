"""
FastAPI Pipeline Orchestrator
Main application for AI Education System
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .api import concepts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup
    logger.info("Starting AI Education Pipeline Orchestrator...")
    yield
    # Shutdown
    logger.info("Shutting down AI Education Pipeline Orchestrator...")


# Create FastAPI application
app = FastAPI(
    title="AI Education Pipeline Orchestrator",
    description="Backend orchestrator for AI-powered education system with concept summary generation",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(concepts.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "AI Education Pipeline Orchestrator",
        "version": "1.0.0",
        "status": "running",
        "features": [
            "Concept Summary Generation",
            "AI-Powered Educational Content",
            "LMS Integration"
        ]
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "pipeline-orchestrator"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
