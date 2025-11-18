"""
Focus Intensity Service
비즈니스 로직 처리
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime, timedelta

from app.models.focus_intensity import FocusIntensityLevel, StudentFocusSession
from app.schemas.focus_intensity import FocusSessionCreate, FocusAnalyticsResponse, LevelPerformance
from app.algorithms.focus_intensity import FocusIntensityAnalyzer


class FocusIntensityService:
    """집중 강도 서비스"""

    def __init__(self, db: Session):
        self.db = db

    # ========================================================================
    # Focus Intensity Level CRUD
    # ========================================================================

    def get_focus_levels(self, module_id: UUID) -> List[FocusIntensityLevel]:
        """모듈의 모든 집중 강도 레벨 조회"""
        return self.db.query(FocusIntensityLevel).filter(
            FocusIntensityLevel.module_id == module_id
        ).order_by(FocusIntensityLevel.level).all()

    def get_focus_level_by_number(
        self, module_id: UUID, level: int
    ) -> Optional[FocusIntensityLevel]:
        """특정 레벨 조회"""
        return self.db.query(FocusIntensityLevel).filter(
            FocusIntensityLevel.module_id == module_id,
            FocusIntensityLevel.level == level
        ).first()

    def update_focus_level(
        self, module_id: UUID, level: int, update_data: Dict
    ) -> Optional[FocusIntensityLevel]:
        """레벨 설정 수정"""
        level_obj = self.get_focus_level_by_number(module_id, level)
        if not level_obj:
            return None

        for key, value in update_data.items():
            if hasattr(level_obj, key) and value is not None:
                setattr(level_obj, key, value)

        level_obj.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(level_obj)

        return level_obj

    def create_default_levels(self, module_id: UUID) -> List[FocusIntensityLevel]:
        """기본 5단계 집중 강도 레벨 생성"""
        default_levels = [
            {
                "level": 1,
                "time_limit_seconds": 300,
                "hints_available": 3,
                "show_timer": False,
                "background_color": "#E3F2FD",
                "ui_complexity": "rich",
                "feedback_detail": "comprehensive",
            },
            {
                "level": 2,
                "time_limit_seconds": 240,
                "hints_available": 2,
                "show_timer": False,
                "background_color": "#FFF3E0",
                "ui_complexity": "standard",
                "feedback_detail": "detailed",
            },
            {
                "level": 3,
                "time_limit_seconds": 180,
                "hints_available": 1,
                "show_timer": True,
                "background_color": "#F5F5F5",
                "ui_complexity": "standard",
                "feedback_detail": "detailed",
            },
            {
                "level": 4,
                "time_limit_seconds": 120,
                "hints_available": 0,
                "show_timer": True,
                "background_color": "#E0E0E0",
                "ui_complexity": "minimal",
                "feedback_detail": "minimal",
            },
            {
                "level": 5,
                "time_limit_seconds": 90,
                "hints_available": 0,
                "show_timer": True,
                "background_color": "#FAFAFA",
                "ui_complexity": "minimal",
                "feedback_detail": "minimal",
            },
        ]

        created_levels = []
        for level_data in default_levels:
            level_obj = FocusIntensityLevel(
                module_id=module_id,
                **level_data
            )
            self.db.add(level_obj)
            created_levels.append(level_obj)

        self.db.commit()
        return created_levels

    # ========================================================================
    # Session Management
    # ========================================================================

    def create_session(self, session_data: FocusSessionCreate) -> StudentFocusSession:
        """집중 강도 세션 생성"""
        session = StudentFocusSession(
            student_id=session_data.student_id,
            module_id=session_data.module_id,
            problem_id=session_data.problem_id,
            focus_intensity_level=session_data.focus_intensity_level,
            previous_level=session_data.previous_level,
            auto_adjusted=session_data.auto_adjusted,
            adjustment_reason=session_data.adjustment_reason,
            problem_difficulty=session_data.problem_difficulty,
            problem_type=session_data.problem_type,
            is_correct=session_data.is_correct,
            time_spent_seconds=session_data.time_spent_seconds,
            hints_used=session_data.hints_used,
            solution_viewed=session_data.solution_viewed,
            ui_settings=session_data.ui_settings,
            completed_at=datetime.utcnow(),
        )

        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        return session

    def get_student_sessions(
        self,
        student_id: UUID,
        module_id: Optional[UUID] = None,
        limit: int = 100
    ) -> List[StudentFocusSession]:
        """학생의 세션 기록 조회"""
        query = self.db.query(StudentFocusSession).filter(
            StudentFocusSession.student_id == student_id
        )

        if module_id:
            query = query.filter(StudentFocusSession.module_id == module_id)

        return query.order_by(
            StudentFocusSession.started_at.desc()
        ).limit(limit).all()

    # ========================================================================
    # Analytics
    # ========================================================================

    def get_student_analytics(
        self,
        student_id: UUID,
        module_id: Optional[UUID] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> FocusAnalyticsResponse:
        """학생별 집중 강도 분석"""

        # 기간 설정
        if not end_date:
            end_date_obj = datetime.utcnow()
        else:
            end_date_obj = datetime.fromisoformat(end_date)

        if not start_date:
            start_date_obj = end_date_obj - timedelta(days=30)
        else:
            start_date_obj = datetime.fromisoformat(start_date)

        # 세션 조회
        query = self.db.query(StudentFocusSession).filter(
            StudentFocusSession.student_id == student_id,
            StudentFocusSession.completed_at.isnot(None),
            StudentFocusSession.started_at >= start_date_obj,
            StudentFocusSession.started_at <= end_date_obj
        )

        if module_id:
            query = query.filter(StudentFocusSession.module_id == module_id)

        sessions = query.all()

        # 레벨별 성과 분석
        level_stats = {}
        for session in sessions:
            level = session.focus_intensity_level
            if level not in level_stats:
                level_stats[level] = {
                    "correct": 0,
                    "total": 0,
                    "time_sum": 0
                }

            level_stats[level]["total"] += 1
            if session.is_correct:
                level_stats[level]["correct"] += 1
            level_stats[level]["time_sum"] += session.time_spent_seconds or 0

        # LevelPerformance 생성
        level_performance = []
        for level in range(1, 6):
            if level in level_stats:
                stats = level_stats[level]
                accuracy = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
                avg_time = stats["time_sum"] / stats["total"] if stats["total"] > 0 else 0
                efficiency = accuracy / max(avg_time, 1.0) if avg_time > 0 else 0

                level_performance.append(LevelPerformance(
                    level=level,
                    accuracy_rate=accuracy,
                    avg_time_spent=avg_time,
                    total_attempts=stats["total"],
                    correct_count=stats["correct"],
                    incorrect_count=stats["total"] - stats["correct"],
                    efficiency_score=efficiency
                ))

        # 최적 레벨 계산
        analyzer = FocusIntensityAnalyzer()
        level_performances_dict = [
            {
                "level": lp.level,
                "accuracy_rate": lp.accuracy_rate,
                "avg_time_spent": lp.avg_time_spent,
                "total_attempts": lp.total_attempts
            }
            for lp in level_performance
        ]
        optimal_level, confidence = analyzer.calculate_optimal_level(level_performances_dict)

        # 추세 분석
        session_history = [
            {
                "timestamp": s.started_at.isoformat(),
                "level": s.focus_intensity_level,
                "is_correct": s.is_correct,
                "time_spent": s.time_spent_seconds
            }
            for s in sessions
        ]
        trends = analyzer.analyze_trends(session_history)

        # 추천 생성
        recommendations = []
        if optimal_level:
            recommendations.append(f"레벨 {optimal_level}에서 가장 효율적으로 학습하고 있습니다.")

        if trends["avg_level_trend"] == "increasing":
            recommendations.append("평균 집중 레벨이 지속적으로 상승하고 있습니다!")

        if trends["accuracy_trend"] == "improving":
            recommendations.append("정답률이 향상되고 있습니다. 잘하고 있어요!")

        if trends["engagement_score"] > 0.7:
            recommendations.append("높은 몰입도를 유지하고 있습니다. 계속 해봐요!")

        return FocusAnalyticsResponse(
            student_id=student_id,
            module_id=module_id,
            period={
                "start_date": start_date_obj.isoformat(),
                "end_date": end_date_obj.isoformat()
            },
            current_optimal_level=optimal_level or 3,
            level_performance=level_performance,
            trends={
                "avg_level_trend": trends["avg_level_trend"],
                "accuracy_trend": trends["accuracy_trend"],
                "engagement_score": trends["engagement_score"],
                "consistency_score": trends["consistency_score"]
            },
            recommendations=recommendations
        )
