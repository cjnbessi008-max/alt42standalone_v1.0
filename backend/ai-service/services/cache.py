import os
import json
import redis.asyncio as redis
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Redis client
_redis_client: Optional[redis.Redis] = None

async def get_redis_client() -> redis.Redis:
    """Get or create Redis client"""
    global _redis_client
    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        _redis_client = await redis.from_url(redis_url, decode_responses=True)
    return _redis_client

async def get_cached_summary(cache_key: str) -> Optional[Dict[str, Any]]:
    """Get cached summary from Redis"""
    if not os.getenv("ENABLE_CACHE", "true").lower() == "true":
        return None

    try:
        client = await get_redis_client()
        cached = await client.get(cache_key)
        if cached:
            return json.loads(cached)
        return None
    except Exception as e:
        logger.warning(f"Cache retrieval error: {e}")
        return None

async def cache_summary(cache_key: str, summary_data: Dict[str, Any]) -> None:
    """Cache summary in Redis"""
    if not os.getenv("ENABLE_CACHE", "true").lower() == "true":
        return

    try:
        client = await get_redis_client()
        ttl = int(os.getenv("CACHE_TTL", "3600"))
        await client.setex(cache_key, ttl, json.dumps(summary_data))
    except Exception as e:
        logger.warning(f"Cache storage error: {e}")
