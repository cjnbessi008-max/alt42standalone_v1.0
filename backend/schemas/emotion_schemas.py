"""
Pydantic schemas for emotion detection API
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, UUID4


class BehaviorEventCreate(BaseModel):
    """Schema for creating a new behavior event"""
    student_id: UUID4
    session_id: UUID4
    module_id: UUID4
    event_type: str = Field(..., description="Type of event: click, keypress, mouse_move, scroll, etc.")
    event_data: Optional[Dict[str, Any]] = None
    duration_ms: Optional[int] = None
    mouse_speed: Optional[float] = None
    click_force: Optional[float] = None
    keypress_speed: Optional[float] = None
    page_url: Optional[str] = None
    element_id: Optional[str] = None
    element_type: Optional[str] = None
    is_correct_answer: Optional[str] = None
    attempt_number: Optional[int] = None
    time_since_last_event_ms: Optional[int] = None

    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "123e4567-e89b-12d3-a456-426614174000",
                "session_id": "123e4567-e89b-12d3-a456-426614174001",
                "module_id": "123e4567-e89b-12d3-a456-426614174002",
                "event_type": "click",
                "event_data": {"target": "submit_button", "position": {"x": 150, "y": 300}},
                "duration_ms": 120,
                "is_correct_answer": "incorrect",
                "attempt_number": 3
            }
        }


class BehaviorEventResponse(BaseModel):
    """Response schema for behavior event"""
    id: UUID4
    student_id: UUID4
    session_id: UUID4
    module_id: UUID4
    event_type: str
    timestamp: datetime
    primary_emotion: Optional[str] = None
    emotion_confidence: Optional[float] = None

    class Config:
        from_attributes = True


class EmotionStateResponse(BaseModel):
    """Response schema for detected emotion state"""
    id: UUID4
    student_id: UUID4
    session_id: UUID4
    module_id: UUID4
    frustration_score: float = Field(..., ge=0.0, le=1.0)
    concentration_score: float = Field(..., ge=0.0, le=1.0)
    confusion_score: float = Field(..., ge=0.0, le=1.0)
    primary_emotion: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    events_analyzed: int
    detected_at: datetime
    analysis_method: Optional[str] = None

    class Config:
        from_attributes = True


class EmotionAnalysisRequest(BaseModel):
    """Request to analyze emotions for a session"""
    session_id: UUID4
    student_id: UUID4
    window_minutes: int = Field(default=5, ge=1, le=60, description="Analysis window in minutes")


class EmotionPatternResponse(BaseModel):
    """Response schema for emotion pattern"""
    id: UUID4
    student_id: UUID4
    session_id: UUID4
    module_id: UUID4
    window_start: datetime
    window_end: datetime
    duration_minutes: int
    frustration_count: int
    concentration_count: int
    confusion_count: int
    neutral_count: int
    dominant_emotion: str
    emotion_transitions: int
    is_concerning: str
    intervention_suggested: str
    intervention_type: Optional[str] = None
    avg_accuracy: Optional[float] = None
    completion_rate: Optional[float] = None

    class Config:
        from_attributes = True


class EmotionDashboardData(BaseModel):
    """Dashboard data aggregating emotion information"""
    student_id: UUID4
    session_id: UUID4
    current_emotion: Optional[EmotionStateResponse] = None
    emotion_history: List[EmotionStateResponse] = []
    pattern_analysis: Optional[EmotionPatternResponse] = None
    alerts: List[str] = []
    recommendations: List[str] = []


class LMSIntegrationConfig(BaseModel):
    """Configuration for LMS integration"""
    lms_type: str = Field(..., description="Type of LMS: canvas, moodle, blackboard, custom")
    lms_url: str
    api_key: Optional[str] = None
    webhook_url: Optional[str] = None
    course_id: Optional[str] = None
    send_alerts: bool = True
    alert_threshold: float = Field(default=0.7, ge=0.0, le=1.0, description="Emotion threshold for alerts")


class LMSWebhookPayload(BaseModel):
    """Payload sent to LMS webhook"""
    event_type: str = Field(..., description="emotion_detected, pattern_alert, intervention_needed")
    student_id: UUID4
    session_id: UUID4
    module_id: UUID4
    timestamp: datetime
    emotion_data: Dict[str, Any]
    severity: str = Field(..., description="low, medium, high")
    recommended_action: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "event_type": "pattern_alert",
                "student_id": "123e4567-e89b-12d3-a456-426614174000",
                "session_id": "123e4567-e89b-12d3-a456-426614174001",
                "module_id": "123e4567-e89b-12d3-a456-426614174002",
                "timestamp": "2025-11-18T10:30:00Z",
                "emotion_data": {
                    "primary_emotion": "frustration",
                    "confidence": 0.85,
                    "duration_minutes": 8
                },
                "severity": "high",
                "recommended_action": "Consider providing a hint or simplifying the problem"
            }
        }
