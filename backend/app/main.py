"""
FastAPI main application
LMS Dropout Analysis System
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .api import dropout, tracking

# Create FastAPI app
app = FastAPI(
    title="LMS Dropout Analysis API",
    description="학습자의 중단 이유를 데이터 기반으로 추정하는 시스템",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 origin만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dropout.router)
app.include_router(tracking.router)


@app.get("/")
async def root():
    """
    API 루트 엔드포인트
    """
    return {
        "message": "LMS Dropout Analysis API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """
    헬스 체크 엔드포인트
    """
    return {
        "status": "healthy",
        "service": "dropout-analysis-api"
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
