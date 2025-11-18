"""
DMN Status Models
Data models for DMN (Default Mode Network) status tracking
"""
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, validator


class DMNStatus(str, Enum):
    """DMN activation status levels"""
    DEEP_FOCUS = "deep_focus"  # Green - Optimal learning state
    ACTIVE_LEARNING = "active_learning"  # Blue - Engaged and active
    WANDERING = "wandering"  # Yellow - Attention drifting
    DISENGAGED = "disengaged"  # Red - Not engaged


class DMNColorCode(str, Enum):
    """Color codes for each DMN status"""
    DEEP_FOCUS = "#00C853"  # Green
    ACTIVE_LEARNING = "#2196F3"  # Blue
    WANDERING = "#FFC107"  # Amber
    DISENGAGED = "#F44336"  # Red


class EventType(str, Enum):
    """Types of interaction events"""
    CLICK = "click"
    KEYPRESS = "keypress"
    MOUSE_MOVE = "mouse_move"
    SCROLL = "scroll"
    FOCUS = "focus"
    BLUR = "blur"
    PAGE_LOAD = "page_load"
    SUBMIT = "submit"


class InteractionEvent(BaseModel):
    """Single interaction event from student"""
    student_id: str
    session_id: str
    event_type: EventType
    event_data: Optional[Dict[str, Any]] = None
    page_url: Optional[str] = None
    element_target: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    time_since_session_start: Optional[int] = None  # seconds

    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "123e4567-e89b-12d3-a456-426614174000",
                "session_id": "223e4567-e89b-12d3-a456-426614174001",
                "event_type": "click",
                "event_data": {"x": 250, "y": 400},
                "page_url": "/course/math/fractions",
                "element_target": "button.submit",
                "timestamp": "2025-11-18T10:30:00Z",
                "time_since_session_start": 120
            }
        }


class DMNAnalysisRequest(BaseModel):
    """Request for DMN status analysis"""
    student_id: str
    session_id: str
    course_id: str
    events: list[InteractionEvent]
    analysis_window_seconds: int = Field(default=30, ge=5, le=300)


class BehavioralMetrics(BaseModel):
    """Calculated behavioral metrics from events"""
    interaction_count: int = 0
    mouse_movement_intensity: float = 0.0  # 0.0 to 1.0
    keyboard_activity_rate: float = 0.0  # keypress per second
    page_focus_duration: int = 0  # seconds
    idle_time_seconds: int = 0
    click_frequency: float = 0.0  # clicks per minute
    scroll_activity: float = 0.0  # scroll events per minute


class DMNStatusResponse(BaseModel):
    """DMN status analysis result"""
    student_id: str
    session_id: str
    course_id: str

    # DMN Status
    status: DMNStatus
    color_code: str
    confidence_score: float = Field(ge=0.0, le=1.0)

    # Behavioral metrics
    metrics: BehavioralMetrics

    # Analysis metadata
    analysis_window_seconds: int
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None

    @validator('color_code', always=True)
    def set_color_code(cls, v, values):
        """Automatically set color code based on status"""
        if 'status' in values:
            status_to_color = {
                DMNStatus.DEEP_FOCUS: DMNColorCode.DEEP_FOCUS.value,
                DMNStatus.ACTIVE_LEARNING: DMNColorCode.ACTIVE_LEARNING.value,
                DMNStatus.WANDERING: DMNColorCode.WANDERING.value,
                DMNStatus.DISENGAGED: DMNColorCode.DISENGAGED.value,
            }
            return status_to_color.get(values['status'], v)
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "student_id": "123e4567-e89b-12d3-a456-426614174000",
                "session_id": "223e4567-e89b-12d3-a456-426614174001",
                "course_id": "323e4567-e89b-12d3-a456-426614174002",
                "status": "deep_focus",
                "color_code": "#00C853",
                "confidence_score": 0.87,
                "metrics": {
                    "interaction_count": 45,
                    "mouse_movement_intensity": 0.72,
                    "keyboard_activity_rate": 1.2,
                    "page_focus_duration": 28,
                    "idle_time_seconds": 2,
                    "click_frequency": 12.5,
                    "scroll_activity": 8.0
                },
                "analysis_window_seconds": 30,
                "recorded_at": "2025-11-18T10:30:30Z"
            }
        }


class SessionCreate(BaseModel):
    """Create new learning session"""
    student_id: str
    course_id: str
    moodle_session_id: Optional[str] = None


class SessionResponse(BaseModel):
    """Learning session response"""
    id: str
    student_id: str
    course_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    session_status: str = "active"


class DMNAnalyticsQuery(BaseModel):
    """Query parameters for analytics"""
    student_id: Optional[str] = None
    course_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    group_by: str = "hour"  # "hour", "day", "week"


class DMNAnalyticsResponse(BaseModel):
    """Aggregated DMN analytics"""
    student_id: str
    course_id: str
    date: str
    hour: Optional[int] = None

    # DMN distribution percentages
    deep_focus_percentage: float
    active_learning_percentage: float
    wandering_percentage: float
    disengaged_percentage: float

    # Session statistics
    total_sessions: int
    avg_session_duration: int
    total_interactions: int
    avg_confidence_score: float

    # Insights
    optimal_learning_time: Optional[str] = None
    attention_pattern: Optional[str] = None


class AlertType(str, Enum):
    """Types of DMN alerts"""
    PROLONGED_DISENGAGEMENT = "prolonged_disengagement"
    FOCUS_DROP = "focus_drop"
    IMPROVEMENT = "improvement"
    SESSION_START = "session_start"


class AlertSeverity(str, Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class DMNAlert(BaseModel):
    """DMN alert/notification"""
    id: Optional[str] = None
    student_id: str
    course_id: str
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    is_read: bool = False
    is_resolved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
