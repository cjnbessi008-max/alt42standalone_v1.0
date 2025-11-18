from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from app.models.database import Base
import os

# SQLite 데이터베이스 경로
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./focus_detection.db")

# 비동기 엔진 생성
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # SQL 로그 출력 (개발용)
    future=True,
)

# 비동기 세션 팩토리
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """데이터베이스 초기화"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """데이터베이스 세션 의존성"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
