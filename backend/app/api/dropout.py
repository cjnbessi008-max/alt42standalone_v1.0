"""
Dropout Analysis API Endpoints
"""
from datetime import datetime, timedelta
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ..db.database import get_db
from ..models import (
    LearningSession, LearningEvent, ProblemAttempt,
    DropoutAnalysis, Student, Module, StudentLearningProfile,
    DropoutHotspot
)
from ..schemas import (
    DropoutAnalysisResponse, StudentPatternResponse,
    ModuleAnalyticsSummaryResponse, DashboardResponse,
    LearningEventCreate, ProblemAttemptCreate,
    LearningSessionCreate, LearningSessionUpdate,
    LearningSessionResponse, DashboardOverview,
    StudentAtRisk, DropoutMetrics, DropoutRecommendation,
    ContributingFactor, CommonDropoutReason,
    StudentLearningProfileResponse
)
from ..services.dropout_analyzer import DropoutAnalyzer, SessionData

router = APIRouter(prefix="/api/analytics/dropout", tags=["Dropout Analysis"])


@router.post("/sessions/{session_id}/analyze")
async def analyze_dropout_session(
    session_id: UUID,
    db: Session = Depends(get_db)
) -> DropoutAnalysisResponse:
    """
    특정 세션의 dropout 분석 수행
    """
    # 세션 조회
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # 이미 분석된 경우 캐시된 결과 반환
    existing_analysis = db.query(DropoutAnalysis).filter(
        DropoutAnalysis.session_id == session_id
    ).first()

    if existing_analysis:
        return _build_analysis_response(existing_analysis, session, db)

    # 세션 데이터 준비
    events = db.query(LearningEvent).filter(
        LearningEvent.session_id == session_id
    ).order_by(LearningEvent.timestamp).all()

    attempts = db.query(ProblemAttempt).filter(
        ProblemAttempt.session_id == session_id
    ).order_by(ProblemAttempt.attempted_at).all()

    # SessionData 구성
    session_data = SessionData(
        session_id=str(session.id),
        student_id=str(session.student_id),
        module_id=str(session.module_id),
        total_duration_seconds=session.total_duration_seconds or 0,
        active_duration_seconds=session.active_duration_seconds or 0,
        events=[{
            'event_type': e.event_type,
            'timestamp': e.timestamp,
            'event_data': e.event_data
        } for e in events],
        attempts=[{
            'problem_id': a.problem_id,
            'is_correct': a.is_correct,
            'time_spent_seconds': a.time_spent_seconds,
            'hints_used': a.hints_used
        } for a in attempts],
        dropout_point=session.dropout_point
    )

    # 분석 수행
    analyzer = DropoutAnalyzer()
    analysis_result = analyzer.analyze_session(session_data)

    # 결과 저장
    dropout_analysis = DropoutAnalysis(
        session_id=session.id,
        primary_reason=analysis_result['primary_reason'],
        contributing_factors=analysis_result['contributing_factors'],
        confidence_score=analysis_result['confidence'],
        recommendations=analysis_result['recommendations'],
        metrics=analysis_result['metrics']
    )
    db.add(dropout_analysis)

    # Hotspot 업데이트
    if session.dropout_point:
        _update_hotspot(db, session.module_id, session.dropout_point, analysis_result['primary_reason'])

    db.commit()
    db.refresh(dropout_analysis)

    return _build_analysis_response(dropout_analysis, session, db)


@router.get("/sessions/{session_id}")
async def get_dropout_analysis(
    session_id: UUID,
    db: Session = Depends(get_db)
) -> DropoutAnalysisResponse:
    """
    세션의 dropout 분석 결과 조회
    """
    session = db.query(LearningSession).filter(LearningSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    analysis = db.query(DropoutAnalysis).filter(
        DropoutAnalysis.session_id == session_id
    ).first()

    if not analysis:
        # 분석이 없으면 자동으로 수행
        return await analyze_dropout_session(session_id, db)

    return _build_analysis_response(analysis, session, db)


@router.get("/students/{student_id}/pattern")
async def get_student_dropout_pattern(
    student_id: UUID,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
) -> StudentPatternResponse:
    """
    학생의 dropout 패턴 분석
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 학습 프로필
    profile = db.query(StudentLearningProfile).filter(
        StudentLearningProfile.student_id == student_id
    ).first()

    if not profile:
        # 프로필이 없으면 기본값 생성
        profile = StudentLearningProfile(student_id=student_id)

    # 최근 dropout 세션들
    recent_dropouts = db.query(LearningSession, DropoutAnalysis).join(
        DropoutAnalysis, LearningSession.id == DropoutAnalysis.session_id
    ).filter(
        LearningSession.student_id == student_id,
        LearningSession.is_completed == False
    ).order_by(
        LearningSession.started_at.desc()
    ).limit(limit).all()

    # Common reasons 계산
    reason_counts = {}
    for _, analysis in recent_dropouts:
        reason = analysis.primary_reason
        reason_counts[reason] = reason_counts.get(reason, 0) + 1

    common_reasons = [
        CommonDropoutReason(reason=reason, frequency=count)
        for reason, count in sorted(reason_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # 권장사항 생성
    recommendations = _generate_student_recommendations(profile, common_reasons)

    # 최근 dropout 분석 결과
    recent_dropout_analyses = []
    for session, analysis in recent_dropouts:
        recent_dropout_analyses.append(
            _build_analysis_response(analysis, session, db)
        )

    dropout_rate = profile.dropout_frequency or 0.0

    return StudentPatternResponse(
        student_id=student_id,
        student_name=student.name,
        total_sessions=profile.total_sessions,
        dropout_sessions=profile.dropout_sessions,
        dropout_rate=round(dropout_rate, 2),
        common_reasons=common_reasons,
        learning_profile=StudentLearningProfileResponse(
            student_id=student_id,
            total_sessions=profile.total_sessions,
            dropout_sessions=profile.dropout_sessions,
            dropout_rate=round(dropout_rate, 2),
            common_reasons=common_reasons,
            avg_session_duration_minutes=profile.avg_session_duration_minutes,
            preferred_time=profile.preferred_time_of_day,
            engagement_trend=profile.engagement_trend,
            last_session_at=profile.last_session_at
        ),
        recent_dropouts=recent_dropout_analyses,
        recommendations=recommendations
    )


@router.get("/modules/{module_id}/summary")
async def get_module_dropout_summary(
    module_id: UUID,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
) -> ModuleAnalyticsSummaryResponse:
    """
    모듈의 dropout 요약 분석
    """
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    since_date = datetime.utcnow() - timedelta(days=days)

    # 세션 통계
    sessions = db.query(LearningSession).filter(
        LearningSession.module_id == module_id,
        LearningSession.started_at >= since_date
    ).all()

    total_sessions = len(sessions)
    dropout_sessions = sum(1 for s in sessions if not s.is_completed and s.ended_at is not None)
    dropout_rate = dropout_sessions / total_sessions if total_sessions > 0 else 0.0

    # 평균 세션 시간
    durations = [s.total_duration_seconds for s in sessions if s.total_duration_seconds]
    avg_duration = sum(durations) / len(durations) / 60 if durations else 0.0

    # Hotspots
    hotspots = db.query(DropoutHotspot).filter(
        DropoutHotspot.module_id == module_id
    ).order_by(
        DropoutHotspot.severity_score.desc()
    ).limit(10).all()

    hotspot_list = [
        {
            'location': h.location_identifier,
            'location_type': h.location_type,
            'dropout_count': h.dropout_count,
            'common_reason': h.common_reason,
            'severity_score': h.severity_score,
            'avg_time_before_dropout_seconds': h.avg_time_before_dropout_seconds
        }
        for h in hotspots
    ]

    # 권장사항
    recommendations = _generate_module_recommendations(dropout_rate, hotspot_list)

    return ModuleAnalyticsSummaryResponse(
        module_id=module_id,
        module_name=module.name,
        total_sessions=total_sessions,
        dropout_sessions=dropout_sessions,
        dropout_rate=round(dropout_rate, 2),
        avg_session_duration_minutes=round(avg_duration, 1),
        dropout_hotspots=hotspot_list,
        recommendations=recommendations
    )


@router.get("/dashboard")
async def get_dropout_dashboard(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
) -> DashboardResponse:
    """
    Dropout 분석 대시보드 데이터
    """
    since_date = datetime.utcnow() - timedelta(days=days)

    # Overview
    sessions = db.query(LearningSession).filter(
        LearningSession.started_at >= since_date
    ).all()

    total_sessions = len(sessions)
    dropout_count = sum(1 for s in sessions if not s.is_completed and s.ended_at is not None)
    dropout_rate = dropout_count / total_sessions if total_sessions > 0 else 0.0

    durations = [s.total_duration_seconds for s in sessions if s.total_duration_seconds]
    avg_duration = sum(durations) / len(durations) / 60 if durations else 0.0

    overview = DashboardOverview(
        total_sessions=total_sessions,
        dropout_count=dropout_count,
        dropout_rate=round(dropout_rate, 2),
        avg_session_duration=round(avg_duration, 1),
        period=f"Last {days} days"
    )

    # Top hotspots across all modules
    hotspots = db.query(DropoutHotspot).order_by(
        DropoutHotspot.severity_score.desc()
    ).limit(5).all()

    hotspot_list = [
        {
            'location': h.location_identifier,
            'location_type': h.location_type,
            'dropout_count': h.dropout_count,
            'common_reason': h.common_reason,
            'severity_score': h.severity_score,
            'avg_time_before_dropout_seconds': h.avg_time_before_dropout_seconds
        }
        for h in hotspots
    ]

    # Students at risk
    profiles = db.query(StudentLearningProfile, Student).join(
        Student, StudentLearningProfile.student_id == Student.id
    ).filter(
        StudentLearningProfile.dropout_frequency > 0.3
    ).order_by(
        StudentLearningProfile.dropout_frequency.desc()
    ).limit(10).all()

    students_at_risk = []
    for profile, student in profiles:
        # 최근 dropout 수
        recent_dropouts = db.query(LearningSession).filter(
            LearningSession.student_id == student.id,
            LearningSession.is_completed == False,
            LearningSession.ended_at.isnot(None),
            LearningSession.started_at >= datetime.utcnow() - timedelta(days=7)
        ).count()

        students_at_risk.append(StudentAtRisk(
            student_id=student.id,
            student_name=student.name,
            recent_dropout_count=recent_dropouts,
            dropout_rate=round(profile.dropout_frequency, 2),
            primary_concern=profile.engagement_trend or "unknown"
        ))

    # Trend data (daily)
    trend = []
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=days - i)
        date_sessions = [s for s in sessions if s.started_at.date() == date.date()]
        if date_sessions:
            date_dropouts = sum(1 for s in date_sessions if not s.is_completed and s.ended_at)
            trend.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': date_dropouts,
                'rate': round(date_dropouts / len(date_sessions), 2) if date_sessions else 0.0
            })

    return DashboardResponse(
        overview=overview,
        hotspots=hotspot_list,
        students_at_risk=students_at_risk,
        dropout_trend=trend
    )


# Helper functions

def _build_analysis_response(
    analysis: DropoutAnalysis,
    session: LearningSession,
    db: Session
) -> DropoutAnalysisResponse:
    """분석 결과를 response 모델로 변환"""
    metrics_data = analysis.metrics or {}
    recommendations_data = analysis.recommendations or {}

    return DropoutAnalysisResponse(
        id=analysis.id,
        session_id=analysis.session_id,
        student_id=session.student_id,
        module_id=session.module_id,
        dropout_point=session.dropout_point,
        primary_reason=analysis.primary_reason,
        confidence=analysis.confidence_score,
        contributing_factors=[
            ContributingFactor(**f) for f in (analysis.contributing_factors or [])
        ],
        recommendations=DropoutRecommendation(
            ko=recommendations_data.get('ko', ''),
            en=recommendations_data.get('en', ''),
            actions=recommendations_data.get('actions', [])
        ),
        metrics=DropoutMetrics(**metrics_data),
        analyzed_at=analysis.analyzed_at
    )


def _update_hotspot(db: Session, module_id: UUID, location: str, reason: str):
    """Hotspot 정보 업데이트"""
    hotspot = db.query(DropoutHotspot).filter(
        DropoutHotspot.module_id == module_id,
        DropoutHotspot.location_identifier == location
    ).first()

    if hotspot:
        hotspot.dropout_count += 1
        hotspot.common_reason = reason
        hotspot.last_occurred_at = datetime.utcnow()
        # 심각도는 count 기반으로 계산 (최대 1.0)
        hotspot.severity_score = min(1.0, hotspot.dropout_count / 20)
    else:
        hotspot = DropoutHotspot(
            module_id=module_id,
            location_identifier=location,
            location_type='problem',
            dropout_count=1,
            common_reason=reason,
            severity_score=0.05,
            last_occurred_at=datetime.utcnow()
        )
        db.add(hotspot)


def _generate_student_recommendations(
    profile: StudentLearningProfile,
    common_reasons: List[CommonDropoutReason]
) -> List[str]:
    """학생을 위한 권장사항 생성"""
    recommendations = []

    if profile.dropout_frequency and profile.dropout_frequency > 0.4:
        recommendations.append("이 학생은 높은 중단율을 보이고 있습니다. 개별적인 관심과 지원이 필요합니다.")

    if common_reasons:
        top_reason = common_reasons[0].reason
        if top_reason == 'high_error_rate':
            recommendations.append("난이도를 낮추고, 기초 개념 복습이 필요합니다.")
        elif top_reason == 'session_fatigue':
            recommendations.append("짧은 학습 세션과 자주 휴식을 권장합니다.")

    if profile.engagement_trend == 'decreasing':
        recommendations.append("참여도가 감소하고 있습니다. 학습 동기부여 전략이 필요합니다.")

    if not recommendations:
        recommendations.append("지속적인 모니터링이 필요합니다.")

    return recommendations


def _generate_module_recommendations(
    dropout_rate: float,
    hotspots: List[Dict]
) -> List[str]:
    """모듈을 위한 권장사항 생성"""
    recommendations = []

    if dropout_rate > 0.3:
        recommendations.append(f"높은 중단율({dropout_rate:.0%})을 보이고 있습니다. 전반적인 난이도와 콘텐츠 검토가 필요합니다.")

    if hotspots:
        top_hotspot = hotspots[0]
        recommendations.append(
            f"'{top_hotspot['location']}'에서 가장 많은 중단이 발생합니다. "
            f"이 지점의 난이도나 설명을 개선해보세요."
        )

    if not recommendations:
        recommendations.append("현재 모듈은 잘 운영되고 있습니다. 계속 모니터링하세요.")

    return recommendations
