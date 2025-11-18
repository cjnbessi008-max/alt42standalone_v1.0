"""
Bottleneck Detection API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Dict, Any
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from ..database import get_db
from ..models import BottleneckDetection, ProblemType
from ..services import BottleneckDetector

router = APIRouter(prefix="/api/bottlenecks", tags=["bottlenecks"])


# Pydantic schemas
class BottleneckResponse(BaseModel):
    id: UUID
    student_id: UUID
    problem_type_id: UUID
    problem_type_name: str
    category: str
    accuracy_rate: float
    avg_solve_time_seconds: int
    difficulty_score: float
    severity: str
    detection_reason: str
    detected_at: datetime
    is_active: bool
    recommended_actions: Dict[str, Any] | None

    class Config:
        from_attributes = True


class BottleneckAnalysisRequest(BaseModel):
    lookback_days: int = 30
    min_attempts: int = 5


@router.get("/students/{student_id}", response_model=List[BottleneckResponse])
async def get_student_bottlenecks(
    student_id: UUID,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all bottlenecks for a student

    Args:
        student_id: Student UUID
        active_only: If True, only return active bottlenecks
    """
    query = select(BottleneckDetection).where(
        BottleneckDetection.student_id == student_id
    )

    if active_only:
        query = query.where(BottleneckDetection.is_active == True)

    query = query.order_by(BottleneckDetection.difficulty_score.desc())

    result = await db.execute(query)
    bottlenecks = result.scalars().all()

    # Enrich with problem type info
    response = []
    for bottleneck in bottlenecks:
        type_query = select(ProblemType).where(ProblemType.id == bottleneck.problem_type_id)
        type_result = await db.execute(type_query)
        problem_type = type_result.scalar_one_or_none()

        if problem_type:
            response.append({
                "id": bottleneck.id,
                "student_id": bottleneck.student_id,
                "problem_type_id": bottleneck.problem_type_id,
                "problem_type_name": problem_type.name,
                "category": problem_type.category,
                "accuracy_rate": float(bottleneck.accuracy_rate or 0),
                "avg_solve_time_seconds": bottleneck.avg_solve_time_seconds or 0,
                "difficulty_score": float(bottleneck.difficulty_score or 0),
                "severity": bottleneck.severity,
                "detection_reason": bottleneck.detection_reason,
                "detected_at": bottleneck.detected_at,
                "is_active": bottleneck.is_active,
                "recommended_actions": bottleneck.recommended_actions
            })

    return response


@router.post("/students/{student_id}/analyze")
async def analyze_student_bottlenecks(
    student_id: UUID,
    params: BottleneckAnalysisRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger bottleneck analysis for a student

    This will analyze the student's performance and detect any bottlenecks
    """
    detector = BottleneckDetector(db)
    bottlenecks = await detector.analyze_student(
        str(student_id),
        lookback_days=params.lookback_days,
        min_attempts=params.min_attempts
    )

    return {
        "student_id": student_id,
        "analyzed_at": datetime.utcnow().isoformat(),
        "bottlenecks_detected": len(bottlenecks),
        "bottlenecks": [
            {
                "id": str(b.id),
                "problem_type_id": str(b.problem_type_id),
                "severity": b.severity,
                "difficulty_score": float(b.difficulty_score)
            }
            for b in bottlenecks
        ]
    }


@router.post("/students/{student_id}/resolve/{bottleneck_id}")
async def resolve_bottleneck(
    student_id: UUID,
    bottleneck_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a bottleneck as resolved

    This should be called when the student has improved in that problem type
    """
    detector = BottleneckDetector(db)
    success = await detector.resolve_bottleneck(
        str(bottleneck_id),
        str(student_id)
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bottleneck not found or already resolved"
        )

    return {
        "bottleneck_id": bottleneck_id,
        "resolved": True,
        "resolved_at": datetime.utcnow().isoformat()
    }
