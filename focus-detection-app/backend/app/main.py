from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.utils.database import init_db
from app.routes import sessions, focus, reports, websocket

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시 데이터베이스 초기화
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized successfully")
    yield
    # 종료 시 정리 작업 (필요한 경우)
    logger.info("Shutting down...")


# FastAPI 앱 생성
app = FastAPI(
    title="Focus Detection API",
    description="실시간 학습 집중도 감지 시스템 API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # 프론트엔드 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(sessions.router)
app.include_router(focus.router)
app.include_router(reports.router)
app.include_router(websocket.router)


@app.get("/")
async def root():
    return {
        "message": "Focus Detection API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "focus-detection-api"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
