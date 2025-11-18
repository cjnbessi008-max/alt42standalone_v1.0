"""
Focus Intensity Database Models
"""

from sqlalchemy import Column, String, Integer, Boolean, Float, TIMESTAMP, ForeignKey, CheckConstraint, text, ARRAY
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.database import Base


class FocusIntensityLevel(Base):
    """집중 강도 레벨 설정 테이블"""
    __tablename__ = "focus_intensity_levels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), nullable=False)  # FK는 나중에 추가
    level = Column(Integer, CheckConstraint('level BETWEEN 1 AND 5'), nullable=False)

    # 시간 설정
    time_limit_seconds = Column(Integer)
    show_timer = Column(Boolean, default=True)
    timer_urgency_threshold = Column(Integer, default=30)

    # 힌트 설정
    hints_available = Column(Integer, default=0)
    hint_delay_seconds = Column(Integer, default=0)
    show_solution = Column(Boolean, default=False)

    # UI 설정
    ui_complexity = Column(String(20), default='standard')
    distraction_level = Column(String(20), default='low')
    background_color = Column(String(7), default='#F5F5F5')
    animation_speed = Column(Float, default=1.0)

    # 피드백 설정
    immediate_feedback = Column(Boolean, default=True)
    feedback_detail = Column(String(20), default='detailed')
    encouragement_frequency = Column(Integer, default=3)

    # 음향 설정
    sound_enabled = Column(Boolean, default=False)
    background_music = Column(String(20), default='none')
    sound_effects = Column(Boolean, default=False)

    # 메타데이터
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True))

    __table_args__ = (
        CheckConstraint('level BETWEEN 1 AND 5', name='check_level_range'),
        CheckConstraint("ui_complexity IN ('minimal', 'standard', 'rich')", name='check_ui_complexity'),
        CheckConstraint("distraction_level IN ('none', 'low', 'medium')", name='check_distraction_level'),
        CheckConstraint("feedback_detail IN ('minimal', 'detailed', 'comprehensive')", name='check_feedback_detail'),
        CheckConstraint("background_music IN ('none', 'ambient', 'focus')", name='check_background_music'),
    )

    def to_dict(self):
        """모델을 딕셔너리로 변환"""
        return {
            "id": str(self.id),
            "module_id": str(self.module_id),
            "level": self.level,
            "time_limit_seconds": self.time_limit_seconds,
            "show_timer": self.show_timer,
            "timer_urgency_threshold": self.timer_urgency_threshold,
            "hints_available": self.hints_available,
            "hint_delay_seconds": self.hint_delay_seconds,
            "show_solution": self.show_solution,
            "ui_complexity": self.ui_complexity,
            "distraction_level": self.distraction_level,
            "background_color": self.background_color,
            "animation_speed": self.animation_speed,
            "immediate_feedback": self.immediate_feedback,
            "feedback_detail": self.feedback_detail,
            "encouragement_frequency": self.encouragement_frequency,
            "sound_enabled": self.sound_enabled,
            "background_music": self.background_music,
            "sound_effects": self.sound_effects,
        }


class StudentFocusSession(Base):
    """학생별 집중 강도 세션 추적 테이블"""
    __tablename__ = "student_focus_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), nullable=False)
    module_id = Column(UUID(as_uuid=True), nullable=False)
    problem_id = Column(UUID(as_uuid=True), nullable=False)

    # 집중 강도 정보
    focus_intensity_level = Column(Integer, CheckConstraint('focus_intensity_level BETWEEN 1 AND 5'), nullable=False)
    previous_level = Column(Integer, CheckConstraint('previous_level BETWEEN 1 AND 5'))
    auto_adjusted = Column(Boolean, default=True)
    adjustment_reason = Column(String(100))

    # 문제 정보
    problem_difficulty = Column(Integer, CheckConstraint('problem_difficulty BETWEEN 1 AND 5'))
    problem_type = Column(String(50))

    # 문제 풀이 결과
    is_correct = Column(Boolean)
    time_spent_seconds = Column(Integer)
    hints_used = Column(Integer, default=0)
    solution_viewed = Column(Boolean, default=False)

    # 성과 지표
    response_time_ratio = Column(Float)
    recent_accuracy_rate = Column(Float)
    consecutive_correct = Column(Integer, default=0)
    consecutive_incorrect = Column(Integer, default=0)

    # UI 설정 스냅샷
    ui_settings = Column(JSONB)

    # 타임스탬프
    started_at = Column(TIMESTAMP, default=datetime.utcnow)
    completed_at = Column(TIMESTAMP)

    def to_dict(self):
        """모델을 딕셔너리로 변환"""
        return {
            "id": str(self.id),
            "student_id": str(self.student_id),
            "module_id": str(self.module_id),
            "problem_id": str(self.problem_id),
            "focus_intensity_level": self.focus_intensity_level,
            "previous_level": self.previous_level,
            "auto_adjusted": self.auto_adjusted,
            "adjustment_reason": self.adjustment_reason,
            "problem_difficulty": self.problem_difficulty,
            "problem_type": self.problem_type,
            "is_correct": self.is_correct,
            "time_spent_seconds": self.time_spent_seconds,
            "hints_used": self.hints_used,
            "solution_viewed": self.solution_viewed,
            "response_time_ratio": self.response_time_ratio,
            "recent_accuracy_rate": self.recent_accuracy_rate,
            "consecutive_correct": self.consecutive_correct,
            "consecutive_incorrect": self.consecutive_incorrect,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }
