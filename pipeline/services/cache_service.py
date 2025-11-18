"""
Redis cache service for caching AI responses and frequently accessed data
"""

import json
import redis.asyncio as redis
from typing import Optional, Any
from loguru import logger
from config import settings


class CacheService:
    """Redis-based caching service"""

    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis_client = await redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_client.ping()
            logger.info("Connected to Redis successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Disconnected from Redis")

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            value = await self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = None):
        """Set value in cache with optional TTL"""
        try:
            ttl = ttl or settings.cache_ttl_medium
            await self.redis_client.setex(
                key,
                ttl,
                json.dumps(value)
            )
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")

    async def delete(self, key: str):
        """Delete key from cache"""
        try:
            await self.redis_client.delete(key)
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")

    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            return await self.redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False
