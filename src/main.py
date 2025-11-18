"""
Growth Log System - Main Application
성장로그 기반 LMS 연동 시스템 메인 엔트리포인트
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from .api import growth_logs, lms_integration

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 라이프사이클 관리"""
    # Startup
    logger.info("🌱 Growth Log System Starting...")
    logger.info("오답을 '실패'가 아닌 '성장 기회'로 기록합니다")

    # TODO: 데이터베이스 연결 초기화
    # TODO: Redis 연결 초기화 (선택)
    # TODO: LMS 연동 초기화

    yield

    # Shutdown
    logger.info("Growth Log System Shutting down...")

    # TODO: 데이터베이스 연결 종료
    # TODO: Redis 연결 종료


# FastAPI 앱 생성
app = FastAPI(
    title="Growth Log System API",
    description="""
    ## 성장로그 기반 학습 관리 시스템

    오답을 '실패'가 아닌 '성장의 기회'로 기록하고,
    학생의 학습 과정을 긍정적으로 추적하는 시스템입니다.

    ### 주요 기능
    - 🌱 성장 중심 피드백 (AI 기반)
    - 📊 다차원 학습 분석
    - 🔗 LMS 연동 (Canvas, Moodle 등)
    - 🏆 성장 마일스톤 추적

    ### 철학
    모든 학생은 성장할 수 있습니다.
    실패는 배움의 과정이며, 노력은 성장의 증거입니다.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React 개발 서버
        "http://localhost:8000",  # FastAPI 서버
        # 프로덕션 도메인 추가
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 라우터 등록
app.include_router(growth_logs.router)
app.include_router(lms_integration.router)


# 루트 엔드포인트
@app.get("/", tags=["root"])
async def root():
    """
    API 루트 엔드포인트

    시스템 정보 및 사용 가능한 엔드포인트 안내
    """
    return {
        "message": "🌱 Growth Log System API",
        "description": "오답을 '실패'가 아닌 '성장 기회'로 기록하는 시스템",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "growth_logs": "/api/v1/growth-logs",
            "lms_integration": "/api/v1/lms",
        },
        "philosophy": "모든 학생은 성장할 수 있습니다 🌱"
    }


# 헬스 체크
@app.get("/health", tags=["health"])
async def health_check():
    """
    시스템 헬스 체크

    서비스 상태 확인
    """
    return {
        "status": "healthy",
        "service": "growth-log-system",
        "components": {
            "api": "ok",
            # TODO: 데이터베이스 연결 확인
            # "database": "ok" if db_connected else "error",
            # TODO: Redis 연결 확인
            # "redis": "ok" if redis_connected else "error",
        }
    }


# 전역 예외 핸들러
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """전역 예외 처리"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "예기치 않은 오류가 발생했습니다. 관리자에게 문의해주세요.",
            "detail": str(exc) if app.debug else None
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
