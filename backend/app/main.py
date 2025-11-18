"""
FastAPI Main Application
AI Education System with Focus Intensity Adjustment
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.api.v1 import api_router

# Logging 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI Education System with Focus Intensity Adjustment",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health Check 엔드포인트
@app.get("/health", tags=["Health"])
async def health_check():
    """서버 상태 확인"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "service": "AI Education System"
    }


# API 라우터 등록
app.include_router(api_router, prefix=settings.API_V1_STR)


# 전역 예외 핸들러
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "detail": str(exc) if settings.DEBUG else "Please contact support"
        }
    )


# Startup 이벤트
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting AI Education System...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug Mode: {settings.DEBUG}")
    # Database 연결 초기화는 여기서 수행
    logger.info("✅ Application started successfully")


# Shutdown 이벤트
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("👋 Shutting down AI Education System...")
    # Database 연결 종료 등


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
