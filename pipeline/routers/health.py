"""
Health check endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from services.cache_service import CacheService
import asyncio

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "AI Education Pipeline"
    }


@router.get("/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check including dependencies"""
    health_status = {
        "status": "healthy",
        "checks": {}
    }

    # Check database
    try:
        await db.execute("SELECT 1")
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    # Check Redis
    try:
        cache = CacheService()
        await cache.connect()
        await cache.redis_client.ping()
        health_status["checks"]["redis"] = "healthy"
        await cache.disconnect()
    except Exception as e:
        health_status["checks"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"

    return health_status
