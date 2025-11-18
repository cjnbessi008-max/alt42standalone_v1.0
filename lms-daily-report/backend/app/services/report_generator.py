from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta, date
from typing import Dict, Any, List

from ..models import Incident, DailyReport, Student, Course, IncidentType, IncidentSeverity


class ReportGenerator:
    """일일 리포트 생성기"""

    def __init__(self, db: Session):
        self.db = db

    def generate_report(self, report_date: date) -> DailyReport:
        """
        지정된 날짜의 일일 리포트 생성
        """
        # 날짜 범위 설정
        start_of_day = datetime.combine(report_date, datetime.min.time())
        end_of_day = datetime.combine(report_date, datetime.max.time())

        # 기존 리포트 확인
        existing_report = self.db.query(DailyReport).filter(
            and_(
                DailyReport.report_date >= start_of_day,
                DailyReport.report_date <= end_of_day
            )
        ).first()

        if existing_report:
            # 기존 리포트 업데이트
            self._update_report(existing_report, start_of_day, end_of_day)
            return existing_report
        else:
            # 새 리포트 생성
            return self._create_new_report(start_of_day, end_of_day)

    def _create_new_report(self, start_time: datetime, end_time: datetime) -> DailyReport:
        """새 리포트 생성"""
        # 통계 수집
        stats = self._collect_statistics(start_time, end_time)

        # 리포트 생성
        report = DailyReport(
            report_date=start_time,
            incidents_count=stats['total_incidents'],
            total_students=stats['total_students'],
            active_students=stats['active_students'],
            total_activities=stats['total_activities'],
            error_count=stats['error_count'],
            summary=stats['summary'],
            details=stats['details']
        )

        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)

        return report

    def _update_report(self, report: DailyReport, start_time: datetime, end_time: datetime):
        """기존 리포트 업데이트"""
        stats = self._collect_statistics(start_time, end_time)

        report.incidents_count = stats['total_incidents']
        report.total_students = stats['total_students']
        report.active_students = stats['active_students']
        report.total_activities = stats['total_activities']
        report.error_count = stats['error_count']
        report.summary = stats['summary']
        report.details = stats['details']
        report.generated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(report)

    def _collect_statistics(self, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
        """통계 데이터 수집"""
        # 해당 기간의 모든 사고 조회
        incidents = self.db.query(Incident).filter(
            and_(
                Incident.created_at >= start_time,
                Incident.created_at <= end_time
            )
        ).all()

        total_incidents = len(incidents)

        # 타입별 통계
        by_type = {}
        for incident_type in IncidentType:
            count = sum(1 for i in incidents if i.type == incident_type)
            by_type[incident_type.value] = count

        # 심각도별 통계
        by_severity = {}
        for severity in IncidentSeverity:
            count = sum(1 for i in incidents if i.severity == severity)
            by_severity[severity.value] = count

        # 오류 개수
        error_count = sum(
            1 for i in incidents
            if i.severity in [IncidentSeverity.ERROR, IncidentSeverity.CRITICAL]
        )

        # 활성 학생 수 (사고 발생한 학생)
        active_student_ids = set(i.student_id for i in incidents if i.student_id is not None)
        active_students = len(active_student_ids)

        # 전체 학생 수
        total_students = self.db.query(Student).count()

        # 학습 활동 수
        total_activities = sum(
            1 for i in incidents
            if i.type in [
                IncidentType.LEARNING_ACTIVITY,
                IncidentType.ASSESSMENT,
                IncidentType.SUBMISSION
            ]
        )

        # 상위 활동 학생
        top_students = self._get_top_active_students(incidents)

        # 과정별 통계
        course_stats = self._get_course_statistics(incidents)

        # 시간대별 통계
        hourly_stats = self._get_hourly_statistics(incidents)

        # 주요 오류
        error_incidents = [
            i for i in incidents
            if i.severity in [IncidentSeverity.ERROR, IncidentSeverity.CRITICAL]
        ]

        error_summary = [
            {
                "id": err.id,
                "type": err.type.value,
                "severity": err.severity.value,
                "title": err.title,
                "created_at": err.created_at.isoformat()
            }
            for err in error_incidents[:10]  # 상위 10개
        ]

        return {
            'total_incidents': total_incidents,
            'total_students': total_students,
            'active_students': active_students,
            'total_activities': total_activities,
            'error_count': error_count,
            'summary': {
                'by_type': by_type,
                'by_severity': by_severity,
                'engagement_rate': round(active_students / total_students * 100, 2) if total_students > 0 else 0
            },
            'details': {
                'top_students': top_students,
                'course_stats': course_stats,
                'hourly_stats': hourly_stats,
                'error_summary': error_summary
            }
        }

    def _get_top_active_students(self, incidents: List[Incident], limit: int = 10) -> List[Dict]:
        """가장 활동이 많은 학생 목록"""
        student_activity = {}

        for incident in incidents:
            if incident.student_id:
                if incident.student_id not in student_activity:
                    student_activity[incident.student_id] = {
                        'student_id': incident.student_id,
                        'count': 0
                    }
                student_activity[incident.student_id]['count'] += 1

        # 학생 정보 추가
        for student_id, data in student_activity.items():
            student = self.db.query(Student).filter(Student.id == student_id).first()
            if student:
                data['name'] = student.name
                data['email'] = student.email

        # 정렬
        sorted_students = sorted(
            student_activity.values(),
            key=lambda x: x['count'],
            reverse=True
        )

        return sorted_students[:limit]

    def _get_course_statistics(self, incidents: List[Incident]) -> List[Dict]:
        """과정별 통계"""
        course_activity = {}

        for incident in incidents:
            if incident.course_id:
                if incident.course_id not in course_activity:
                    course_activity[incident.course_id] = {
                        'course_id': incident.course_id,
                        'total_incidents': 0,
                        'by_type': {}
                    }
                course_activity[incident.course_id]['total_incidents'] += 1

                # 타입별 카운트
                incident_type = incident.type.value
                if incident_type not in course_activity[incident.course_id]['by_type']:
                    course_activity[incident.course_id]['by_type'][incident_type] = 0
                course_activity[incident.course_id]['by_type'][incident_type] += 1

        # 과정 정보 추가
        for course_id, data in course_activity.items():
            course = self.db.query(Course).filter(Course.id == course_id).first()
            if course:
                data['name'] = course.name
                data['code'] = course.code

        return list(course_activity.values())

    def _get_hourly_statistics(self, incidents: List[Incident]) -> Dict[int, int]:
        """시간대별 통계 (0-23시)"""
        hourly = {hour: 0 for hour in range(24)}

        for incident in incidents:
            hour = incident.created_at.hour
            hourly[hour] += 1

        return hourly
