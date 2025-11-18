from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from .database import Base


class IncidentType(str, enum.Enum):
    """사고 유형"""
    LEARNING_ACTIVITY = "learning_activity"  # 학습 활동
    ASSESSMENT = "assessment"  # 평가/퀴즈
    SYSTEM_ERROR = "system_error"  # 시스템 오류
    LOGIN = "login"  # 로그인/로그아웃
    CONTENT_ACCESS = "content_access"  # 콘텐츠 접근
    SUBMISSION = "submission"  # 과제 제출
    DISCUSSION = "discussion"  # 토론 참여


class IncidentSeverity(str, enum.Enum):
    """심각도"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class Student(Base):
    """학생 모델"""
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    student_id = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    incidents = relationship("Incident", back_populates="student")


class Course(Base):
    """과정 모델"""
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    incidents = relationship("Incident", back_populates="course")


class Incident(Base):
    """사고/이벤트 모델"""
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(IncidentType), nullable=False, index=True)
    severity = Column(Enum(IncidentSeverity), default=IncidentSeverity.INFO)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    metadata = Column(JSON)  # 추가 정보 (점수, 시간, 상세 데이터 등)

    student_id = Column(Integer, ForeignKey("students.id"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    student = relationship("Student", back_populates="incidents")
    course = relationship("Course", back_populates="incidents")


class DailyReport(Base):
    """일일 리포트 모델"""
    __tablename__ = "daily_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_date = Column(DateTime, nullable=False, index=True)
    summary = Column(JSON)  # 요약 통계
    incidents_count = Column(Integer, default=0)
    generated_at = Column(DateTime, default=datetime.utcnow)

    # 리포트 세부 내용
    total_students = Column(Integer, default=0)
    active_students = Column(Integer, default=0)
    total_activities = Column(Integer, default=0)
    error_count = Column(Integer, default=0)

    details = Column(JSON)  # 상세 분석 데이터
