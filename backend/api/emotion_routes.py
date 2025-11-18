"""
Emotion Detection API Routes
FastAPI endpoints for emotion analysis and color mode management
"""

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime
import asyncio
import json

from backend.models.emotion import (
    BehaviorMetrics,
    EmotionType,
    ColorMode,
    DetectionSensitivity,
    TriggerReason,
    StudentColorPreferences
)
from backend.services.emotion_detector import get_emotion_detector


# ============================================================================
# Pydantic Request/Response Models
# ============================================================================

class AnalyzeEmotionRequest(BaseModel):
    """Request body for emotion analysis"""
    student_id: int = Field(..., description="Student ID")
    session_id: str = Field(..., description="Session identifier")
    behavior_metrics: Dict = Field(..., description="Behavioral metrics dictionary")
    current_mode: str = Field(default="neutral", description="Current color mode")
    sensitivity: str = Field(default="medium", description="Detection sensitivity")

    class Config:
        schema_extra = {
            "example": {
                "student_id": 12345,
                "session_id": "sess_abc123",
                "behavior_metrics": {
                    "avg_click_interval": 2.8,
                    "error_rate": 0.25,
                    "task_completion_rate": 0.70,
                    "idle_time_seconds": 120,
                    "retry_count": 4,
                    "session_duration_minutes": 15
                },
                "current_mode": "neutral",
                "sensitivity": "medium"
            }
        }


class AnalyzeEmotionResponse(BaseModel):
    """Response for emotion analysis"""
    student_id: int
    session_id: str
    detected_emotion: str
    confidence: float
    recommended_mode: str
    should_switch: bool
    reason: str
    all_scores: Dict[str, float]
    processing_time_ms: int
    current_mode: str

    class Config:
        schema_extra = {
            "example": {
                "student_id": 12345,
                "session_id": "sess_abc123",
                "detected_emotion": "stressed",
                "confidence": 0.87,
                "recommended_mode": "calming",
                "should_switch": True,
                "reason": "Stress detected: high error rate, multiple retry attempts",
                "all_scores": {
                    "stressed": 0.87,
                    "calm": 0.32,
                    "engaged": 0.25,
                    "tired": 0.18
                },
                "processing_time_ms": 12,
                "current_mode": "neutral"
            }
        }


class CurrentEmotionResponse(BaseModel):
    """Response for current emotional state"""
    student_id: int
    session_id: str
    current_emotion: Optional[str]
    current_mode: str
    last_updated: Optional[str]
    auto_mode_enabled: bool

    class Config:
        schema_extra = {
            "example": {
                "student_id": 12345,
                "session_id": "sess_abc123",
                "current_emotion": "stressed",
                "current_mode": "calming",
                "last_updated": "2025-11-18T10:23:45Z",
                "auto_mode_enabled": True
            }
        }


class UpdatePreferencesRequest(BaseModel):
    """Request body for updating student preferences"""
    auto_mode_enabled: Optional[bool] = None
    preferred_default_mode: Optional[str] = None
    emotion_detection_sensitivity: Optional[str] = None
    disabled_modes: Optional[List[str]] = None
    allow_data_collection: Optional[bool] = None

    class Config:
        schema_extra = {
            "example": {
                "auto_mode_enabled": False,
                "preferred_default_mode": "calming",
                "emotion_detection_sensitivity": "low",
                "disabled_modes": ["energetic"]
            }
        }


class UpdatePreferencesResponse(BaseModel):
    """Response for preference update"""
    success: bool
    message: str
    preferences: Dict

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "message": "Preferences updated successfully",
                "preferences": {
                    "student_id": 12345,
                    "auto_mode_enabled": False,
                    "preferred_default_mode": "calming",
                    "emotion_detection_sensitivity": "low",
                    "disabled_modes": ["energetic"]
                }
            }
        }


class BehaviorEventRequest(BaseModel):
    """Request body for logging behavior events"""
    student_id: int
    session_id: str
    events: List[Dict]

    class Config:
        schema_extra = {
            "example": {
                "student_id": 12345,
                "session_id": "sess_abc123",
                "events": [
                    {
                        "event_type": "click",
                        "element_id": "submit_button",
                        "timestamp": "2025-11-18T10:23:45Z",
                        "time_since_last_event": 2.5
                    },
                    {
                        "event_type": "error",
                        "element_id": "answer_input",
                        "timestamp": "2025-11-18T10:23:50Z",
                        "is_error": True,
                        "retry_number": 1
                    }
                ]
            }
        }


# ============================================================================
# API Router
# ============================================================================

router = APIRouter(prefix="/api/v1/emotion", tags=["Emotion Detection"])

# In-memory storage for demo (replace with actual database in production)
emotion_states: Dict[str, Dict] = {}
student_preferences: Dict[int, StudentColorPreferences] = {}
websocket_connections: Dict[str, List[WebSocket]] = {}


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/analyze", response_model=AnalyzeEmotionResponse)
async def analyze_emotion(request: AnalyzeEmotionRequest):
    """
    Analyze student emotional state from behavioral metrics.

    Performs emotion detection and returns recommended color mode.
    """
    try:
        # Parse behavioral metrics
        metrics = BehaviorMetrics.from_dict(request.behavior_metrics)

        # Get detector service
        detector = get_emotion_detector()

        # Get student preferences
        sensitivity = DetectionSensitivity(request.sensitivity)
        preferences = student_preferences.get(request.student_id)

        # Perform emotion detection
        detection_result = detector.classify_emotion(metrics, sensitivity)

        # Recommend color mode
        current_mode = ColorMode(request.current_mode)
        recommended_mode, should_switch, reason = detector.recommend_color_mode(
            detection_result,
            current_mode,
            preferences
        )

        # Update in-memory state
        state_key = f"{request.student_id}:{request.session_id}"
        emotion_states[state_key] = {
            "student_id": request.student_id,
            "session_id": request.session_id,
            "detected_emotion": detection_result.detected_emotion.value,
            "confidence": detection_result.confidence,
            "color_mode": recommended_mode.value,
            "last_updated": datetime.now().isoformat(),
            "auto_mode_enabled": preferences.auto_mode_enabled if preferences else True
        }

        # Broadcast to WebSocket clients if mode should switch
        if should_switch:
            await broadcast_color_mode_change(
                request.student_id,
                request.session_id,
                current_mode.value,
                recommended_mode.value,
                detection_result.detected_emotion.value,
                reason
            )

        # Build response
        response = AnalyzeEmotionResponse(
            student_id=request.student_id,
            session_id=request.session_id,
            detected_emotion=detection_result.detected_emotion.value,
            confidence=detection_result.confidence,
            recommended_mode=recommended_mode.value,
            should_switch=should_switch,
            reason=reason,
            all_scores=detection_result.all_scores,
            processing_time_ms=detection_result.processing_time_ms,
            current_mode=request.current_mode
        )

        return response

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/student/{student_id}/current", response_model=CurrentEmotionResponse)
async def get_current_emotion(student_id: int, session_id: str):
    """
    Get current emotional state for a student session.
    """
    state_key = f"{student_id}:{session_id}"

    if state_key not in emotion_states:
        # Return default state
        return CurrentEmotionResponse(
            student_id=student_id,
            session_id=session_id,
            current_emotion=None,
            current_mode="neutral",
            last_updated=None,
            auto_mode_enabled=True
        )

    state = emotion_states[state_key]

    return CurrentEmotionResponse(
        student_id=state["student_id"],
        session_id=state["session_id"],
        current_emotion=state.get("detected_emotion"),
        current_mode=state.get("color_mode", "neutral"),
        last_updated=state.get("last_updated"),
        auto_mode_enabled=state.get("auto_mode_enabled", True)
    )


@router.post("/student/{student_id}/preferences", response_model=UpdatePreferencesResponse)
async def update_student_preferences(student_id: int, request: UpdatePreferencesRequest):
    """
    Update student color mode preferences.
    """
    try:
        # Get existing preferences or create new
        if student_id in student_preferences:
            preferences = student_preferences[student_id]
        else:
            preferences = StudentColorPreferences(student_id=student_id)

        # Update fields if provided
        if request.auto_mode_enabled is not None:
            preferences.auto_mode_enabled = request.auto_mode_enabled

        if request.preferred_default_mode is not None:
            preferences.preferred_default_mode = ColorMode(request.preferred_default_mode)

        if request.emotion_detection_sensitivity is not None:
            preferences.emotion_detection_sensitivity = DetectionSensitivity(request.emotion_detection_sensitivity)

        if request.disabled_modes is not None:
            preferences.disabled_modes = [ColorMode(mode) for mode in request.disabled_modes]

        if request.allow_data_collection is not None:
            preferences.allow_data_collection = request.allow_data_collection

        preferences.updated_at = datetime.now()

        # Store preferences
        student_preferences[student_id] = preferences

        return UpdatePreferencesResponse(
            success=True,
            message="Preferences updated successfully",
            preferences=preferences.to_dict()
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid preference value: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/student/{student_id}/preferences")
async def get_student_preferences(student_id: int):
    """
    Get student color mode preferences.
    """
    if student_id not in student_preferences:
        # Return default preferences
        default_prefs = StudentColorPreferences(student_id=student_id)
        return JSONResponse(content=default_prefs.to_dict())

    preferences = student_preferences[student_id]
    return JSONResponse(content=preferences.to_dict())


@router.post("/behavior/events")
async def log_behavior_events(request: BehaviorEventRequest):
    """
    Log behavioral events for emotion detection.

    This endpoint receives batched behavior events from the frontend.
    In production, these would be stored in the database and used for
    real-time emotion detection.
    """
    try:
        # In production, store events in database
        # For now, just acknowledge receipt
        return JSONResponse(
            content={
                "success": True,
                "message": f"Logged {len(request.events)} behavior events",
                "student_id": request.student_id,
                "session_id": request.session_id
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log events: {str(e)}")


# ============================================================================
# WebSocket Endpoints
# ============================================================================

@router.websocket("/ws/{student_id}/{session_id}")
async def websocket_endpoint(websocket: WebSocket, student_id: int, session_id: str):
    """
    WebSocket connection for real-time emotion detection updates.

    Clients connect to receive:
    - emotion_detected events
    - color_mode_change events
    """
    await websocket.accept()

    connection_key = f"{student_id}:{session_id}"

    # Add connection to tracking
    if connection_key not in websocket_connections:
        websocket_connections[connection_key] = []
    websocket_connections[connection_key].append(websocket)

    try:
        # Send initial state
        if connection_key in emotion_states:
            state = emotion_states[connection_key]
            await websocket.send_json({
                "event": "connected",
                "data": state
            })
        else:
            await websocket.send_json({
                "event": "connected",
                "data": {
                    "student_id": student_id,
                    "session_id": session_id,
                    "color_mode": "neutral",
                    "message": "Connected to emotion detection service"
                }
            })

        # Keep connection alive and listen for client messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            # Handle different message types
            if message.get("type") == "manual_mode_selected":
                mode = message.get("mode", "neutral")
                await handle_manual_mode_change(student_id, session_id, mode)

            elif message.get("type") == "auto_mode_toggled":
                enabled = message.get("enabled", True)
                await handle_auto_mode_toggle(student_id, session_id, enabled)

    except WebSocketDisconnect:
        # Remove connection
        websocket_connections[connection_key].remove(websocket)
        if not websocket_connections[connection_key]:
            del websocket_connections[connection_key]

    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass


async def broadcast_color_mode_change(
    student_id: int,
    session_id: str,
    previous_mode: str,
    new_mode: str,
    emotional_state: str,
    reason: str
):
    """
    Broadcast color mode change to all connected clients for this student/session.
    """
    connection_key = f"{student_id}:{session_id}"

    if connection_key not in websocket_connections:
        return

    message = {
        "event": "color_mode_change",
        "data": {
            "student_id": student_id,
            "session_id": session_id,
            "previous_mode": previous_mode,
            "new_mode": new_mode,
            "emotional_state": emotional_state,
            "reason": reason,
            "timestamp": datetime.now().isoformat(),
            "transition_duration_ms": 800
        }
    }

    # Send to all connected clients
    disconnected = []
    for websocket in websocket_connections[connection_key]:
        try:
            await websocket.send_json(message)
        except:
            disconnected.append(websocket)

    # Clean up disconnected clients
    for ws in disconnected:
        websocket_connections[connection_key].remove(ws)


async def handle_manual_mode_change(student_id: int, session_id: str, mode: str):
    """Handle manual color mode selection from student"""
    state_key = f"{student_id}:{session_id}"

    # Update state
    if state_key in emotion_states:
        emotion_states[state_key]["color_mode"] = mode
        emotion_states[state_key]["last_updated"] = datetime.now().isoformat()
    else:
        emotion_states[state_key] = {
            "student_id": student_id,
            "session_id": session_id,
            "color_mode": mode,
            "last_updated": datetime.now().isoformat(),
            "auto_mode_enabled": False
        }

    # Broadcast change
    await broadcast_color_mode_change(
        student_id,
        session_id,
        "auto",
        mode,
        "manual_override",
        "Student manually selected color mode"
    )


async def handle_auto_mode_toggle(student_id: int, session_id: str, enabled: bool):
    """Handle auto mode enable/disable"""
    state_key = f"{student_id}:{session_id}"

    if state_key in emotion_states:
        emotion_states[state_key]["auto_mode_enabled"] = enabled
        emotion_states[state_key]["last_updated"] = datetime.now().isoformat()

    # Update preferences
    if student_id in student_preferences:
        student_preferences[student_id].auto_mode_enabled = enabled
    else:
        preferences = StudentColorPreferences(student_id=student_id, auto_mode_enabled=enabled)
        student_preferences[student_id] = preferences


# ============================================================================
# Health Check
# ============================================================================

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    detector = get_emotion_detector()
    return {
        "status": "healthy",
        "service": "emotion_detection",
        "version": detector.algorithm_version,
        "timestamp": datetime.now().isoformat()
    }
