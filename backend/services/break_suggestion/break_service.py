"""
휴식 제안 서비스
학생의 학습 상태에 따라 적절한 휴식을 제안합니다.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from enum import Enum
import random


class BreakType(Enum):
    """휴식 유형"""
    SHORT_BREAK = "short_break"  # 5분
    MEDIUM_BREAK = "medium_break"  # 10분
    LONG_BREAK = "long_break"  # 15-20분
    EXERCISE = "exercise"  # 스트레칭/운동
    MINDFULNESS = "mindfulness"  # 명상/호흡


class BreakActivity:
    """휴식 활동"""

    def __init__(
        self,
        activity_id: str,
        name: str,
        name_ko: str,
        description: str,
        description_ko: str,
        duration_minutes: int,
        break_type: BreakType,
        difficulty: str = "easy"
    ):
        self.activity_id = activity_id
        self.name = name
        self.name_ko = name_ko
        self.description = description
        self.description_ko = description_ko
        self.duration_minutes = duration_minutes
        self.break_type = break_type
        self.difficulty = difficulty

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환"""
        return {
            "activity_id": self.activity_id,
            "name": self.name,
            "name_ko": self.name_ko,
            "description": self.description,
            "description_ko": self.description_ko,
            "duration_minutes": self.duration_minutes,
            "break_type": self.break_type.value,
            "difficulty": self.difficulty
        }


class BreakSuggestion:
    """휴식 제안"""

    def __init__(
        self,
        student_id: str,
        stress_level: float,
        reason: str,
        reason_ko: str,
        recommended_activities: List[BreakActivity],
        timestamp: Optional[datetime] = None
    ):
        self.student_id = student_id
        self.stress_level = stress_level
        self.reason = reason
        self.reason_ko = reason_ko
        self.recommended_activities = recommended_activities
        self.timestamp = timestamp or datetime.now()

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환"""
        return {
            "student_id": self.student_id,
            "stress_level": self.stress_level,
            "reason": self.reason,
            "reason_ko": self.reason_ko,
            "recommended_activities": [
                activity.to_dict() for activity in self.recommended_activities
            ],
            "timestamp": self.timestamp.isoformat()
        }


class BreakSuggestionService:
    """
    휴식 제안 서비스

    학생의 스트레스 레벨, 학습 시간, 한숨 빈도 등을 고려하여
    적절한 휴식을 제안합니다.
    """

    # 휴식 활동 데이터베이스
    BREAK_ACTIVITIES = [
        # 짧은 휴식
        BreakActivity(
            "deep_breathing",
            "Deep Breathing Exercise",
            "심호흡 운동",
            "Take 5 deep breaths, inhaling for 4 counts and exhaling for 6 counts.",
            "4초 동안 숨을 들이마시고 6초 동안 내쉬는 심호흡을 5회 반복하세요.",
            5,
            BreakType.SHORT_BREAK,
            "easy"
        ),
        BreakActivity(
            "eye_rest",
            "Eye Rest (20-20-20 Rule)",
            "눈 휴식 (20-20-20 규칙)",
            "Look at something 20 feet away for 20 seconds every 20 minutes.",
            "20분마다 20피트(6m) 떨어진 곳을 20초간 바라보세요.",
            5,
            BreakType.SHORT_BREAK,
            "easy"
        ),
        BreakActivity(
            "water_break",
            "Hydration Break",
            "수분 보충",
            "Drink a glass of water and walk around for a few minutes.",
            "물 한 잔을 마시고 몇 분간 걸어보세요.",
            5,
            BreakType.SHORT_BREAK,
            "easy"
        ),

        # 중간 휴식
        BreakActivity(
            "stretching",
            "Full Body Stretching",
            "전신 스트레칭",
            "Perform gentle stretches for your neck, shoulders, back, and legs.",
            "목, 어깨, 등, 다리를 부드럽게 스트레칭하세요.",
            10,
            BreakType.EXERCISE,
            "easy"
        ),
        BreakActivity(
            "walk_outside",
            "Short Walk Outside",
            "짧은 산책",
            "Take a 10-minute walk outside to get fresh air and sunlight.",
            "신선한 공기와 햇빛을 받으며 10분간 산책하세요.",
            10,
            BreakType.MEDIUM_BREAK,
            "easy"
        ),
        BreakActivity(
            "mindful_meditation",
            "Mindful Meditation",
            "마음챙김 명상",
            "Sit quietly and focus on your breath for 10 minutes.",
            "조용히 앉아 10분간 호흡에 집중하세요.",
            10,
            BreakType.MINDFULNESS,
            "medium"
        ),

        # 긴 휴식
        BreakActivity(
            "power_nap",
            "Power Nap",
            "파워 낮잠",
            "Take a 15-20 minute nap to recharge your energy.",
            "15-20분간 낮잠을 자서 에너지를 충전하세요.",
            20,
            BreakType.LONG_BREAK,
            "medium"
        ),
        BreakActivity(
            "light_exercise",
            "Light Exercise",
            "가벼운 운동",
            "Do some light exercises like jumping jacks, yoga, or jogging in place.",
            "제자리 뛰기, 요가, 또는 제자리 조깅 같은 가벼운 운동을 하세요.",
            15,
            BreakType.EXERCISE,
            "medium"
        ),
        BreakActivity(
            "hobby_time",
            "Creative Hobby Time",
            "취미 시간",
            "Spend 15 minutes on a creative hobby you enjoy.",
            "좋아하는 창의적인 취미 활동에 15분을 투자하세요.",
            15,
            BreakType.LONG_BREAK,
            "easy"
        ),

        # 마음챙김
        BreakActivity(
            "progressive_relaxation",
            "Progressive Muscle Relaxation",
            "점진적 근육 이완",
            "Systematically tense and relax different muscle groups.",
            "체계적으로 각 근육 그룹을 긴장시켰다가 이완하세요.",
            15,
            BreakType.MINDFULNESS,
            "medium"
        )
    ]

    def __init__(self):
        self.suggestion_history = {}

    def generate_suggestion(
        self,
        student_id: str,
        stress_level: float,
        learning_duration_minutes: int,
        sigh_count: int
    ) -> BreakSuggestion:
        """
        휴식 제안 생성

        Args:
            student_id: 학생 ID
            stress_level: 스트레스 레벨 (0.0 ~ 1.0)
            learning_duration_minutes: 학습 지속 시간 (분)
            sigh_count: 최근 한숨 횟수

        Returns:
            BreakSuggestion: 휴식 제안
        """
        # 1. 상황 분석
        reason, reason_ko = self._analyze_situation(
            stress_level,
            learning_duration_minutes,
            sigh_count
        )

        # 2. 적절한 휴식 유형 결정
        break_types = self._determine_break_types(
            stress_level,
            learning_duration_minutes
        )

        # 3. 활동 추천
        recommended_activities = self._select_activities(
            break_types,
            stress_level
        )

        # 4. 제안 생성
        suggestion = BreakSuggestion(
            student_id=student_id,
            stress_level=stress_level,
            reason=reason,
            reason_ko=reason_ko,
            recommended_activities=recommended_activities
        )

        # 5. 이력 저장
        self._save_suggestion_history(student_id, suggestion)

        return suggestion

    def _analyze_situation(
        self,
        stress_level: float,
        learning_duration_minutes: int,
        sigh_count: int
    ) -> tuple:
        """상황 분석하여 이유 생성"""

        if sigh_count >= 3:
            return (
                f"You've shown signs of stress ({sigh_count} deep sighs detected). Let's take a break!",
                f"스트레스 징후가 감지되었습니다 ({sigh_count}회의 깊은 한숨). 휴식을 취하세요!"
            )
        elif stress_level >= 0.8:
            return (
                "Your stress level is quite high. It's time for a refreshing break.",
                "스트레스 레벨이 상당히 높습니다. 재충전을 위한 휴식이 필요합니다."
            )
        elif learning_duration_minutes >= 90:
            return (
                f"You've been studying for {learning_duration_minutes} minutes. Great focus! Now let's recharge.",
                f"{learning_duration_minutes}분간 학습하셨습니다. 훌륭한 집중력이에요! 이제 재충전할 시간입니다."
            )
        elif stress_level >= 0.6:
            return (
                "Your focus might be wavering. A short break will help you refocus.",
                "집중력이 떨어지고 있을 수 있습니다. 짧은 휴식이 도움이 될 거예요."
            )
        else:
            return (
                "Taking regular breaks improves learning efficiency. Let's pause for a moment.",
                "규칙적인 휴식은 학습 효율을 높입니다. 잠시 멈춰 보세요."
            )

    def _determine_break_types(
        self,
        stress_level: float,
        learning_duration_minutes: int
    ) -> List[BreakType]:
        """적절한 휴식 유형 결정"""
        break_types = []

        if stress_level >= 0.8 or learning_duration_minutes >= 90:
            # 높은 스트레스 또는 긴 학습 시간 → 긴 휴식 + 운동/명상
            break_types.extend([
                BreakType.LONG_BREAK,
                BreakType.EXERCISE,
                BreakType.MINDFULNESS
            ])
        elif stress_level >= 0.6 or learning_duration_minutes >= 60:
            # 중간 스트레스 → 중간 휴식 + 운동
            break_types.extend([
                BreakType.MEDIUM_BREAK,
                BreakType.EXERCISE,
                BreakType.SHORT_BREAK
            ])
        else:
            # 낮은 스트레스 → 짧은 휴식
            break_types.extend([
                BreakType.SHORT_BREAK,
                BreakType.MEDIUM_BREAK
            ])

        return break_types

    def _select_activities(
        self,
        break_types: List[BreakType],
        stress_level: float
    ) -> List[BreakActivity]:
        """활동 선택 (최대 3개)"""

        # 유형별로 활동 필터링
        filtered_activities = [
            activity for activity in self.BREAK_ACTIVITIES
            if activity.break_type in break_types
        ]

        # 스트레스 레벨에 따라 우선순위 조정
        if stress_level >= 0.7:
            # 높은 스트레스 → 마음챙김/운동 우선
            prioritized = sorted(
                filtered_activities,
                key=lambda a: (
                    a.break_type in [BreakType.MINDFULNESS, BreakType.EXERCISE],
                    -a.duration_minutes
                ),
                reverse=True
            )
        else:
            # 낮은 스트레스 → 짧고 쉬운 활동 우선
            prioritized = sorted(
                filtered_activities,
                key=lambda a: (a.difficulty == "easy", a.duration_minutes)
            )

        # 최대 3개 선택
        selected = prioritized[:3]

        # 적어도 1개는 포함되도록
        if not selected and self.BREAK_ACTIVITIES:
            selected = [random.choice(self.BREAK_ACTIVITIES)]

        return selected

    def _save_suggestion_history(
        self,
        student_id: str,
        suggestion: BreakSuggestion
    ):
        """제안 이력 저장"""
        if student_id not in self.suggestion_history:
            self.suggestion_history[student_id] = []

        self.suggestion_history[student_id].append(suggestion)

        # 최근 10개만 유지
        self.suggestion_history[student_id] = (
            self.suggestion_history[student_id][-10:]
        )

    def get_suggestion_history(
        self,
        student_id: str,
        limit: int = 10
    ) -> List[BreakSuggestion]:
        """
        제안 이력 조회

        Args:
            student_id: 학생 ID
            limit: 조회 개수

        Returns:
            List[BreakSuggestion]: 제안 이력
        """
        history = self.suggestion_history.get(student_id, [])
        return history[-limit:]
