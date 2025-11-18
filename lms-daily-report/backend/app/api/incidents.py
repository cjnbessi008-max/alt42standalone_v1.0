from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Optional
from datetime import datetime, timedelta

from ..database import get_db
from ..models import Incident, Student, Course
from ..schemas import (
    IncidentCreate, Incident as IncidentSchema,
    StudentCreate, Student as StudentSchema,
    CourseCreate, Course as CourseSchema,
    IncidentType, IncidentSeverity
)

router = APIRouter()


# Student Endpoints
@router.post("/students", response_model=StudentSchema, tags=["Students"])
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """학생 생성"""
    db_student = Student(**student.model_dump())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


@router.get("/students", response_model=List[StudentSchema], tags=["Students"])
def list_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """학생 목록 조회"""
    students = db.query(Student).offset(skip).limit(limit).all()
    return students


@router.get("/students/{student_id}", response_model=StudentSchema, tags=["Students"])
def get_student(student_id: int, db: Session = Depends(get_db)):
    """학생 상세 조회"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


# Course Endpoints
@router.post("/courses", response_model=CourseSchema, tags=["Courses"])
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    """과정 생성"""
    db_course = Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


@router.get("/courses", response_model=List[CourseSchema], tags=["Courses"])
def list_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """과정 목록 조회"""
    courses = db.query(Course).offset(skip).limit(limit).all()
    return courses


# Incident Endpoints
@router.post("/incidents", response_model=IncidentSchema, tags=["Incidents"])
def create_incident(incident: IncidentCreate, db: Session = Depends(get_db)):
    """사고/이벤트 생성"""
    db_incident = Incident(**incident.model_dump())
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident


@router.get("/incidents", response_model=List[IncidentSchema], tags=["Incidents"])
def list_incidents(
    skip: int = 0,
    limit: int = Query(default=100, le=1000),
    incident_type: Optional[IncidentType] = None,
    severity: Optional[IncidentSeverity] = None,
    student_id: Optional[int] = None,
    course_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """사고/이벤트 목록 조회 (필터링 지원)"""
    query = db.query(Incident)

    # 필터 적용
    if incident_type:
        query = query.filter(Incident.type == incident_type)
    if severity:
        query = query.filter(Incident.severity == severity)
    if student_id:
        query = query.filter(Incident.student_id == student_id)
    if course_id:
        query = query.filter(Incident.course_id == course_id)
    if start_date:
        query = query.filter(Incident.created_at >= start_date)
    if end_date:
        query = query.filter(Incident.created_at <= end_date)

    incidents = query.order_by(Incident.created_at.desc()).offset(skip).limit(limit).all()
    return incidents


@router.get("/incidents/{incident_id}", response_model=IncidentSchema, tags=["Incidents"])
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    """사고/이벤트 상세 조회"""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.get("/incidents/stats/summary", tags=["Incidents"])
def get_incident_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """사고 통계 요약"""
    query = db.query(Incident)

    if start_date:
        query = query.filter(Incident.created_at >= start_date)
    if end_date:
        query = query.filter(Incident.created_at <= end_date)

    total = query.count()

    # 타입별 통계
    by_type = {}
    for incident_type in IncidentType:
        count = query.filter(Incident.type == incident_type).count()
        by_type[incident_type.value] = count

    # 심각도별 통계
    by_severity = {}
    for severity in IncidentSeverity:
        count = query.filter(Incident.severity == severity).count()
        by_severity[severity.value] = count

    return {
        "total": total,
        "by_type": by_type,
        "by_severity": by_severity,
        "period": {
            "start": start_date,
            "end": end_date
        }
    }


@router.post("/incidents/batch", tags=["Incidents"])
def create_incidents_batch(incidents: List[IncidentCreate], db: Session = Depends(get_db)):
    """여러 사고/이벤트 일괄 생성 (테스트 데이터 생성용)"""
    db_incidents = [Incident(**incident.model_dump()) for incident in incidents]
    db.add_all(db_incidents)
    db.commit()
    return {"created": len(db_incidents), "message": "Incidents created successfully"}
