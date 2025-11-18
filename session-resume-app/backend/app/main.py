"""FastAPI main application"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import init_db, close_db
from app.api.sessions import router as sessions_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events"""
    # Startup
    await init_db()
    print("✅ Database initialized")

    yield

    # Shutdown
    await close_db()
    print("👋 Database connections closed")


# Create FastAPI app
app = FastAPI(
    title="Session Resume API",
    description="API for managing student learning session state with auto-resume functionality",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sessions_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Session Resume API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("API_RELOAD", "True") == "True"

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload
    )
