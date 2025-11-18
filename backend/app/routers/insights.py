"""
Growth insights API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..database import get_db
from ..schemas import GrowthInsightResponse, DailyGrowthReport
from ..services import MetacognitionAnalyzer

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/daily/{student_id}", response_model=DailyGrowthReport)
async def get_daily_insights(
    student_id: str,
    date: str = None,
    db: Session = Depends(get_db)
):
    """
    Get daily metacognitive growth insights for a student

    Args:
        student_id: Student ID
        date: Optional date in ISO format (YYYY-MM-DD). Defaults to today.
    """
    analyzer = MetacognitionAnalyzer(db)

    target_date = None
    if date:
        try:
            target_date = datetime.fromisoformat(date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    try:
        report = await analyzer.generate_daily_insights(student_id, target_date)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")


@router.get("/student/{student_id}", response_model=List[GrowthInsightResponse])
def get_student_insights(
    student_id: str,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Get recent growth insights for a student

    Args:
        student_id: Student ID
        days: Number of days to look back (default: 7)
    """
    analyzer = MetacognitionAnalyzer(db)

    try:
        insights = analyzer.get_student_insights(student_id, days)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching insights: {str(e)}")


@router.post("/generate/{student_id}", status_code=202)
async def generate_insights_async(
    student_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger asynchronous generation of insights for a student

    This endpoint starts the insight generation in the background
    and returns immediately.
    """
    async def generate_task():
        analyzer = MetacognitionAnalyzer(db)
        await analyzer.generate_daily_insights(student_id)

    background_tasks.add_task(generate_task)

    return {
        "message": "Insight generation started",
        "student_id": student_id
    }
