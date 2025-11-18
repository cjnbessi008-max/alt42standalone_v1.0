import os
from sqlalchemy.ext.asyncio import create_async_engine
import logging

logger = logging.getLogger(__name__)

async def init_db():
    """Initialize database connection"""
    database_url = os.getenv("DATABASE_URL", "").replace("postgresql://", "postgresql+asyncpg://")

    if not database_url:
        logger.warning("DATABASE_URL not configured")
        return

    try:
        engine = create_async_engine(database_url, echo=False)
        # Test connection
        async with engine.begin() as conn:
            logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
