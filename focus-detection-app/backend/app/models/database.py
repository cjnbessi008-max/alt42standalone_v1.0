from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    student_name = Column(String, nullable=False, index=True)
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration = Column(Integer, nullable=True)  # seconds
    average_focus = Column(Float, default=0.0)
    status = Column(String, default="active")  # active, completed, paused

    # 관계
    focus_data_points = relationship("FocusDataPoint", back_populates="session", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "studentName": self.student_name,
            "startTime": self.start_time.isoformat() if self.start_time else None,
            "endTime": self.end_time.isoformat() if self.end_time else None,
            "duration": self.duration,
            "averageFocus": self.average_focus,
            "status": self.status,
            "focusDataPoints": [dp.to_dict() for dp in self.focus_data_points] if self.focus_data_points else [],
        }


class FocusDataPoint(Base):
    __tablename__ = "focus_data_points"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    score = Column(Float, nullable=False)
    face_detected = Column(Boolean, nullable=False)
    gaze_score = Column(Float, nullable=False)
    head_pose_score = Column(Float, nullable=False)
    movement_score = Column(Float, nullable=False)

    # JSON 필드로 상세 데이터 저장
    head_pose = Column(JSON, nullable=True)  # {pitch, yaw, roll}
    gaze_direction = Column(JSON, nullable=True)  # {x, y}

    # 관계
    session = relationship("Session", back_populates="focus_data_points")

    def to_dict(self):
        return {
            "timestamp": int(self.timestamp.timestamp() * 1000),  # milliseconds
            "score": self.score,
            "faceDetected": self.face_detected,
            "gazeScore": self.gaze_score,
            "headPoseScore": self.head_pose_score,
            "movementScore": self.movement_score,
            "headPose": self.head_pose,
            "gazeDirection": self.gaze_direction,
        }


class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, unique=True, index=True)
    total_session_count = Column(Integer, default=0)
    average_focus_score = Column(Float, default=0.0)
    last_session_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "totalSessionCount": self.total_session_count,
            "averageFocusScore": self.average_focus_score,
            "lastSessionDate": self.last_session_date.isoformat() if self.last_session_date else None,
        }
