"""Peak periods router - retrieve and manage peak thinking periods"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import logging

from config.database import get_db
from models.schemas import PeakThinkingPeriod, PeakPeriodSummary

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/student/{student_id}")
async def get_student_peaks(
    student_id: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get all peak thinking periods for a specific student"""

    query = text("""
        SELECT ptp.*, p.title as problem_title
        FROM peak_thinking_periods ptp
        LEFT JOIN problems p ON ptp.problem_id = p.id
        WHERE ptp.student_id = :student_id
        ORDER BY ptp.period_start DESC
        LIMIT :limit
    """)

    peaks = db.execute(query, {"student_id": student_id, "limit": limit}).fetchall()

    result = []
    for peak in peaks:
        result.append({
            'id': peak[0],
            'session_id': peak[1],
            'period_start': peak[5].isoformat(),
            'period_end': peak[6].isoformat(),
            'duration_sec': float(peak[7]),
            'peak_score': float(peak[12]),
            'peak_quality': peak[13],
            'problem_title': peak[-1] if len(peak) > 20 else None,
        })

    return {
        'status': 'success',
        'student_id': student_id,
        'peak_count': len(result),
        'peaks': result
    }

@router.get("/session/{session_id}")
async def get_session_peaks(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get all peak thinking periods for a specific session"""

    query = text("""
        SELECT * FROM peak_thinking_periods
        WHERE session_id = :session_id
        ORDER BY period_start ASC
    """)

    peaks = db.execute(query, {"session_id": session_id}).fetchall()

    result = []
    for peak in peaks:
        result.append({
            'id': peak[0],
            'period_start': peak[5].isoformat(),
            'period_end': peak[6].isoformat(),
            'duration_sec': float(peak[7]),
            'event_count': peak[8],
            'peak_score': float(peak[12]),
            'peak_quality': peak[13],
            'focus_score': float(peak[11]),
            'efficiency_score': float(peak[10]),
        })

    return {
        'status': 'success',
        'session_id': session_id,
        'peak_count': len(result),
        'peaks': result
    }

@router.get("/summary/student/{student_id}")
async def get_student_peak_summary(
    student_id: str,
    db: Session = Depends(get_db)
):
    """Get summary statistics of peak periods for a student"""

    query = text("""
        SELECT
            COUNT(*) as total_peaks,
            AVG(peak_score) as avg_score,
            AVG(duration_sec) as avg_duration,
            SUM(CASE WHEN peak_quality = 'excellent' THEN 1 ELSE 0 END) as excellent_count,
            SUM(CASE WHEN peak_quality = 'good' THEN 1 ELSE 0 END) as good_count,
            SUM(CASE WHEN peak_quality = 'moderate' THEN 1 ELSE 0 END) as moderate_count,
            SUM(CASE WHEN peak_quality = 'low' THEN 1 ELSE 0 END) as low_count
        FROM peak_thinking_periods
        WHERE student_id = :student_id
    """)

    summary = db.execute(query, {"student_id": student_id}).fetchone()

    if not summary or summary[0] == 0:
        return {
            'status': 'success',
            'student_id': student_id,
            'message': 'No peak periods found',
            'summary': None
        }

    return {
        'status': 'success',
        'student_id': student_id,
        'summary': {
            'total_peak_periods': summary[0],
            'avg_peak_score': round(float(summary[1]), 3) if summary[1] else 0,
            'avg_peak_duration_sec': round(float(summary[2]), 2) if summary[2] else 0,
            'quality_distribution': {
                'excellent': summary[3],
                'good': summary[4],
                'moderate': summary[5],
                'low': summary[6],
            }
        }
    }
