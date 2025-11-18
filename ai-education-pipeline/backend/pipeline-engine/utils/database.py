"""
Database utility for pipeline engine
"""

import os
from typing import Dict, Any, Optional
from pydantic import UUID4
import psycopg2
from psycopg2.extras import RealDictCursor, Json
import asyncio

from utils.logger import setup_logger

logger = setup_logger("Database")

class Database:
    """PostgreSQL database connection and operations"""

    def __init__(self):
        self.conn = None

    async def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "localhost"),
                port=int(os.getenv("DB_PORT", "5432")),
                database=os.getenv("DB_NAME", "ai_education"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASSWORD", "postgres"),
                cursor_factory=RealDictCursor
            )
            logger.info("Database connected successfully")
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            raise

    async def disconnect(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")

    async def update_job(
        self,
        job_id: UUID4,
        status: Optional[str] = None,
        output_data: Optional[Dict[str, Any]] = None,
        error_log: Optional[str] = None
    ):
        """Update generation job status"""
        cursor = self.conn.cursor()

        try:
            updates = []
            params = []

            if status:
                updates.append("status = %s")
                params.append(status)

                if status == "in_progress":
                    updates.append("started_at = NOW()")
                elif status in ["completed", "failed"]:
                    updates.append("completed_at = NOW()")

            if output_data:
                updates.append("output_data = %s")
                params.append(Json(output_data))

            if error_log:
                updates.append("error_log = %s")
                params.append(error_log)

            if not updates:
                return

            params.append(str(job_id))

            query = f"""
                UPDATE generation_jobs
                SET {', '.join(updates)}
                WHERE id = %s
            """

            cursor.execute(query, params)
            self.conn.commit()

            logger.info(f"Job {job_id} updated: status={status}")

        except Exception as e:
            self.conn.rollback()
            logger.error(f"Failed to update job: {str(e)}")
            raise
        finally:
            cursor.close()

    async def update_module(
        self,
        module_id: UUID4,
        data: Dict[str, Any]
    ):
        """Update module data"""
        cursor = self.conn.cursor()

        try:
            updates = []
            params = []

            for key, value in data.items():
                updates.append(f"{key} = %s")
                if isinstance(value, dict):
                    params.append(Json(value))
                else:
                    params.append(value)

            params.append(str(module_id))

            query = f"""
                UPDATE modules
                SET {', '.join(updates)}, updated_at = NOW()
                WHERE id = %s
            """

            cursor.execute(query, params)
            self.conn.commit()

            logger.info(f"Module {module_id} updated")

        except Exception as e:
            self.conn.rollback()
            logger.error(f"Failed to update module: {str(e)}")
            raise
        finally:
            cursor.close()

    async def get_module(self, module_id: UUID4) -> Optional[Dict[str, Any]]:
        """Get module by ID"""
        cursor = self.conn.cursor()

        try:
            cursor.execute(
                "SELECT * FROM modules WHERE id = %s",
                [str(module_id)]
            )

            return cursor.fetchone()

        except Exception as e:
            logger.error(f"Failed to get module: {str(e)}")
            raise
        finally:
            cursor.close()

    async def get_job(self, job_id: UUID4) -> Optional[Dict[str, Any]]:
        """Get generation job by ID"""
        cursor = self.conn.cursor()

        try:
            cursor.execute(
                "SELECT * FROM generation_jobs WHERE id = %s",
                [str(job_id)]
            )

            return cursor.fetchone()

        except Exception as e:
            logger.error(f"Failed to get job: {str(e)}")
            raise
        finally:
            cursor.close()
