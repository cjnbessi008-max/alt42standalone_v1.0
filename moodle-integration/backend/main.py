"""
FastAPI 메인 애플리케이션
Moodle LMS 학습 분석 시스템
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import routes
from .models.schemas import Base
from .connectors.moodle_db import MoodleDBConnector

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # 시작 시
    logger.info("Moodle LMS 분석 시스템 시작")

    # TODO: 데이터베이스 초기화
    # TODO: 연결 풀 생성

    yield

    # 종료 시
    logger.info("Moodle LMS 분석 시스템 종료")
    # TODO: 리소스 정리


# FastAPI 앱 생성
app = FastAPI(
    title="Moodle LMS 학습 분석 API",
    description="""
    Moodle 3.7 LMS와 연동하여 학생들의 추론(reasoning)과 계산(calculation) 능력을 분석합니다.

    ## 주요 기능

    * **데이터 동기화**: Moodle DB에서 학생, 문제, 시도 데이터 수집
    * **문제 분류**: AI 기반 문제 유형 자동 분류
    * **성과 분석**: 학생별 추론/계산 능력 비교 분석
    * **인사이트 생성**: AI 기반 학습 패턴 분석 및 추천
    * **리포트**: 개인/코스 성과 리포트 생성
    """,
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(
    routes.router,
    prefix="/api",
    tags=["analysis"]
)


# 루트 엔드포인트
@app.get("/")
async def root():
    """API 루트"""
    return {
        "name": "Moodle LMS 학습 분석 API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }


# 에러 핸들러
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """전역 예외 처리"""
    logger.error(f"예외 발생: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
