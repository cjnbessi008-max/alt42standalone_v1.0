"""
Database service for managing connections and queries
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import os
from typing import Optional


class DatabaseService:
    """Database connection and query service"""

    def __init__(self, database_url: Optional[str] = None):
        """Initialize database service"""
        self.database_url = database_url or os.getenv('DATABASE_URL')
        if not self.database_url:
            raise ValueError("DATABASE_URL not configured")

    @contextmanager
    def get_connection(self):
        """Get database connection as context manager"""
        conn = psycopg2.connect(self.database_url)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @contextmanager
    def get_cursor(self, conn=None):
        """Get database cursor as context manager"""
        close_conn = False
        if conn is None:
            conn = psycopg2.connect(self.database_url)
            close_conn = True

        cursor = conn.cursor(cursor_factory=RealDictCursor)
        try:
            yield cursor
            if close_conn:
                conn.commit()
        except Exception:
            if close_conn:
                conn.rollback()
            raise
        finally:
            cursor.close()
            if close_conn:
                conn.close()

    def execute_query(self, query: str, params: tuple = None):
        """Execute a query and return results"""
        with self.get_connection() as conn:
            with self.get_cursor(conn) as cursor:
                cursor.execute(query, params)
                if cursor.description:  # SELECT query
                    return cursor.fetchall()
                return cursor.rowcount  # INSERT/UPDATE/DELETE

    def execute_one(self, query: str, params: tuple = None):
        """Execute a query and return one result"""
        with self.get_connection() as conn:
            with self.get_cursor(conn) as cursor:
                cursor.execute(query, params)
                if cursor.description:
                    return cursor.fetchone()
                return None
