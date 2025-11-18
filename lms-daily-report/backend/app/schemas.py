from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, Dict, Any, List
from .models import IncidentType, IncidentSeverity


# Student Schemas
class StudentBase(BaseModel):
    name: str
    email: EmailStr
    student_id: str


class StudentCreate(StudentBase):
    pass


class Student(StudentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Course Schemas
class CourseBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class Course(CourseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Incident Schemas
class IncidentBase(BaseModel):
    type: IncidentType
    severity: IncidentSeverity = IncidentSeverity.INFO
    title: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    student_id: Optional[int] = None
    course_id: Optional[int] = None


class IncidentCreate(IncidentBase):
    pass


class Incident(IncidentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Daily Report Schemas
class DailyReportBase(BaseModel):
    report_date: datetime
    summary: Optional[Dict[str, Any]] = None
    incidents_count: int = 0
    total_students: int = 0
    active_students: int = 0
    total_activities: int = 0
    error_count: int = 0
    details: Optional[Dict[str, Any]] = None


class DailyReportCreate(DailyReportBase):
    pass


class DailyReport(DailyReportBase):
    id: int
    generated_at: datetime

    class Config:
        from_attributes = True


# Statistics Schemas
class IncidentStats(BaseModel):
    """사고 통계"""
    total: int
    by_type: Dict[str, int]
    by_severity: Dict[str, int]


class DailyReportStats(BaseModel):
    """일일 리포트 통계"""
    date: datetime
    total_students: int
    active_students: int
    total_incidents: int
    incident_stats: IncidentStats
    top_activities: List[Dict[str, Any]]
    error_summary: List[Dict[str, Any]]


# Query Parameters
class IncidentFilter(BaseModel):
    """사고 필터링 파라미터"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    incident_type: Optional[IncidentType] = None
    severity: Optional[IncidentSeverity] = None
    student_id: Optional[int] = None
    course_id: Optional[int] = None
    limit: int = Field(default=100, le=1000)
    offset: int = Field(default=0, ge=0)
