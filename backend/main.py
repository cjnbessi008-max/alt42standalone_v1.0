"""
FastAPI 메인 애플리케이션
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from app.core.config import settings
from app.core.database import engine, Base
from app.api import cards, students
from app.services.scheduler import card_scheduler

# 로그 설정
logger.add(
    "logs/app.log",
    rotation="1 day",
    retention="30 days",
    level="INFO"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 라이프사이클 관리"""
    # 시작 시
    logger.info("애플리케이션 시작")

    # 데이터베이스 테이블 생성 (개발용 - 프로덕션에서는 Alembic 사용)
    Base.metadata.create_all(bind=engine)

    # 스케줄러 시작
    card_scheduler.start()

    yield

    # 종료 시
    logger.info("애플리케이션 종료")
    card_scheduler.stop()


# FastAPI 앱 생성
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="LMS 연동 성공 루틴 카드 시스템",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(cards.router)
app.include_router(students.router)


@app.get("/")
def root():
    """루트 엔드포인트"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
