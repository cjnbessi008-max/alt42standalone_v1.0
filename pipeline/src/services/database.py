"""
Database Connection and Utilities
"""

import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional

logger = logging.getLogger(__name__)


def get_db_connection():
    """
    Get PostgreSQL database connection

    Returns:
        psycopg2 connection object
    """
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")

        conn = psycopg2.connect(database_url)
        return conn

    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise


def get_dict_cursor(conn):
    """
    Get a cursor that returns results as dictionaries

    Args:
        conn: Database connection

    Returns:
        DictCursor object
    """
    return conn.cursor(cursor_factory=RealDictCursor)


class DatabaseManager:
    """Database operations manager"""

    def __init__(self):
        self.conn = None

    def connect(self):
        """Establish database connection"""
        self.conn = get_db_connection()
        return self

    def disconnect(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            self.conn = None

    def __enter__(self):
        """Context manager entry"""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.disconnect()

    def execute_query(self, query: str, params: tuple = None) -> list:
        """
        Execute a SELECT query

        Args:
            query: SQL query string
            params: Query parameters

        Returns:
            List of result rows
        """
        if not self.conn:
            self.connect()

        cursor = get_dict_cursor(self.conn)
        cursor.execute(query, params)
        results = cursor.fetchall()
        cursor.close()
        return results

    def execute_update(self, query: str, params: tuple = None) -> int:
        """
        Execute an INSERT/UPDATE/DELETE query

        Args:
            query: SQL query string
            params: Query parameters

        Returns:
            Number of affected rows
        """
        if not self.conn:
            self.connect()

        cursor = self.conn.cursor()
        cursor.execute(query, params)
        affected_rows = cursor.rowcount
        self.conn.commit()
        cursor.close()
        return affected_rows

    def execute_insert_returning(self, query: str, params: tuple = None):
        """
        Execute an INSERT query with RETURNING clause

        Args:
            query: SQL query with RETURNING clause
            params: Query parameters

        Returns:
            Returned row data
        """
        if not self.conn:
            self.connect()

        cursor = get_dict_cursor(self.conn)
        cursor.execute(query, params)
        result = cursor.fetchone()
        self.conn.commit()
        cursor.close()
        return result
