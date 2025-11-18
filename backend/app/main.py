from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routes import auth_router, problems_router, solutions_router, comparisons_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LMS Solution Comparison System",
    description="AI-powered Learning Management System with solution comparison features",
    version="1.0.0",
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
app.include_router(auth_router)
app.include_router(problems_router)
app.include_router(solutions_router)
app.include_router(comparisons_router)


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "LMS Solution Comparison System API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
