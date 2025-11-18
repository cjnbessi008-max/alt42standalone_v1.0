from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging
import os

from app.api import pipeline, health
from app.core.config import settings

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI Education Pipeline",
    description="AI-powered educational module generation system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["pipeline"])

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 AI Pipeline service starting up...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Anthropic API configured: {bool(settings.ANTHROPIC_API_KEY)}")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("AI Pipeline service shutting down...")

@app.get("/")
async def root():
    return {
        "service": "AI Education Pipeline",
        "version": "1.0.0",
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True if settings.ENVIRONMENT == "development" else False
    )
