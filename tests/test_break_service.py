"""
휴식 제안 서비스 테스트
"""
import pytest
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from services.break_suggestion.break_service import (
    BreakSuggestionService,
    BreakType,
    BreakActivity
)


class TestBreakSuggestionService:
    """BreakSuggestionService 테스트"""

    def setup_method(self):
        """각 테스트 전 초기화"""
        self.service = BreakSuggestionService()

    def test_initialization(self):
        """초기화 테스트"""
        assert len(self.service.BREAK_ACTIVITIES) > 0
        assert len(self.service.suggestion_history) == 0

    def test_generate_suggestion_low_stress(self):
        """낮은 스트레스 레벨 제안 테스트"""
        suggestion = self.service.generate_suggestion(
            student_id="student_001",
            stress_level=0.3,
            learning_duration_minutes=30,
            sigh_count=0
        )

        assert suggestion.student_id == "student_001"
        assert suggestion.stress_level == 0.3
        assert len(suggestion.recommended_activities) > 0
        assert len(suggestion.recommended_activities) <= 3

        # 낮은 스트레스 → 짧은 휴식 우선
        activity_types = [a.break_type for a in suggestion.recommended_activities]
        assert BreakType.SHORT_BREAK.value in activity_types or \
               BreakType.MEDIUM_BREAK.value in activity_types

    def test_generate_suggestion_high_stress(self):
        """높은 스트레스 레벨 제안 테스트"""
        suggestion = self.service.generate_suggestion(
            student_id="student_002",
            stress_level=0.9,
            learning_duration_minutes=120,
            sigh_count=5
        )

        assert suggestion.student_id == "student_002"
        assert suggestion.stress_level == 0.9
        assert len(suggestion.recommended_activities) > 0

        # 높은 스트레스 → 긴 휴식/운동/마음챙김 우선
        activity_types = [a.break_type for a in suggestion.recommended_activities]
        assert (BreakType.LONG_BREAK.value in activity_types or
                BreakType.EXERCISE.value in activity_types or
                BreakType.MINDFULNESS.value in activity_types)

    def test_generate_suggestion_multiple_sighs(self):
        """여러 한숨 감지 시 제안 테스트"""
        suggestion = self.service.generate_suggestion(
            student_id="student_003",
            stress_level=0.7,
            learning_duration_minutes=60,
            sigh_count=4
        )

        assert "stress" in suggestion.reason.lower() or "sigh" in suggestion.reason.lower()
        assert "스트레스" in suggestion.reason_ko or "한숨" in suggestion.reason_ko

    def test_generate_suggestion_long_duration(self):
        """긴 학습 시간 제안 테스트"""
        suggestion = self.service.generate_suggestion(
            student_id="student_004",
            stress_level=0.5,
            learning_duration_minutes=100,
            sigh_count=1
        )

        assert "100" in suggestion.reason or "studying" in suggestion.reason.lower()
        assert "100" in suggestion.reason_ko or "학습" in suggestion.reason_ko

    def test_break_activities_structure(self):
        """휴식 활동 데이터 구조 테스트"""
        for activity in self.service.BREAK_ACTIVITIES:
            assert isinstance(activity, BreakActivity)
            assert activity.activity_id
            assert activity.name
            assert activity.name_ko
            assert activity.description
            assert activity.description_ko
            assert activity.duration_minutes > 0
            assert isinstance(activity.break_type, BreakType)
            assert activity.difficulty in ["easy", "medium", "hard"]

    def test_suggestion_history_storage(self):
        """제안 이력 저장 테스트"""
        student_id = "student_005"

        # 첫 제안
        suggestion1 = self.service.generate_suggestion(
            student_id=student_id,
            stress_level=0.5,
            learning_duration_minutes=60,
            sigh_count=1
        )

        assert student_id in self.service.suggestion_history
        assert len(self.service.suggestion_history[student_id]) == 1

        # 두 번째 제안
        suggestion2 = self.service.generate_suggestion(
            student_id=student_id,
            stress_level=0.7,
            learning_duration_minutes=90,
            sigh_count=3
        )

        assert len(self.service.suggestion_history[student_id]) == 2

    def test_get_suggestion_history(self):
        """제안 이력 조회 테스트"""
        student_id = "student_006"

        # 여러 제안 생성
        for i in range(5):
            self.service.generate_suggestion(
                student_id=student_id,
                stress_level=0.5 + i * 0.1,
                learning_duration_minutes=60 + i * 10,
                sigh_count=i
            )

        # 이력 조회
        history = self.service.get_suggestion_history(student_id, limit=3)
        assert len(history) == 3

        # 전체 이력 조회
        full_history = self.service.get_suggestion_history(student_id, limit=10)
        assert len(full_history) == 5

    def test_suggestion_history_limit(self):
        """이력 최대 개수 제한 테스트"""
        student_id = "student_007"

        # 15개 제안 생성 (최대 10개만 유지되어야 함)
        for i in range(15):
            self.service.generate_suggestion(
                student_id=student_id,
                stress_level=0.5,
                learning_duration_minutes=60,
                sigh_count=1
            )

        history = self.service.suggestion_history[student_id]
        assert len(history) == 10  # 최근 10개만 유지

    def test_activity_selection_variety(self):
        """다양한 활동 선택 테스트"""
        activities_seen = set()

        # 여러 번 제안 생성
        for i in range(10):
            suggestion = self.service.generate_suggestion(
                student_id=f"student_{i}",
                stress_level=0.5 + (i % 3) * 0.1,
                learning_duration_minutes=60,
                sigh_count=i % 4
            )

            for activity in suggestion.recommended_activities:
                activities_seen.add(activity.activity_id)

        # 다양한 활동이 선택되었는지 확인
        assert len(activities_seen) > 3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
