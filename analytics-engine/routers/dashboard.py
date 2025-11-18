"""Dashboard router - aggregated analytics for visualization"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

from config.database import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/overview")
async def get_system_overview(db: Session = Depends(get_db)):
    """Get overall system statistics"""

    stats_query = text("""
        SELECT
            (SELECT COUNT(*) FROM students) as total_students,
            (SELECT COUNT(*) FROM learning_sessions) as total_sessions,
            (SELECT COUNT(*) FROM learning_events) as total_events,
            (SELECT COUNT(*) FROM peak_thinking_periods) as total_peaks,
            (SELECT AVG(peak_score) FROM peak_thinking_periods) as avg_peak_score
    """)

    stats = db.execute(stats_query).fetchone()

    return {
        'status': 'success',
        'overview': {
            'total_students': stats[0],
            'total_sessions': stats[1],
            'total_events': stats[2],
            'total_peak_periods': stats[3],
            'avg_peak_score': round(float(stats[4]), 3) if stats[4] else 0,
        }
    }

@router.get("/top-performers")
async def get_top_performers(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get top performing students based on peak quality"""

    query = text("""
        SELECT
            s.id,
            s.full_name,
            s.grade_level,
            COUNT(ptp.id) as total_peaks,
            AVG(ptp.peak_score) as avg_peak_score,
            SUM(CASE WHEN ptp.peak_quality = 'excellent' THEN 1 ELSE 0 END) as excellent_count
        FROM students s
        LEFT JOIN peak_thinking_periods ptp ON s.id = ptp.student_id
        GROUP BY s.id, s.full_name, s.grade_level
        HAVING total_peaks > 0
        ORDER BY avg_peak_score DESC, excellent_count DESC
        LIMIT :limit
    """)

    performers = db.execute(query, {"limit": limit}).fetchall()

    result = []
    for p in performers:
        result.append({
            'student_id': p[0],
            'student_name': p[1],
            'grade_level': p[2],
            'total_peak_periods': p[3],
            'avg_peak_score': round(float(p[4]), 3),
            'excellent_count': p[5],
        })

    return {
        'status': 'success',
        'top_performers': result
    }
