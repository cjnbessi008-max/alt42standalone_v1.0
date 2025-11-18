"""
Emotion Detection Data Models
Defines data structures for emotional state tracking and color mode management
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Literal, Optional


class EmotionType(str, Enum):
    """Emotional states that can be detected"""
    CALM = "calm"
    STRESSED = "stressed"
    ENGAGED = "engaged"
    TIRED = "tired"


class ColorMode(str, Enum):
    """Available color modes for the UI"""
    NEUTRAL = "neutral"
    CALMING = "calming"
    ENERGETIC = "energetic"
    REFRESH = "refresh"


class TriggerReason(str, Enum):
    """Reasons for color mode changes"""
    AUTO_EMOTION_DETECTION = "auto_emotion_detection"
    USER_MANUAL = "user_manual"
    SESSION_START = "session_start"
    PREFERENCE_LOAD = "preference_load"
    ADMIN_OVERRIDE = "admin_override"


class DetectionSensitivity(str, Enum):
    """Sensitivity levels for emotion detection"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass
class BehaviorMetrics:
    """
    Behavioral metrics collected from user interactions.
    Used as input for emotion detection algorithm.
    """
    avg_click_interval: float  # seconds between clicks
    error_rate: float  # 0.0 to 1.0
    task_completion_rate: float  # 0.0 to 1.0
    idle_time_seconds: float  # total idle time
    retry_count: int  # number of retry attempts
    session_duration_minutes: float  # total session duration

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "avg_click_interval": self.avg_click_interval,
            "error_rate": self.error_rate,
            "task_completion_rate": self.task_completion_rate,
            "idle_time_seconds": self.idle_time_seconds,
            "retry_count": self.retry_count,
            "session_duration_minutes": self.session_duration_minutes
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'BehaviorMetrics':
        """Create instance from dictionary"""
        return cls(
            avg_click_interval=data.get("avg_click_interval", 5.0),
            error_rate=data.get("error_rate", 0.0),
            task_completion_rate=data.get("task_completion_rate", 0.0),
            idle_time_seconds=data.get("idle_time_seconds", 0.0),
            retry_count=data.get("retry_count", 0),
            session_duration_minutes=data.get("session_duration_minutes", 0.0)
        )


@dataclass
class EmotionDetectionResult:
    """
    Result of emotion detection analysis.
    Contains detected emotion, confidence, and recommendation.
    """
    detected_emotion: EmotionType
    confidence: float  # 0.0 to 1.0
    recommended_mode: ColorMode
    should_switch: bool
    reason: str
    all_scores: Dict[str, float] = field(default_factory=dict)
    processing_time_ms: Optional[int] = None
    algorithm_version: str = "1.0"

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "detected_emotion": self.detected_emotion.value,
            "confidence": self.confidence,
            "recommended_mode": self.recommended_mode.value,
            "should_switch": self.should_switch,
            "reason": self.reason,
            "all_scores": self.all_scores,
            "processing_time_ms": self.processing_time_ms,
            "algorithm_version": self.algorithm_version
        }


@dataclass
class EmotionalState:
    """
    Complete emotional state record for a student at a point in time.
    """
    id: Optional[int] = None
    student_id: int = 0
    session_id: str = ""
    timestamp: datetime = field(default_factory=datetime.now)
    detected_emotion: EmotionType = EmotionType.CALM
    confidence_score: float = 0.5
    color_mode_applied: ColorMode = ColorMode.NEUTRAL
    interaction_metrics: Dict = field(default_factory=dict)
    user_override: bool = False
    manual_mode_selected: Optional[ColorMode] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "student_id": self.student_id,
            "session_id": self.session_id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "detected_emotion": self.detected_emotion.value,
            "confidence_score": self.confidence_score,
            "color_mode_applied": self.color_mode_applied.value,
            "interaction_metrics": self.interaction_metrics,
            "user_override": self.user_override,
            "manual_mode_selected": self.manual_mode_selected.value if self.manual_mode_selected else None
        }


@dataclass
class ColorModeChange:
    """
    Record of a color mode change event.
    """
    id: Optional[int] = None
    student_id: int = 0
    session_id: str = ""
    previous_mode: Optional[ColorMode] = None
    new_mode: ColorMode = ColorMode.NEUTRAL
    change_timestamp: datetime = field(default_factory=datetime.now)
    trigger_reason: TriggerReason = TriggerReason.SESSION_START
    emotional_state_at_change: Optional[EmotionType] = None
    duration_in_mode: Optional[int] = None  # seconds
    interactions_during_mode: Optional[int] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "id": self.id,
            "student_id": self.student_id,
            "session_id": self.session_id,
            "previous_mode": self.previous_mode.value if self.previous_mode else None,
            "new_mode": self.new_mode.value,
            "change_timestamp": self.change_timestamp.isoformat() if self.change_timestamp else None,
            "trigger_reason": self.trigger_reason.value,
            "emotional_state_at_change": self.emotional_state_at_change.value if self.emotional_state_at_change else None,
            "duration_in_mode": self.duration_in_mode,
            "interactions_during_mode": self.interactions_during_mode
        }


@dataclass
class StudentColorPreferences:
    """
    Student preferences for emotion-based color mode system.
    """
    student_id: int
    auto_mode_enabled: bool = True
    preferred_default_mode: ColorMode = ColorMode.NEUTRAL
    emotion_detection_sensitivity: DetectionSensitivity = DetectionSensitivity.MEDIUM
    disabled_modes: List[ColorMode] = field(default_factory=list)
    allow_data_collection: bool = True
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "student_id": self.student_id,
            "auto_mode_enabled": self.auto_mode_enabled,
            "preferred_default_mode": self.preferred_default_mode.value,
            "emotion_detection_sensitivity": self.emotion_detection_sensitivity.value,
            "disabled_modes": [mode.value for mode in self.disabled_modes],
            "allow_data_collection": self.allow_data_collection,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

    @classmethod
    def from_dict(cls, data: Dict) -> 'StudentColorPreferences':
        """Create instance from dictionary"""
        return cls(
            student_id=data["student_id"],
            auto_mode_enabled=data.get("auto_mode_enabled", True),
            preferred_default_mode=ColorMode(data.get("preferred_default_mode", "neutral")),
            emotion_detection_sensitivity=DetectionSensitivity(data.get("emotion_detection_sensitivity", "medium")),
            disabled_modes=[ColorMode(mode) for mode in data.get("disabled_modes", [])],
            allow_data_collection=data.get("allow_data_collection", True)
        )


@dataclass
class BehaviorEvent:
    """
    Individual behavior event (click, error, etc.)
    """
    student_id: int
    session_id: str
    event_type: Literal["click", "scroll", "input", "submit", "error", "idle", "focus", "blur"]
    timestamp: datetime = field(default_factory=datetime.now)
    element_id: Optional[str] = None
    task_id: Optional[int] = None
    time_since_last_event: Optional[float] = None  # seconds
    time_on_element: Optional[float] = None
    is_error: bool = False
    retry_number: int = 0
    page_url: Optional[str] = None
    metadata: Dict = field(default_factory=dict)

    def to_dict(self) -> Dict:
        """Convert to dictionary for JSON serialization"""
        return {
            "student_id": self.student_id,
            "session_id": self.session_id,
            "event_type": self.event_type,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "element_id": self.element_id,
            "task_id": self.task_id,
            "time_since_last_event": self.time_since_last_event,
            "time_on_element": self.time_on_element,
            "is_error": self.is_error,
            "retry_number": self.retry_number,
            "page_url": self.page_url,
            "metadata": self.metadata
        }


# Emotion to Color Mode mapping
EMOTION_TO_COLOR_MODE: Dict[EmotionType, ColorMode] = {
    EmotionType.CALM: ColorMode.NEUTRAL,
    EmotionType.STRESSED: ColorMode.CALMING,
    EmotionType.ENGAGED: ColorMode.ENERGETIC,
    EmotionType.TIRED: ColorMode.REFRESH
}


# Sensitivity to confidence threshold mapping
SENSITIVITY_THRESHOLDS: Dict[DetectionSensitivity, float] = {
    DetectionSensitivity.LOW: 0.75,     # Only switch with very high confidence
    DetectionSensitivity.MEDIUM: 0.60,  # Default threshold
    DetectionSensitivity.HIGH: 0.45     # Switch more readily
}
