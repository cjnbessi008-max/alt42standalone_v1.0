"""Database connection and session management."""
import asyncpg
from contextlib import asynccontextmanager
from typing import AsyncGenerator
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/ai_education_db")


class Database:
    """Database connection manager."""

    def __init__(self):
        self.pool = None

    async def connect(self):
        """Create database connection pool."""
        self.pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=5,
            max_size=20,
            command_timeout=60
        )
        print("✅ Database connection pool created")

    async def disconnect(self):
        """Close database connection pool."""
        if self.pool:
            await self.pool.close()
            print("✅ Database connection pool closed")

    @asynccontextmanager
    async def get_connection(self) -> AsyncGenerator[asyncpg.Connection, None]:
        """Get a database connection from the pool."""
        async with self.pool.acquire() as connection:
            yield connection


# Global database instance
db = Database()


async def get_db_connection():
    """Dependency for getting database connection."""
    async with db.get_connection() as conn:
        yield conn
