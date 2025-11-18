"""
Peak Thinking Period Tracker - Analytics Engine
FastAPI application for analyzing learning data and detecting peak thinking periods
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from config.database import init_db, close_db
from routers import analysis, peaks, dashboard
from models.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    logger.info("🚀 Starting Analytics Engine...")
    await init_db()
    logger.info("✅ Database connection established")
    yield
    # Shutdown
    logger.info("🛑 Shutting down Analytics Engine...")
    await close_db()
    logger.info("✅ Cleanup complete")

# Create FastAPI app
app = FastAPI(
    title="Peak Thinking Period Analytics Engine",
    description="AI-powered analytics for detecting peak thinking periods in student learning",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analysis.router, prefix="/analyze", tags=["Analysis"])
app.include_router(peaks.router, prefix="/peaks", tags=["Peak Periods"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint"""
    return {
        "status": "ok",
        "service": "Peak Thinking Analytics Engine",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Peak Thinking Analytics Engine",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
