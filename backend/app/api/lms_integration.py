"""
LMS Integration API Endpoints
Provides interfaces to sync mind wandering data with Learning Management Systems
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from uuid import UUID
import logging
import httpx

from app.db.database import get_db
from app.models.behavior import MindWanderingEvent, LearningSession
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class LMSSyncRequest(BaseModel):
    """Request model for LMS synchronization"""
    student_id: UUID
    module_id: UUID
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class LMSProgressReport(BaseModel):
    """Progress report to send to LMS"""
    student_id: UUID
    module_id: UUID
    session_count: int
    total_time_seconds: float
    mind_wandering_events: int
    engagement_score: float
    recommendations: List[str]


@router.post("/sync")
async def sync_to_lms(
    sync_request: LMSSyncRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Sync mind wandering and engagement data to LMS

    This endpoint aggregates student data and sends it to the configured LMS
    """
    try:
        # Set default date range if not provided
        end_date = sync_request.end_date or datetime.utcnow()
        start_date = sync_request.start_date or (end_date - timedelta(days=7))

        # Gather session data
        sessions = db.query(LearningSession).filter(
            LearningSession.student_id == sync_request.student_id,
            LearningSession.module_id == sync_request.module_id,
            LearningSession.started_at >= start_date,
            LearningSession.started_at <= end_date
        ).all()

        if not sessions:
            return {
                "success": True,
                "message": "No session data to sync",
                "synced_sessions": 0
            }

        # Calculate aggregated metrics
        total_time = sum(s.duration_seconds for s in sessions if s.duration_seconds) or 0
        total_mw_events = sum(s.mind_wandering_count for s in sessions if s.mind_wandering_count) or 0
        avg_engagement = sum(s.engagement_score for s in sessions if s.engagement_score) / len(sessions) if sessions else 0

        # Prepare LMS payload
        lms_report = {
            "student_id": str(sync_request.student_id),
            "module_id": str(sync_request.module_id),
            "period_start": start_date.isoformat(),
            "period_end": end_date.isoformat(),
            "metrics": {
                "session_count": len(sessions),
                "total_time_seconds": total_time,
                "mind_wandering_events": total_mw_events,
                "engagement_score": round(avg_engagement, 2),
                "average_session_duration": total_time / len(sessions) if sessions else 0
            },
            "sessions": [
                {
                    "session_id": str(s.id),
                    "started_at": s.started_at.isoformat(),
                    "duration_seconds": s.duration_seconds,
                    "engagement_score": s.engagement_score,
                    "mind_wandering_count": s.mind_wandering_count
                }
                for s in sessions
            ]
        }

        # Send to LMS in background
        background_tasks.add_task(
            send_to_lms,
            lms_report,
            db,
            sync_request.student_id,
            sync_request.module_id
        )

        return {
            "success": True,
            "message": "Sync initiated",
            "synced_sessions": len(sessions),
            "metrics": lms_report["metrics"]
        }

    except Exception as e:
        logger.error(f"Error syncing to LMS: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/{student_id}/{module_id}")
async def get_lms_report(
    student_id: UUID,
    module_id: UUID,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    Generate a report for LMS consumption

    This provides a formatted report that can be displayed in LMS dashboards
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get sessions
        sessions = db.query(LearningSession).filter(
            LearningSession.student_id == student_id,
            LearningSession.module_id == module_id,
            LearningSession.started_at >= cutoff_date
        ).all()

        # Get mind wandering events
        mw_events = db.query(MindWanderingEvent).filter(
            MindWanderingEvent.student_id == student_id,
            MindWanderingEvent.module_id == module_id,
            MindWanderingEvent.detected_at >= cutoff_date
        ).all()

        # Calculate metrics
        total_time = sum(s.duration_seconds for s in sessions if s.duration_seconds) or 0
        avg_engagement = sum(s.engagement_score for s in sessions if s.engagement_score) / len(sessions) if sessions else 0

        # Calculate focus quality
        if total_time > 0:
            total_mw_time = sum(e.duration_seconds for e in mw_events if e.duration_seconds) or 0
            focus_quality = max(0, 100 - (total_mw_time / total_time * 100))
        else:
            focus_quality = 0

        # Generate insights
        insights = _generate_lms_insights(sessions, mw_events, avg_engagement)

        return {
            "student_id": str(student_id),
            "module_id": str(module_id),
            "report_period_days": days,
            "summary": {
                "total_sessions": len(sessions),
                "total_time_minutes": round(total_time / 60, 1),
                "mind_wandering_events": len(mw_events),
                "average_engagement_score": round(avg_engagement, 1),
                "focus_quality_score": round(focus_quality, 1)
            },
            "insights": insights,
            "trend": _calculate_trend(sessions),
            "generated_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error generating LMS report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook/student-progress")
async def lms_webhook_handler(
    webhook_data: dict,
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint for LMS to receive updates

    This allows the LMS to push student enrollment or other updates
    """
    try:
        logger.info(f"Received LMS webhook: {webhook_data}")

        # Process webhook based on event type
        event_type = webhook_data.get("event_type")

        if event_type == "student_enrolled":
            # Handle student enrollment
            logger.info(f"Student enrolled: {webhook_data.get('student_id')}")

        elif event_type == "module_updated":
            # Handle module updates
            logger.info(f"Module updated: {webhook_data.get('module_id')}")

        return {
            "success": True,
            "message": "Webhook processed",
            "event_type": event_type
        }

    except Exception as e:
        logger.error(f"Error processing LMS webhook: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def send_to_lms(
    report_data: dict,
    db: Session,
    student_id: UUID,
    module_id: UUID
):
    """
    Background task to send data to LMS

    This actually communicates with the external LMS API
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.LMS_API_URL}/student-progress",
                json=report_data,
                headers={
                    "Authorization": f"Bearer {settings.LMS_API_KEY}",
                    "Content-Type": "application/json"
                },
                timeout=30.0
            )

            if response.status_code == 200:
                logger.info(f"Successfully synced to LMS for student {student_id}")

                # Mark mind wandering events as synced
                db.query(MindWanderingEvent).filter(
                    MindWanderingEvent.student_id == student_id,
                    MindWanderingEvent.module_id == module_id,
                    MindWanderingEvent.synced_to_lms == False
                ).update({
                    "synced_to_lms": True,
                    "synced_at": datetime.utcnow()
                })
                db.commit()

            else:
                logger.error(
                    f"Failed to sync to LMS: {response.status_code} - {response.text}"
                )

    except Exception as e:
        logger.error(f"Error sending to LMS: {str(e)}")


def _generate_lms_insights(
    sessions: List[LearningSession],
    mw_events: List[MindWanderingEvent],
    avg_engagement: float
) -> List[str]:
    """Generate insights for LMS dashboard"""
    insights = []

    if avg_engagement >= 80:
        insights.append("학생이 매우 높은 집중력을 보이고 있습니다. 우수한 학습 태도입니다!")
    elif avg_engagement >= 60:
        insights.append("학생이 양호한 집중력을 유지하고 있습니다.")
    else:
        insights.append("학생의 집중력 향상이 필요합니다. 추가 지원을 고려해보세요.")

    # Check for patterns
    if len(mw_events) > 10:
        # Check time patterns
        hour_counts = {}
        for event in mw_events:
            hour = event.detected_at.hour
            hour_counts[hour] = hour_counts.get(hour, 0) + 1

        if hour_counts:
            peak_hour = max(hour_counts.items(), key=lambda x: x[1])[0]
            insights.append(f"집중력 저하가 주로 {peak_hour}시경에 발생합니다.")

    # Session frequency
    if len(sessions) > 0:
        avg_duration = sum(s.duration_seconds for s in sessions if s.duration_seconds) / len(sessions)
        if avg_duration < 300:  # Less than 5 minutes
            insights.append("학습 세션이 너무 짧습니다. 더 긴 학습 시간을 권장합니다.")
        elif avg_duration > 3600:  # More than 1 hour
            insights.append("학습 세션이 매우 깁니다. 중간에 휴식을 권장합니다.")

    return insights


def _calculate_trend(sessions: List[LearningSession]) -> str:
    """Calculate engagement trend"""
    if len(sessions) < 2:
        return "insufficient_data"

    # Sort by date
    sorted_sessions = sorted(sessions, key=lambda s: s.started_at)

    # Compare first half vs second half
    mid_point = len(sorted_sessions) // 2
    first_half = sorted_sessions[:mid_point]
    second_half = sorted_sessions[mid_point:]

    avg_first = sum(s.engagement_score for s in first_half if s.engagement_score) / len(first_half) if first_half else 0
    avg_second = sum(s.engagement_score for s in second_half if s.engagement_score) / len(second_half) if second_half else 0

    if avg_second > avg_first + 10:
        return "improving"
    elif avg_second < avg_first - 10:
        return "declining"
    else:
        return "stable"
