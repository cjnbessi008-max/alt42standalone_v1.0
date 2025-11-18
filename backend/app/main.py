from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import checklist, lms
from .db.session import create_tables
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI Education System Pipeline",
    description="Backend API for LMS-integrated checklist generation",
    version="1.0.0",
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
app.include_router(checklist.router)
app.include_router(lms.router)


@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("Starting AI Education System Pipeline API...")
    # Create database tables
    create_tables()
    logger.info("Database tables created/verified")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Education System Pipeline API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
