"""
Progress Tracking and Mental Care API
FastAPI endpoints for student progress tracking and mental care messaging
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from uuid import UUID, uuid4
import asyncio
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import services
from services.progress_tracking.learning_speed_analyzer import (
    LearningSpeedAnalyzer,
    StudentAttempt,
    MessageTrigger,
    SpeedTrend
)
from services.mental_care_messaging.message_generator import (
    MentalCareMessageGenerator,
    MessageType,
    MentalCareMessage
)

app = FastAPI(
    title="Student Progress & Mental Care API",
    description="API for tracking student learning progress and providing mental care support",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
speed_analyzer = LearningSpeedAnalyzer()
message_generator = MentalCareMessageGenerator()

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, student_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[student_id] = websocket

    def disconnect(self, student_id: str):
        if student_id in self.active_connections:
            del self.active_connections[student_id]

    async def send_message(self, student_id: str, message: dict):
        if student_id in self.active_connections:
            try:
                await self.active_connections[student_id].send_json(message)
            except Exception as e:
                print(f"Error sending message to {student_id}: {e}")
                self.disconnect(student_id)

manager = ConnectionManager()


# Pydantic models
class AttemptSubmission(BaseModel):
    student_id: str
    module_id: str
    problem_id: str
    is_correct: bool
    time_spent_seconds: int
    hints_used: int = 0
    attempts_count: int = 1
    difficulty_level: Optional[int] = Field(None, ge=1, le=5)

    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "550e8400-e29b-41d4-a716-446655440000",
                "module_id": "660e8400-e29b-41d4-a716-446655440001",
                "problem_id": "770e8400-e29b-41d4-a716-446655440002",
                "is_correct": True,
                "time_spent_seconds": 120,
                "hints_used": 1,
                "attempts_count": 2,
                "difficulty_level": 3
            }
        }


class ProgressQuery(BaseModel):
    student_id: str
    module_id: str
    time_window_minutes: int = 30


class MessageResponse(BaseModel):
    message_id: str
    message_type: str
    trigger_reason: str
    text_ko: str
    text_en: str
    severity: str
    recommended_actions: List[str]
    sent_at: datetime


class AnalysisResponse(BaseModel):
    student_id: str
    module_id: str
    current_speed_score: Optional[float]
    accuracy_rate: Optional[float]
    speed_trend: Optional[str]
    problems_in_window: int
    triggers_detected: List[str]
    message_sent: Optional[MessageResponse]


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Student Progress & Mental Care API",
        "version": "1.0.0"
    }


@app.post("/api/attempts/submit", response_model=AnalysisResponse)
async def submit_attempt(attempt: AttemptSubmission):
    """
    Submit a student attempt and receive real-time analysis
    Automatically triggers mental care messages if needed
    """
    # Create StudentAttempt object
    student_attempt = StudentAttempt(
        student_id=attempt.student_id,
        module_id=attempt.module_id,
        problem_id=attempt.problem_id,
        is_correct=attempt.is_correct,
        time_spent_seconds=attempt.time_spent_seconds,
        attempted_at=datetime.now(),
        hints_used=attempt.hints_used,
        attempts_count=attempt.attempts_count
    )

    # Add to analyzer
    speed_analyzer.add_attempt(student_attempt)

    # Get recent attempts for this student-module combination
    key = (attempt.student_id, attempt.module_id)
    recent_attempts = speed_analyzer.current_metrics.get(key, [])

    # Analyze progress (simplified - in production, fetch previous metrics from DB)
    current_metric, triggers = speed_analyzer.analyze_student_progress(
        attempt.student_id,
        attempt.module_id,
        recent_attempts,
        []  # In production, fetch from database
    )

    # Prepare response
    response = AnalysisResponse(
        student_id=attempt.student_id,
        module_id=attempt.module_id,
        current_speed_score=current_metric.speed_score if current_metric else None,
        accuracy_rate=current_metric.accuracy_rate if current_metric else None,
        speed_trend=current_metric.speed_trend.value if current_metric else None,
        problems_in_window=len(recent_attempts),
        triggers_detected=[t.value for t in triggers],
        message_sent=None
    )

    # Generate and send mental care message if triggers detected
    if triggers:
        recommendations = speed_analyzer.get_recommendations(triggers)

        # Generate message
        care_message = message_generator.generate_message(
            trigger_reason=triggers[0].value,  # Use first trigger
            severity=recommendations['severity'],
            recommended_actions=recommendations['actions']
        )

        # Create message response
        message_response = MessageResponse(
            message_id=str(uuid4()),
            message_type=care_message.message_type.value,
            trigger_reason=care_message.trigger_reason,
            text_ko=care_message.text_ko,
            text_en=care_message.text_en,
            severity=care_message.severity,
            recommended_actions=care_message.recommended_actions,
            sent_at=datetime.now()
        )

        response.message_sent = message_response

        # Send via WebSocket if connected
        await manager.send_message(
            attempt.student_id,
            {
                "type": "mental_care_message",
                "data": message_response.model_dump(mode='json')
            }
        )

        # In production, save to database here
        # await save_mental_care_message_to_db(message_response)

    return response


@app.get("/api/progress/{student_id}/{module_id}")
async def get_progress(student_id: str, module_id: str):
    """Get current progress for a student-module combination"""
    key = (student_id, module_id)
    attempts = speed_analyzer.current_metrics.get(key, [])

    if not attempts:
        return {
            "student_id": student_id,
            "module_id": module_id,
            "total_attempts": 0,
            "message": "No attempts recorded yet"
        }

    total_attempts = len(attempts)
    correct_attempts = sum(1 for a in attempts if a.is_correct)
    total_time = sum(a.time_spent_seconds for a in attempts)

    return {
        "student_id": student_id,
        "module_id": module_id,
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "accuracy_rate": correct_attempts / total_attempts if total_attempts > 0 else 0,
        "total_time_seconds": total_time,
        "average_time_per_problem": total_time / total_attempts if total_attempts > 0 else 0,
        "first_attempt": attempts[0].attempted_at.isoformat() if attempts else None,
        "last_attempt": attempts[-1].attempted_at.isoformat() if attempts else None
    }


@app.get("/api/messages/history/{student_id}")
async def get_message_history(student_id: str, limit: int = 20):
    """Get mental care message history for a student"""
    # In production, fetch from database
    # For now, return mock data
    return {
        "student_id": student_id,
        "message_count": 0,
        "messages": [],
        "note": "In production, this would fetch from database"
    }


@app.post("/api/messages/feedback")
async def submit_message_feedback(
    message_id: str,
    student_id: str,
    reaction: str
):
    """Submit student feedback on a mental care message"""
    if reaction not in ['helpful', 'not_helpful', 'neutral']:
        raise HTTPException(status_code=400, detail="Invalid reaction value")

    # In production, save to database
    return {
        "status": "success",
        "message_id": message_id,
        "student_id": student_id,
        "reaction": reaction,
        "recorded_at": datetime.now().isoformat()
    }


# WebSocket endpoint for real-time notifications
@app.websocket("/ws/{student_id}")
async def websocket_endpoint(websocket: WebSocket, student_id: str):
    """WebSocket connection for real-time mental care messages"""
    await manager.connect(student_id, websocket)

    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection_established",
            "student_id": student_id,
            "timestamp": datetime.now().isoformat()
        })

        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()
            # Echo back for now (in production, handle different message types)
            await websocket.send_json({
                "type": "echo",
                "data": data,
                "timestamp": datetime.now().isoformat()
            })

    except WebSocketDisconnect:
        manager.disconnect(student_id)
        print(f"Student {student_id} disconnected")


# Analytics endpoints
@app.get("/api/analytics/speed-trends/{student_id}/{module_id}")
async def get_speed_trends(
    student_id: str,
    module_id: str,
    days: int = 7
):
    """Get learning speed trends over time"""
    # In production, fetch from learning_speed_metrics table
    return {
        "student_id": student_id,
        "module_id": module_id,
        "period_days": days,
        "trends": [],
        "note": "In production, this would fetch historical metrics from database"
    }


@app.get("/api/analytics/message-effectiveness")
async def get_message_effectiveness(
    module_id: Optional[str] = None,
    days: int = 30
):
    """Get analytics on mental care message effectiveness"""
    # In production, analyze message feedback and student performance
    return {
        "period_days": days,
        "total_messages_sent": 0,
        "helpful_count": 0,
        "not_helpful_count": 0,
        "neutral_count": 0,
        "effectiveness_rate": 0.0,
        "note": "In production, this would analyze actual feedback data"
    }


# Admin endpoints
@app.get("/api/admin/system-status")
async def get_system_status():
    """Get system status and statistics"""
    total_students = len(set(
        student_id for (student_id, _) in speed_analyzer.current_metrics.keys()
    ))
    total_modules = len(set(
        module_id for (_, module_id) in speed_analyzer.current_metrics.keys()
    ))
    total_attempts = sum(
        len(attempts) for attempts in speed_analyzer.current_metrics.values()
    )

    return {
        "status": "operational",
        "timestamp": datetime.now().isoformat(),
        "statistics": {
            "active_students": total_students,
            "active_modules": total_modules,
            "total_attempts_tracked": total_attempts,
            "websocket_connections": len(manager.active_connections)
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
