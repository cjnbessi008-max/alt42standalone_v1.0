from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import init_db
from app.routes import problems

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for the application"""
    # Startup: Initialize database
    print("Initializing database...")
    init_db()
    print("Application startup complete!")
    yield
    # Shutdown
    print("Application shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Logic Summary API",
    description="API for extracting and summarizing logical propositions from educational problems",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite and React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(problems.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Logic Summary API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "ok"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
