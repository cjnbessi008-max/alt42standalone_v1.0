"""
Performance Analytics API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any
from pydantic import BaseModel
from uuid import UUID

from ..database import get_db
from ..services import PerformanceAnalyzer

router = APIRouter(prefix="/api/performance", tags=["performance"])


@router.get("/students/{student_id}/summary")
async def get_performance_summary(
    student_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive performance summary for a student

    Returns:
        - Overall statistics
        - Per-problem-type breakdown
        - Strongest and weakest areas
    """
    analyzer = PerformanceAnalyzer(db)
    summary = await analyzer.get_student_performance_summary(str(student_id))

    return summary


@router.get("/students/{student_id}/realtime")
async def get_realtime_performance(
    student_id: UUID,
    minutes: int = 30,
    db: AsyncSession = Depends(get_db)
):
    """
    Get real-time performance data for recent activity

    Args:
        student_id: Student UUID
        minutes: Look back this many minutes (default: 30)

    Returns:
        Recent performance metrics
    """
    analyzer = PerformanceAnalyzer(db)
    realtime_data = await analyzer.get_realtime_performance(
        str(student_id),
        minutes=minutes
    )

    return realtime_data
