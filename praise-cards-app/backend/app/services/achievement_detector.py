from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..models import Achievement, LearningSession, Student
from ..models.achievement import AchievementType
from ..config import settings


class AchievementDetector:
    """Detects student achievements based on learning activities"""

    def __init__(self, db: Session):
        self.db = db

    def detect_achievements(
        self, student_id: str, learning_session_id: Optional[str] = None
    ) -> List[Achievement]:
        """
        Detect all possible achievements for a student
        Returns list of new Achievement objects
        """
        achievements = []
        student = self.db.query(Student).filter(Student.id == student_id).first()

        if not student:
            return achievements

        # Get the learning session if provided
        session = None
        if learning_session_id:
            session = (
                self.db.query(LearningSession)
                .filter(LearningSession.id == learning_session_id)
                .first()
            )

        # Check various achievement types
        achievements.extend(self._check_high_accuracy(student, session))
        achievements.extend(self._check_consecutive_days(student))
        achievements.extend(self._check_learning_time(student, session))
        achievements.extend(self._check_module_completion(student, session))
        achievements.extend(self._check_progress_boost(student, session))
        achievements.extend(self._check_perfect_score(student, session))
        achievements.extend(self._check_first_module(student))

        return achievements

    def _check_high_accuracy(
        self, student: Student, session: Optional[LearningSession]
    ) -> List[Achievement]:
        """Check if student achieved high accuracy (80%+)"""
        achievements = []

        if session and session.accuracy_percentage >= settings.HIGH_ACCURACY_THRESHOLD:
            # Check if this achievement already exists for this session
            existing = (
                self.db.query(Achievement)
                .filter(
                    Achievement.student_id == student.id,
                    Achievement.learning_session_id == session.id,
                    Achievement.achievement_type == AchievementType.HIGH_ACCURACY,
                )
                .first()
            )

            if not existing:
                achievement = Achievement(
                    student_id=student.id,
                    learning_session_id=session.id,
                    achievement_type=AchievementType.HIGH_ACCURACY,
                    title=f"정확도 {int(session.accuracy_percentage)}% 달성! 🎯",
                    description=f"{session.module_name}에서 뛰어난 정확도를 보여줬어요!",
                    value=int(session.accuracy_percentage),
                )
                achievements.append(achievement)

        return achievements

    def _check_consecutive_days(self, student: Student) -> List[Achievement]:
        """Check if student maintained learning streak"""
        achievements = []

        if student.consecutive_days >= settings.CONSECUTIVE_DAYS_THRESHOLD:
            # Check if already awarded for this streak length
            existing = (
                self.db.query(Achievement)
                .filter(
                    Achievement.student_id == student.id,
                    Achievement.achievement_type == AchievementType.CONSECUTIVE_DAYS,
                    Achievement.value == student.consecutive_days,
                )
                .first()
            )

            if not existing:
                achievement = Achievement(
                    student_id=student.id,
                    achievement_type=AchievementType.CONSECUTIVE_DAYS,
                    title=f"{student.consecutive_days}일 연속 학습! 🔥",
                    description=f"꾸준함이 실력이 되는 중이에요!",
                    value=student.consecutive_days,
                )
                achievements.append(achievement)

        return achievements

    def _check_learning_time(
        self, student: Student, session: Optional[LearningSession]
    ) -> List[Achievement]:
        """Check if student spent significant time learning today"""
        achievements = []

        # Calculate today's total learning time
        today = datetime.utcnow().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        total_today = (
            self.db.query(func.sum(LearningSession.duration_minutes))
            .filter(
                LearningSession.student_id == student.id,
                LearningSession.started_at >= today_start,
                LearningSession.started_at <= today_end,
            )
            .scalar()
            or 0
        )

        if total_today >= settings.DAILY_LEARNING_TIME_THRESHOLD:
            # Check if already awarded for today
            existing = (
                self.db.query(Achievement)
                .filter(
                    Achievement.student_id == student.id,
                    Achievement.achievement_type == AchievementType.LEARNING_TIME,
                    Achievement.achieved_at >= today_start,
                )
                .first()
            )

            if not existing:
                achievement = Achievement(
                    student_id=student.id,
                    learning_session_id=session.id if session else None,
                    achievement_type=AchievementType.LEARNING_TIME,
                    title=f"오늘 {int(total_today)}분 학습! ⏰",
                    description=f"집중력이 대단해요!",
                    value=int(total_today),
                )
                achievements.append(achievement)

        return achievements

    def _check_module_completion(
        self, student: Student, session: Optional[LearningSession]
    ) -> List[Achievement]:
        """Check if student completed a module"""
        achievements = []

        if session and session.progress_percentage >= 100:
            # Check if already awarded for this module
            existing = (
                self.db.query(Achievement)
                .filter(
                    Achievement.student_id == student.id,
                    Achievement.learning_session_id == session.id,
                    Achievement.achievement_type == AchievementType.MODULE_COMPLETED,
                )
                .first()
            )

            if not existing:
                achievement = Achievement(
                    student_id=student.id,
                    learning_session_id=session.id,
                    achievement_type=AchievementType.MODULE_COMPLETED,
                    title=f"{session.module_name} 완료! 🎓",
                    description=f"끝까지 해냈어요!",
                    value=100,
                )
                achievements.append(achievement)

        return achievements

    def _check_progress_boost(
        self, student: Student, session: Optional[LearningSession]
    ) -> List[Achievement]:
        """Check if student made significant progress"""
        achievements = []

        if session and session.progress_percentage >= settings.PROGRESS_BOOST_THRESHOLD:
            # Get previous progress for this module
            previous_session = (
                self.db.query(LearningSession)
                .filter(
                    LearningSession.student_id == student.id,
                    LearningSession.module_name == session.module_name,
                    LearningSession.id != session.id,
                )
                .order_by(LearningSession.started_at.desc())
                .first()
            )

            if previous_session:
                progress_gain = (
                    session.progress_percentage - previous_session.progress_percentage
                )

                if progress_gain >= settings.PROGRESS_BOOST_THRESHOLD:
                    # Check if already awarded
                    existing = (
                        self.db.query(Achievement)
                        .filter(
                            Achievement.student_id == student.id,
                            Achievement.learning_session_id == session.id,
                            Achievement.achievement_type
                            == AchievementType.PROGRESS_BOOST,
                        )
                        .first()
                    )

                    if not existing:
                        achievement = Achievement(
                            student_id=student.id,
                            learning_session_id=session.id,
                            achievement_type=AchievementType.PROGRESS_BOOST,
                            title=f"진도 {int(progress_gain)}% 향상! 📈",
                            description=f"속도가 붙었어요!",
                            value=int(progress_gain),
                        )
                        achievements.append(achievement)

        return achievements

    def _check_perfect_score(
        self, student: Student, session: Optional[LearningSession]
    ) -> List[Achievement]:
        """Check if student got perfect score"""
        achievements = []

        if session and session.accuracy_percentage == 100:
            existing = (
                self.db.query(Achievement)
                .filter(
                    Achievement.student_id == student.id,
                    Achievement.learning_session_id == session.id,
                    Achievement.achievement_type == AchievementType.PERFECT_SCORE,
                )
                .first()
            )

            if not existing:
                achievement = Achievement(
                    student_id=student.id,
                    learning_session_id=session.id,
                    achievement_type=AchievementType.PERFECT_SCORE,
                    title=f"만점! 완벽해요! 💯",
                    description=f"{session.module_name}에서 모든 문제를 맞혔어요!",
                    value=100,
                )
                achievements.append(achievement)

        return achievements

    def _check_first_module(self, student: Student) -> List[Achievement]:
        """Check if this is student's first module completion"""
        achievements = []

        if student.total_modules_completed == 1:
            existing = (
                self.db.query(Achievement)
                .filter(
                    Achievement.student_id == student.id,
                    Achievement.achievement_type == AchievementType.FIRST_MODULE,
                )
                .first()
            )

            if not existing:
                achievement = Achievement(
                    student_id=student.id,
                    achievement_type=AchievementType.FIRST_MODULE,
                    title=f"첫 모듈 완료! 🎉",
                    description=f"시작이 반이에요!",
                    value=1,
                )
                achievements.append(achievement)

        return achievements
