from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings

# Initialize FastAPI app
app = FastAPI(
    title="MathFlow API",
    description="수포자를 위한 중독형 수학 웹앱 - Backend API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("🚀 MathFlow API starting up...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"API URL: {settings.API_URL}")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("👋 MathFlow API shutting down...")


@app.get("/")
async def root():
    return {
        "message": "Welcome to MathFlow API",
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }


# API Routes will be added here
# from app.api import auth, problems, users
# app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
# app.include_router(problems.router, prefix="/api/problems", tags=["problems"])
# app.include_router(users.router, prefix="/api/users", tags=["users"])
