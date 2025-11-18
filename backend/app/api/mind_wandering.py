"""
Mind Wandering Detection API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
from uuid import UUID
import logging

from app.db.database import get_db
from app.models.behavior import MindWanderingEvent, LearningSession
from app.services.mind_wandering_detector import MindWanderingDetector

router = APIRouter()
logger = logging.getLogger(__name__)


class MindWanderingResponse(BaseModel):
    """Response model for mind wandering events"""
    id: UUID
    student_id: UUID
    module_id: UUID
    session_id: UUID
    detected_at: datetime
    duration_seconds: Optional[float]
    confidence_score: float
    behavior_pattern: dict
    contributing_factors: List[str]
    intervention_shown: bool
    intervention_type: Optional[str]


class InterventionUpdate(BaseModel):
    """Request model for updating intervention status"""
    intervention_type: str
    student_response: Optional[str] = None


@router.get("/detect/{student_id}/{session_id}")
async def check_mind_wandering(
    student_id: UUID,
    session_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Check if mind wandering is currently happening for a student session

    This can be called periodically from the frontend to check current status
    """
    try:
        detector = MindWanderingDetector(db)

        # Get the session to find module_id
        session = db.query(LearningSession).filter(
            LearningSession.id == session_id
        ).first()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        result = detector.analyze_recent_behavior(
            student_id=str(student_id),
            session_id=str(session_id)
        )

        if result and result.get("detected"):
            # Record the detection
            event = detector.record_detection(
                student_id=str(student_id),
                module_id=str(session.module_id),
                session_id=str(session_id),
                detection_result=result
            )

            return {
                "mind_wandering_detected": True,
                "confidence": result["confidence"],
                "factors": result["factors"],
                "event_id": str(event.id),
                "recommendation": _get_intervention_recommendation(result)
            }
        else:
            return {
                "mind_wandering_detected": False,
                "message": "Student appears to be focused"
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking mind wandering: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{student_id}")
async def get_mind_wandering_history(
    student_id: UUID,
    module_id: Optional[UUID] = None,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db)
):
    """
    Get mind wandering history for a student

    Useful for analytics and identifying patterns
    """
    try:
        detector = MindWanderingDetector(db)
        events = detector.get_student_wandering_history(
            student_id=str(student_id),
            module_id=str(module_id) if module_id else None,
            limit=limit
        )

        return {
            "student_id": str(student_id),
            "total_events": len(events),
            "events": [
                {
                    "id": str(e.id),
                    "detected_at": e.detected_at.isoformat(),
                    "duration_seconds": e.duration_seconds,
                    "confidence_score": e.confidence_score,
                    "contributing_factors": e.contributing_factors,
                    "module_id": str(e.module_id),
                    "session_id": str(e.session_id)
                }
                for e in events
            ]
        }

    except Exception as e:
        logger.error(f"Error getting mind wandering history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/{student_id}")
async def get_student_analytics(
    student_id: UUID,
    module_id: Optional[UUID] = None,
    days: int = Query(default=7, le=90),
    db: Session = Depends(get_db)
):
    """
    Get analytics about student's mind wandering patterns

    Returns aggregated statistics over the specified time period
    """
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Build query
        query = db.query(MindWanderingEvent).filter(
            MindWanderingEvent.student_id == student_id,
            MindWanderingEvent.detected_at >= cutoff_date
        )

        if module_id:
            query = query.filter(MindWanderingEvent.module_id == module_id)

        events = query.all()

        # Calculate statistics
        total_events = len(events)
        total_duration = sum(e.duration_seconds for e in events if e.duration_seconds)
        avg_confidence = sum(e.confidence_score for e in events) / total_events if total_events > 0 else 0

        # Identify common factors
        factor_counts = {}
        for event in events:
            if event.contributing_factors:
                for factor in event.contributing_factors:
                    factor_counts[factor] = factor_counts.get(factor, 0) + 1

        # Get session statistics
        session_query = db.query(LearningSession).filter(
            LearningSession.student_id == student_id,
            LearningSession.started_at >= cutoff_date
        )

        if module_id:
            session_query = session_query.filter(LearningSession.module_id == module_id)

        sessions = session_query.all()
        avg_engagement = sum(s.engagement_score for s in sessions if s.engagement_score) / len(sessions) if sessions else 0

        return {
            "student_id": str(student_id),
            "period_days": days,
            "total_mind_wandering_events": total_events,
            "total_duration_seconds": total_duration,
            "average_confidence": round(avg_confidence, 2),
            "common_factors": factor_counts,
            "total_sessions": len(sessions),
            "average_engagement_score": round(avg_engagement, 2),
            "recommendations": _generate_recommendations(factor_counts, avg_engagement)
        }

    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/events/{event_id}/intervention")
async def update_intervention(
    event_id: UUID,
    intervention: InterventionUpdate,
    db: Session = Depends(get_db)
):
    """
    Update intervention details for a mind wandering event

    Called when the system shows an intervention to the student
    """
    try:
        event = db.query(MindWanderingEvent).filter(
            MindWanderingEvent.id == event_id
        ).first()

        if not event:
            raise HTTPException(status_code=404, detail="Mind wandering event not found")

        event.intervention_shown = True
        event.intervention_type = intervention.intervention_type
        event.student_response = intervention.student_response

        db.commit()
        db.refresh(event)

        return {
            "success": True,
            "event_id": str(event.id),
            "intervention_type": event.intervention_type,
            "message": "Intervention updated successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating intervention: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def _get_intervention_recommendation(detection_result: dict) -> dict:
    """
    Recommend an appropriate intervention based on detection factors

    Returns intervention type and message
    """
    factors = detection_result.get("factors", {})
    confidence = detection_result.get("confidence", 0)

    # High confidence, long inactivity -> suggest break
    if confidence > 0.8 and factors.get("inactivity_duration", 0) > 60:
        return {
            "type": "break_suggestion",
            "message": "잠시 휴식을 취하는 것은 어떨까요? 🌟",
            "message_en": "How about taking a short break? 🌟"
        }

    # Focus losses -> gentle reminder
    if factors.get("focus_losses", 0) > 2:
        return {
            "type": "focus_reminder",
            "message": "다시 집중해볼까요? 조금만 더 힘내세요! 💪",
            "message_en": "Let's focus again! You can do it! 💪"
        }

    # Rapid clicks (frustration) -> offer help
    if factors.get("rapid_clicks", 0) > 10:
        return {
            "type": "help_offer",
            "message": "어려운 부분이 있나요? 도움이 필요하면 알려주세요! 🤝",
            "message_en": "Is something difficult? Let me know if you need help! 🤝"
        }

    # Default gentle reminder
    return {
        "type": "gentle_reminder",
        "message": "계속 집중해서 학습해봐요! 잘하고 있어요! ✨",
        "message_en": "Keep up the great work! You're doing well! ✨"
    }


def _generate_recommendations(factor_counts: dict, avg_engagement: float) -> List[str]:
    """Generate recommendations based on mind wandering patterns"""
    recommendations = []

    # Low engagement
    if avg_engagement < 50:
        recommendations.append(
            "전반적인 집중도가 낮습니다. 학습 시간을 짧게 나누어 진행해보세요."
        )

    # Frequent inactivity
    if factor_counts.get("inactivity_duration", 0) > factor_counts.get("focus_losses", 0):
        recommendations.append(
            "비활성 시간이 많습니다. 인터랙티브한 요소를 더 추가하면 도움이 될 수 있습니다."
        )

    # Frequent focus losses
    if factor_counts.get("focus_losses", 0) > 5:
        recommendations.append(
            "자주 화면을 벗어납니다. 조용한 학습 환경을 만들어보세요."
        )

    # Rapid clicking (frustration)
    if factor_counts.get("rapid_clicks", 0) > 3:
        recommendations.append(
            "좌절감을 보이는 패턴이 있습니다. 난이도를 조정하거나 추가 도움을 제공하세요."
        )

    if not recommendations:
        recommendations.append("좋은 집중력을 유지하고 있습니다! 계속 이렇게 해보세요! 👏")

    return recommendations
