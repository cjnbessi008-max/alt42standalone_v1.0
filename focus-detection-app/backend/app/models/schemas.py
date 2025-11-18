from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class HeadPose(BaseModel):
    pitch: float
    yaw: float
    roll: float


class GazeDirection(BaseModel):
    x: float
    y: float


class FocusDataCreate(BaseModel):
    session_id: str = Field(..., alias="sessionId")
    timestamp: int
    score: float = Field(..., ge=0, le=100)
    face_detected: bool = Field(..., alias="faceDetected")
    gaze_score: float = Field(..., alias="gazeScore", ge=0, le=100)
    head_pose_score: float = Field(..., alias="headPoseScore", ge=0, le=100)
    movement_score: float = Field(..., alias="movementScore", ge=0, le=100)
    head_pose: Optional[HeadPose] = Field(None, alias="headPose")
    gaze_direction: Optional[GazeDirection] = Field(None, alias="gazeDirection")

    class Config:
        populate_by_name = True


class FocusDataBatchCreate(BaseModel):
    session_id: str = Field(..., alias="sessionId")
    focus_data_list: List[FocusDataCreate] = Field(..., alias="focusDataList")

    class Config:
        populate_by_name = True


class SessionCreate(BaseModel):
    student_name: str = Field(..., alias="studentName", min_length=1)

    class Config:
        populate_by_name = True


class SessionResponse(BaseModel):
    id: str
    student_name: str = Field(..., alias="studentName")
    start_time: datetime = Field(..., alias="startTime")
    end_time: Optional[datetime] = Field(None, alias="endTime")
    duration: Optional[int] = None
    average_focus: float = Field(..., alias="averageFocus")
    status: str

    class Config:
        populate_by_name = True
        from_attributes = True


class ApiResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
    message: Optional[str] = None


class SessionStats(BaseModel):
    total_duration: int = Field(..., alias="totalDuration")
    average_focus: float = Field(..., alias="averageFocus")
    high_focus_time: int = Field(..., alias="highFocusTime")
    medium_focus_time: int = Field(..., alias="mediumFocusTime")
    low_focus_time: int = Field(..., alias="lowFocusTime")
    distraction_count: int = Field(..., alias="distractionCount")

    class Config:
        populate_by_name = True
