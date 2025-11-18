"""
Database configuration and connection management
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Create async engine
engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    echo=settings.environment == "development",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Create async session factory
AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Base class for models
Base = declarative_base()


async def get_db():
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
