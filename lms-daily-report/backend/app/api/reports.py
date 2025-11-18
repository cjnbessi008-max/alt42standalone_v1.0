from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta, date

from ..database import get_db
from ..models import DailyReport, Incident, Student, IncidentType, IncidentSeverity
from ..schemas import DailyReport as DailyReportSchema
from ..services.report_generator import ReportGenerator

router = APIRouter()


@router.post("/reports/generate", tags=["Reports"])
def generate_daily_report(
    report_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    일일 리포트 생성
    report_date가 없으면 어제 날짜로 생성
    """
    if report_date is None:
        report_date = date.today() - timedelta(days=1)

    generator = ReportGenerator(db)
    report = generator.generate_report(report_date)

    return {
        "message": "Daily report generated successfully",
        "report_id": report.id,
        "report_date": report.report_date,
        "incidents_count": report.incidents_count
    }


@router.get("/reports", response_model=List[DailyReportSchema], tags=["Reports"])
def list_reports(
    skip: int = 0,
    limit: int = Query(default=30, le=365),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """리포트 목록 조회"""
    query = db.query(DailyReport)

    if start_date:
        query = query.filter(DailyReport.report_date >= start_date)
    if end_date:
        query = query.filter(DailyReport.report_date <= end_date)

    reports = query.order_by(DailyReport.report_date.desc()).offset(skip).limit(limit).all()
    return reports


@router.get("/reports/{report_id}", response_model=DailyReportSchema, tags=["Reports"])
def get_report(report_id: int, db: Session = Depends(get_db)):
    """리포트 상세 조회"""
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/reports/by-date/{report_date}", response_model=DailyReportSchema, tags=["Reports"])
def get_report_by_date(report_date: date, db: Session = Depends(get_db)):
    """날짜로 리포트 조회"""
    start_of_day = datetime.combine(report_date, datetime.min.time())
    end_of_day = datetime.combine(report_date, datetime.max.time())

    report = db.query(DailyReport).filter(
        and_(
            DailyReport.report_date >= start_of_day,
            DailyReport.report_date <= end_of_day
        )
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found for this date")
    return report


@router.get("/reports/latest/summary", tags=["Reports"])
def get_latest_report_summary(db: Session = Depends(get_db)):
    """최신 리포트 요약"""
    report = db.query(DailyReport).order_by(DailyReport.report_date.desc()).first()

    if not report:
        return {
            "message": "No reports available",
            "report": None
        }

    return {
        "report_date": report.report_date,
        "total_students": report.total_students,
        "active_students": report.active_students,
        "total_activities": report.total_activities,
        "incidents_count": report.incidents_count,
        "error_count": report.error_count,
        "summary": report.summary
    }


@router.get("/dashboard/overview", tags=["Dashboard"])
def get_dashboard_overview(db: Session = Depends(get_db)):
    """대시보드 개요 데이터"""
    today = date.today()
    yesterday = today - timedelta(days=1)
    week_ago = today - timedelta(days=7)

    # 오늘의 통계
    today_start = datetime.combine(today, datetime.min.time())
    today_incidents = db.query(Incident).filter(Incident.created_at >= today_start).count()

    # 이번 주 통계
    week_start = datetime.combine(week_ago, datetime.min.time())
    week_incidents = db.query(Incident).filter(Incident.created_at >= week_start).count()

    # 활성 학생 수 (최근 7일 활동)
    active_students = db.query(func.count(func.distinct(Incident.student_id))).filter(
        Incident.created_at >= week_start,
        Incident.student_id.isnot(None)
    ).scalar()

    # 최근 오류 수
    error_count = db.query(Incident).filter(
        Incident.created_at >= week_start,
        Incident.severity.in_([IncidentSeverity.ERROR, IncidentSeverity.CRITICAL])
    ).count()

    # 최신 리포트
    latest_report = db.query(DailyReport).order_by(DailyReport.report_date.desc()).first()

    return {
        "today": {
            "incidents": today_incidents,
            "date": today
        },
        "this_week": {
            "incidents": week_incidents,
            "active_students": active_students,
            "errors": error_count
        },
        "latest_report": {
            "date": latest_report.report_date if latest_report else None,
            "incidents": latest_report.incidents_count if latest_report else 0
        }
    }


@router.get("/dashboard/trends", tags=["Dashboard"])
def get_dashboard_trends(days: int = Query(default=7, le=30), db: Session = Depends(get_db)):
    """대시보드 트렌드 데이터 (최근 N일)"""
    today = date.today()
    start_date = today - timedelta(days=days)

    reports = db.query(DailyReport).filter(
        DailyReport.report_date >= start_date
    ).order_by(DailyReport.report_date.asc()).all()

    trends = []
    for report in reports:
        trends.append({
            "date": report.report_date.strftime("%Y-%m-%d"),
            "incidents": report.incidents_count,
            "active_students": report.active_students,
            "errors": report.error_count
        })

    return {
        "period": {
            "start": start_date,
            "end": today,
            "days": days
        },
        "trends": trends
    }
