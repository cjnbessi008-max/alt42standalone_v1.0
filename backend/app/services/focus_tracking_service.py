"""
Focus Tracking Service
Business logic for focus tracking and mental alignment routines
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from ..models.focus_tracking import (
    FocusSession, FocusBreak, MentalAlignmentRoutine,
    StudentFocusPreferences, MoodleIntegrationLog
)
from ..schemas.focus_tracking import (
    FocusSessionCreate, FocusSessionUpdate,
    FocusBreakCreate, FocusBreakUpdate,
    BreakReason, FocusAnalytics, SessionSummary
)


class FocusTrackingService:
    """집중도 추적 서비스"""

    def __init__(self, db: Session):
        self.db = db

    # Focus Session Methods
    def create_session(self, session_data: FocusSessionCreate) -> FocusSession:
        """새로운 집중 세션 생성"""
        session = FocusSession(
            student_id=session_data.student_id,
            module_id=session_data.module_id
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def update_session(self, session_id: int, update_data: FocusSessionUpdate) -> Optional[FocusSession]:
        """집중 세션 업데이트"""
        session = self.db.query(FocusSession).filter(FocusSession.id == session_id).first()
        if not session:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(session, key, value)

        # Calculate total duration and focus score if session ended
        if update_data.session_end:
            delta = update_data.session_end - session.session_start
            session.total_duration_seconds = int(delta.total_seconds())
            session.focus_score = session.calculate_focus_score()

        session.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(session)
        return session

    def end_session(self, session_id: int) -> Optional[FocusSession]:
        """집중 세션 종료"""
        session = self.db.query(FocusSession).filter(FocusSession.id == session_id).first()
        if not session or session.session_end:
            return None

        session.session_end = datetime.utcnow()
        delta = session.session_end - session.session_start
        session.total_duration_seconds = int(delta.total_seconds())
        session.focus_score = session.calculate_focus_score()
        session.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(session)
        return session

    def get_active_session(self, student_id: str, module_id: str) -> Optional[FocusSession]:
        """활성 세션 조회"""
        return self.db.query(FocusSession).filter(
            FocusSession.student_id == student_id,
            FocusSession.module_id == module_id,
            FocusSession.session_end.is_(None)
        ).first()

    def increment_interaction(self, session_id: int) -> Optional[FocusSession]:
        """상호작용 카운트 증가"""
        session = self.db.query(FocusSession).filter(FocusSession.id == session_id).first()
        if session:
            session.interaction_count += 1
            session.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(session)
        return session

    # Focus Break Methods
    def create_break(self, break_data: FocusBreakCreate) -> FocusBreak:
        """집중 중단 기록 생성"""
        focus_break = FocusBreak(
            session_id=break_data.session_id,
            student_id=break_data.student_id,
            break_reason=break_data.break_reason.value,
            idle_duration_seconds=break_data.idle_duration_seconds,
            routine_type=break_data.routine_type.value,
            notes=break_data.notes
        )
        self.db.add(focus_break)

        # Update session idle duration
        session = self.db.query(FocusSession).filter(FocusSession.id == break_data.session_id).first()
        if session and break_data.idle_duration_seconds:
            session.idle_duration_seconds += break_data.idle_duration_seconds
            session.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(focus_break)
        return focus_break

    def start_routine(self, break_id: int) -> Optional[FocusBreak]:
        """정신정렬 루틴 시작"""
        focus_break = self.db.query(FocusBreak).filter(FocusBreak.id == break_id).first()
        if focus_break:
            focus_break.routine_started_at = datetime.utcnow()

            # Increment routine usage count
            routine = self.db.query(MentalAlignmentRoutine).filter(
                MentalAlignmentRoutine.routine_type == focus_break.routine_type
            ).first()
            if routine:
                routine.increment_usage()

            self.db.commit()
            self.db.refresh(focus_break)
        return focus_break

    def complete_routine(self, break_id: int, effectiveness_rating: Optional[int] = None) -> Optional[FocusBreak]:
        """정신정렬 루틴 완료"""
        focus_break = self.db.query(FocusBreak).filter(FocusBreak.id == break_id).first()
        if focus_break:
            focus_break.routine_completed_at = datetime.utcnow()
            focus_break.effectiveness_rating = effectiveness_rating

            # Update routine average effectiveness
            if effectiveness_rating:
                routine = self.db.query(MentalAlignmentRoutine).filter(
                    MentalAlignmentRoutine.routine_type == focus_break.routine_type
                ).first()
                if routine:
                    total_ratings = self.db.query(func.count(FocusBreak.id)).filter(
                        FocusBreak.routine_type == routine.routine_type,
                        FocusBreak.effectiveness_rating.isnot(None)
                    ).scalar()
                    routine.update_effectiveness_rating(effectiveness_rating, total_ratings)

            # Update session active duration
            session = self.db.query(FocusSession).filter(FocusSession.id == focus_break.session_id).first()
            if session:
                # Assume student is active after completing routine
                session.updated_at = datetime.utcnow()

            self.db.commit()
            self.db.refresh(focus_break)
        return focus_break

    def skip_routine(self, break_id: int) -> Optional[FocusBreak]:
        """정신정렬 루틴 건너뛰기"""
        focus_break = self.db.query(FocusBreak).filter(FocusBreak.id == break_id).first()
        if focus_break:
            focus_break.routine_skipped = True
            self.db.commit()
            self.db.refresh(focus_break)
        return focus_break

    def should_trigger_break(self, session_id: int, student_id: str) -> tuple[bool, Optional[BreakReason]]:
        """집중 중단이 필요한지 확인"""
        session = self.db.query(FocusSession).filter(FocusSession.id == session_id).first()
        if not session:
            return False, None

        # Get student preferences
        prefs = self.db.query(StudentFocusPreferences).filter(
            StudentFocusPreferences.student_id == student_id
        ).first()

        if not prefs or not prefs.enable_auto_breaks:
            return False, None

        # Check idle timeout
        time_since_update = (datetime.utcnow() - session.updated_at).total_seconds()
        if time_since_update >= prefs.idle_timeout_seconds:
            return True, BreakReason.IDLE_TIMEOUT

        # Check break frequency
        last_break = self.db.query(FocusBreak).filter(
            FocusBreak.session_id == session_id
        ).order_by(desc(FocusBreak.break_triggered_at)).first()

        if last_break:
            time_since_break = (datetime.utcnow() - last_break.break_triggered_at).total_seconds()
            if time_since_break >= (prefs.break_frequency_minutes * 60):
                return True, BreakReason.IDLE_TIMEOUT

        return False, None

    # Mental Alignment Routine Methods
    def get_routine_by_type(self, routine_type: str) -> Optional[MentalAlignmentRoutine]:
        """루틴 타입으로 조회"""
        return self.db.query(MentalAlignmentRoutine).filter(
            MentalAlignmentRoutine.routine_type == routine_type,
            MentalAlignmentRoutine.is_active == True
        ).first()

    def get_all_active_routines(self) -> List[MentalAlignmentRoutine]:
        """모든 활성 루틴 조회"""
        return self.db.query(MentalAlignmentRoutine).filter(
            MentalAlignmentRoutine.is_active == True
        ).all()

    def get_recommended_routine(self, student_id: str) -> Optional[MentalAlignmentRoutine]:
        """학생에게 추천되는 루틴 조회"""
        prefs = self.db.query(StudentFocusPreferences).filter(
            StudentFocusPreferences.student_id == student_id
        ).first()

        if prefs and prefs.preferred_routine_type:
            return self.get_routine_by_type(prefs.preferred_routine_type)

        # Default to breathing
        return self.get_routine_by_type('breathing')

    # Student Preferences Methods
    def get_or_create_preferences(self, student_id: str) -> StudentFocusPreferences:
        """학생 설정 조회 또는 생성"""
        prefs = self.db.query(StudentFocusPreferences).filter(
            StudentFocusPreferences.student_id == student_id
        ).first()

        if not prefs:
            prefs = StudentFocusPreferences(student_id=student_id)
            self.db.add(prefs)
            self.db.commit()
            self.db.refresh(prefs)

        return prefs

    # Analytics Methods
    def get_student_analytics(self, student_id: str, days: int = 30) -> FocusAnalytics:
        """학생 집중도 분석 데이터 조회"""
        start_date = datetime.utcnow() - timedelta(days=days)

        # Total sessions
        total_sessions = self.db.query(func.count(FocusSession.id)).filter(
            FocusSession.student_id == student_id,
            FocusSession.session_start >= start_date
        ).scalar()

        # Total study time
        total_seconds = self.db.query(func.sum(FocusSession.total_duration_seconds)).filter(
            FocusSession.student_id == student_id,
            FocusSession.session_start >= start_date,
            FocusSession.total_duration_seconds.isnot(None)
        ).scalar() or 0

        # Average focus score
        avg_focus_score = self.db.query(func.avg(FocusSession.focus_score)).filter(
            FocusSession.student_id == student_id,
            FocusSession.session_start >= start_date,
            FocusSession.focus_score.isnot(None)
        ).scalar() or 0.0

        # Total breaks
        total_breaks = self.db.query(func.count(FocusBreak.id)).filter(
            FocusBreak.student_id == student_id,
            FocusBreak.break_triggered_at >= start_date
        ).scalar()

        # Most common break reason
        most_common_reason = self.db.query(
            FocusBreak.break_reason,
            func.count(FocusBreak.id).label('count')
        ).filter(
            FocusBreak.student_id == student_id,
            FocusBreak.break_triggered_at >= start_date
        ).group_by(FocusBreak.break_reason).order_by(desc('count')).first()

        # Favorite routine type
        favorite_routine = self.db.query(
            FocusBreak.routine_type,
            func.count(FocusBreak.id).label('count')
        ).filter(
            FocusBreak.student_id == student_id,
            FocusBreak.break_triggered_at >= start_date,
            FocusBreak.routine_completed_at.isnot(None)
        ).group_by(FocusBreak.routine_type).order_by(desc('count')).first()

        # Completion rate
        completed_routines = self.db.query(func.count(FocusBreak.id)).filter(
            FocusBreak.student_id == student_id,
            FocusBreak.break_triggered_at >= start_date,
            FocusBreak.routine_completed_at.isnot(None),
            FocusBreak.routine_skipped == False
        ).scalar()
        completion_rate = (completed_routines / total_breaks * 100) if total_breaks > 0 else 0.0

        # Average effectiveness
        avg_effectiveness = self.db.query(func.avg(FocusBreak.effectiveness_rating)).filter(
            FocusBreak.student_id == student_id,
            FocusBreak.break_triggered_at >= start_date,
            FocusBreak.effectiveness_rating.isnot(None)
        ).scalar()

        return FocusAnalytics(
            student_id=student_id,
            total_sessions=total_sessions,
            total_study_time_minutes=round(total_seconds / 60, 2),
            average_focus_score=round(float(avg_focus_score), 2),
            total_breaks=total_breaks,
            most_common_break_reason=most_common_reason[0] if most_common_reason else None,
            favorite_routine_type=favorite_routine[0] if favorite_routine else None,
            completion_rate=round(completion_rate, 2),
            avg_routine_effectiveness=round(float(avg_effectiveness), 2) if avg_effectiveness else None
        )

    # Moodle Integration Methods
    def log_moodle_event(self, student_id: str, event_type: str, event_data: Optional[Dict[str, Any]] = None,
                         moodle_user_id: Optional[str] = None, moodle_course_id: Optional[str] = None) -> MoodleIntegrationLog:
        """Moodle 이벤트 로깅"""
        log = MoodleIntegrationLog(
            student_id=student_id,
            moodle_user_id=moodle_user_id,
            moodle_course_id=moodle_course_id,
            event_type=event_type,
            event_data=event_data
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log
