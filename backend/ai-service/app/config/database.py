import psycopg2
from psycopg2.extras import RealDictCursor
import redis
from .settings import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    def __init__(self):
        self.conn = None
        self.redis_client = None

    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.conn = psycopg2.connect(
                settings.database_url,
                cursor_factory=RealDictCursor
            )
            logger.info("✓ Connected to PostgreSQL database")
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise

    def connect_redis(self):
        """Connect to Redis"""
        try:
            self.redis_client = redis.from_url(settings.redis_url, decode_responses=True)
            self.redis_client.ping()
            logger.info("✓ Connected to Redis cache")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    def get_connection(self):
        """Get database connection"""
        if not self.conn or self.conn.closed:
            self.connect()
        return self.conn

    def get_redis(self):
        """Get Redis client"""
        if not self.redis_client:
            self.connect_redis()
        return self.redis_client

    def close(self):
        """Close connections"""
        if self.conn and not self.conn.closed:
            self.conn.close()
            logger.info("✓ PostgreSQL connection closed")
        if self.redis_client:
            self.redis_client.close()
            logger.info("✓ Redis connection closed")


# Global database instance
db = Database()


def get_db():
    """Get database connection for dependency injection"""
    conn = db.get_connection()
    try:
        yield conn
    finally:
        pass  # Don't close the connection, it's managed globally


def get_redis():
    """Get Redis client for dependency injection"""
    return db.get_redis()
