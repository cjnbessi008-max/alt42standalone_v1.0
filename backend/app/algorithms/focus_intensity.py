"""
집중 강도 자동 조절 알고리즘
Focus Intensity Adaptive Algorithm

Related: 0002-lms-focus-intensity-feature-spec.md
Version: 1.0.0
Created: 2025-11-18
"""

from typing import Dict, Tuple, Optional, List
from dataclasses import dataclass
from enum import Enum
import statistics


class AdjustmentReason(Enum):
    """집중 강도 조절 이유"""
    HIGH_ACCURACY_CONSECUTIVE_CORRECT = "high_accuracy_consecutive_correct"
    LOW_ACCURACY_CONSECUTIVE_INCORRECT = "low_accuracy_consecutive_incorrect"
    FAST_RESPONSE_HIGH_ACCURACY = "fast_response_high_accuracy"
    SLOW_RESPONSE_LOW_ACCURACY = "slow_response_low_accuracy"
    OPTIMAL_PERFORMANCE = "optimal_performance"
    MANUAL_OVERRIDE = "manual_override"
    NO_CHANGE_NEEDED = "no_change_needed"
    INSUFFICIENT_DATA = "insufficient_data"


@dataclass
class PerformanceData:
    """학생 수행 데이터"""
    recent_accuracy: float  # 0.0-1.0 (최근 N개 문제 정답률)
    avg_response_time: float  # 초
    expected_response_time: float  # 초 (문제 난이도 기반 예상 시간)
    consecutive_correct: int  # 연속 정답 수
    consecutive_incorrect: int  # 연속 오답 수
    total_attempts: int  # 전체 시도 횟수
    hints_used_avg: float  # 평균 힌트 사용 개수


@dataclass
class FocusIntensityAdjustment:
    """집중 강도 조절 결과"""
    new_level: int  # 1-5
    previous_level: int  # 1-5
    level_changed: bool
    adjustment_reason: AdjustmentReason
    confidence_score: float  # 0.0-1.0 (조절의 확신도)
    recommendation: str  # 학생에게 보여줄 메시지


class FocusIntensityAlgorithm:
    """집중 강도 자동 조절 알고리즘"""

    # 알고리즘 파라미터 (튜닝 가능)
    PARAMS = {
        # 정확도 기반 조절
        "high_accuracy_threshold": 0.9,  # 90% 이상
        "low_accuracy_threshold": 0.5,  # 50% 미만
        "consecutive_correct_threshold": 3,  # 3개 연속
        "consecutive_incorrect_threshold": 2,  # 2개 연속

        # 속도 기반 조절
        "fast_response_ratio": 0.5,  # 예상 시간의 50% 이하
        "slow_response_ratio": 2.0,  # 예상 시간의 200% 이상
        "fast_accuracy_threshold": 0.8,  # 빨리 풀면서 80% 이상 정확도
        "slow_accuracy_threshold": 0.7,  # 느리게 풀면서 70% 미만 정확도

        # 최소 데이터 요구사항
        "min_attempts_for_adjustment": 3,  # 최소 3개 문제 풀어야 조절 가능

        # 레벨 조절 제한
        "max_level_increase_per_step": 1,
        "max_level_decrease_per_step": 1,
        "cooldown_problems": 3,  # N개 문제마다 한 번만 조절
    }

    def __init__(self, params: Optional[Dict] = None):
        """
        Args:
            params: 커스텀 파라미터 (기본값 오버라이드)
        """
        if params:
            self.params = {**self.PARAMS, **params}
        else:
            self.params = self.PARAMS

    def calculate_adjustment(
        self,
        current_level: int,
        problem_difficulty: int,
        performance: PerformanceData,
        manual_override: Optional[int] = None
    ) -> FocusIntensityAdjustment:
        """
        현재 수행 데이터를 기반으로 집중 강도 조절 계산

        Args:
            current_level: 현재 집중 강도 레벨 (1-5)
            problem_difficulty: 문제 난이도 (1-5)
            performance: 학생 수행 데이터
            manual_override: 교사가 수동으로 지정한 레벨 (있으면 우선)

        Returns:
            FocusIntensityAdjustment: 조절 결과
        """
        # 1. 수동 조절이 있으면 우선
        if manual_override is not None:
            return self._create_manual_adjustment(current_level, manual_override)

        # 2. 데이터 부족 시 조절 불가
        if performance.total_attempts < self.params["min_attempts_for_adjustment"]:
            return self._create_no_change(
                current_level,
                AdjustmentReason.INSUFFICIENT_DATA,
                confidence=0.0
            )

        # 3. 규칙 기반 조절 결정
        new_level, reason, confidence = self._apply_adjustment_rules(
            current_level, problem_difficulty, performance
        )

        # 4. 레벨 변화 제한 (한 번에 1단계씩만)
        new_level = self._clamp_level_change(current_level, new_level)

        # 5. 결과 생성
        return FocusIntensityAdjustment(
            new_level=new_level,
            previous_level=current_level,
            level_changed=(new_level != current_level),
            adjustment_reason=reason,
            confidence_score=confidence,
            recommendation=self._generate_recommendation(
                current_level, new_level, reason
            )
        )

    def _apply_adjustment_rules(
        self,
        current_level: int,
        problem_difficulty: int,
        performance: PerformanceData
    ) -> Tuple[int, AdjustmentReason, float]:
        """
        규칙 기반 조절 로직

        Returns:
            (new_level, reason, confidence)
        """
        accuracy = performance.recent_accuracy
        speed_ratio = performance.avg_response_time / max(performance.expected_response_time, 1.0)
        consec_correct = performance.consecutive_correct
        consec_incorrect = performance.consecutive_incorrect

        # 규칙 1: 높은 정답률 + 연속 정답 → 레벨 증가
        if (accuracy > self.params["high_accuracy_threshold"] and
            consec_correct >= self.params["consecutive_correct_threshold"]):
            return (
                current_level + 1,
                AdjustmentReason.HIGH_ACCURACY_CONSECUTIVE_CORRECT,
                0.95
            )

        # 규칙 2: 낮은 정답률 + 연속 오답 → 레벨 감소
        if (accuracy < self.params["low_accuracy_threshold"] and
            consec_incorrect >= self.params["consecutive_incorrect_threshold"]):
            return (
                current_level - 1,
                AdjustmentReason.LOW_ACCURACY_CONSECUTIVE_INCORRECT,
                0.9
            )

        # 규칙 3: 빠른 응답 + 높은 정확도 → 레벨 증가
        if (speed_ratio < self.params["fast_response_ratio"] and
            accuracy > self.params["fast_accuracy_threshold"]):
            return (
                current_level + 1,
                AdjustmentReason.FAST_RESPONSE_HIGH_ACCURACY,
                0.85
            )

        # 규칙 4: 느린 응답 + 낮은 정확도 → 레벨 감소
        if (speed_ratio > self.params["slow_response_ratio"] and
            accuracy < self.params["slow_accuracy_threshold"]):
            return (
                current_level - 1,
                AdjustmentReason.SLOW_RESPONSE_LOW_ACCURACY,
                0.8
            )

        # 규칙 5: 최적 성과 (70-85% 정답률, 적정 속도) → 유지
        if 0.7 <= accuracy <= 0.85 and 0.8 <= speed_ratio <= 1.2:
            return (
                current_level,
                AdjustmentReason.OPTIMAL_PERFORMANCE,
                0.9
            )

        # 기본: 변화 없음
        return (
            current_level,
            AdjustmentReason.NO_CHANGE_NEEDED,
            0.5
        )

    def _clamp_level_change(self, current_level: int, new_level: int) -> int:
        """레벨 변화를 1단계로 제한하고 1-5 범위 내로 유지"""
        max_increase = self.params["max_level_increase_per_step"]
        max_decrease = self.params["max_level_decrease_per_step"]

        if new_level > current_level:
            new_level = min(new_level, current_level + max_increase)
        elif new_level < current_level:
            new_level = max(new_level, current_level - max_decrease)

        # 1-5 범위 제한
        return max(1, min(5, new_level))

    def _create_manual_adjustment(
        self, current_level: int, manual_level: int
    ) -> FocusIntensityAdjustment:
        """수동 조절 결과 생성"""
        return FocusIntensityAdjustment(
            new_level=max(1, min(5, manual_level)),
            previous_level=current_level,
            level_changed=(manual_level != current_level),
            adjustment_reason=AdjustmentReason.MANUAL_OVERRIDE,
            confidence_score=1.0,
            recommendation="선생님이 집중 강도를 조절했습니다."
        )

    def _create_no_change(
        self, current_level: int, reason: AdjustmentReason, confidence: float
    ) -> FocusIntensityAdjustment:
        """변화 없음 결과 생성"""
        return FocusIntensityAdjustment(
            new_level=current_level,
            previous_level=current_level,
            level_changed=False,
            adjustment_reason=reason,
            confidence_score=confidence,
            recommendation="현재 집중 강도를 유지합니다."
        )

    def _generate_recommendation(
        self, previous_level: int, new_level: int, reason: AdjustmentReason
    ) -> str:
        """학생에게 보여줄 권장 메시지 생성"""
        if new_level > previous_level:
            messages = {
                AdjustmentReason.HIGH_ACCURACY_CONSECUTIVE_CORRECT:
                    "잘하고 있어요! 좀 더 도전적인 문제로 이동합니다. 🚀",
                AdjustmentReason.FAST_RESPONSE_HIGH_ACCURACY:
                    "빠르고 정확하네요! 난이도를 올려볼까요? 💪",
            }
            return messages.get(
                reason,
                f"집중 레벨이 {previous_level}에서 {new_level}로 올라갑니다!"
            )

        elif new_level < previous_level:
            messages = {
                AdjustmentReason.LOW_ACCURACY_CONSECUTIVE_INCORRECT:
                    "천천히 다시 시작해봐요. 조금 더 쉬운 문제로 연습해요. 😊",
                AdjustmentReason.SLOW_RESPONSE_LOW_ACCURACY:
                    "시간을 충분히 가지고 풀어봐요. 집중 강도를 낮췄어요. ⏰",
            }
            return messages.get(
                reason,
                f"집중 레벨이 {previous_level}에서 {new_level}로 내려갑니다."
            )

        else:
            messages = {
                AdjustmentReason.OPTIMAL_PERFORMANCE:
                    "완벽해요! 이 페이스를 유지하세요. ⭐",
                AdjustmentReason.NO_CHANGE_NEEDED:
                    "현재 집중 강도가 딱 맞아요. 계속 해봐요! 👍",
                AdjustmentReason.INSUFFICIENT_DATA:
                    "조금 더 문제를 풀어보면 최적의 집중 강도를 찾아드릴게요!",
                AdjustmentReason.MANUAL_OVERRIDE:
                    "선생님이 집중 강도를 조절했습니다.",
            }
            return messages.get(reason, "현재 집중 강도를 유지합니다.")


class FocusIntensityAnalyzer:
    """집중 강도 효과 분석"""

    @staticmethod
    def calculate_optimal_level(
        level_performances: List[Dict]
    ) -> Tuple[int, float]:
        """
        학생의 레벨별 성과 데이터를 분석하여 최적 레벨 추천

        Args:
            level_performances: [
                {
                    "level": 1,
                    "accuracy_rate": 0.95,
                    "avg_time_spent": 120,
                    "total_attempts": 20
                },
                ...
            ]

        Returns:
            (optimal_level, confidence_score)
        """
        if not level_performances:
            return 3, 0.0  # 기본값: 레벨 3

        # 각 레벨별 효율성 점수 계산
        scores = []
        for perf in level_performances:
            level = perf["level"]
            accuracy = perf["accuracy_rate"]
            time_spent = perf["avg_time_spent"]
            attempts = perf["total_attempts"]

            # 최소 시도 횟수 필터링 (신뢰도 확보)
            if attempts < 3:
                continue

            # 효율성 = (정확도 * 레벨) / 시간
            # 높은 레벨에서 높은 정확도를 유지하면 높은 점수
            efficiency = (accuracy * level) / max(time_spent, 1.0)

            # 정답률이 70% 이상인 레벨만 고려
            if accuracy >= 0.7:
                scores.append({
                    "level": level,
                    "efficiency": efficiency,
                    "accuracy": accuracy,
                    "attempts": attempts
                })

        if not scores:
            return 3, 0.0

        # 효율성이 가장 높은 레벨 선택
        best = max(scores, key=lambda x: x["efficiency"])
        optimal_level = best["level"]

        # 확신도 계산: 시도 횟수와 정확도 기반
        confidence = min(1.0, (best["attempts"] / 10) * best["accuracy"])

        return optimal_level, confidence

    @staticmethod
    def analyze_trends(
        session_history: List[Dict]
    ) -> Dict:
        """
        학생의 집중 강도 세션 히스토리 분석

        Args:
            session_history: [
                {
                    "timestamp": "2025-11-18T10:00:00Z",
                    "level": 3,
                    "is_correct": True,
                    "time_spent": 60
                },
                ...
            ]

        Returns:
            {
                "avg_level_trend": "increasing" | "decreasing" | "stable",
                "accuracy_trend": "improving" | "declining" | "stable",
                "engagement_score": 0.0-1.0,
                "consistency_score": 0.0-1.0
            }
        """
        if not session_history:
            return {
                "avg_level_trend": "stable",
                "accuracy_trend": "stable",
                "engagement_score": 0.0,
                "consistency_score": 0.0
            }

        # 시간순 정렬
        sessions = sorted(session_history, key=lambda x: x["timestamp"])

        # 레벨 추이 분석
        levels = [s["level"] for s in sessions]
        level_trend = FocusIntensityAnalyzer._calculate_trend(levels)

        # 정확도 추이 분석 (이동 평균)
        window_size = 5
        accuracies = []
        for i in range(len(sessions) - window_size + 1):
            window = sessions[i:i+window_size]
            acc = sum(1 for s in window if s.get("is_correct", False)) / window_size
            accuracies.append(acc)

        accuracy_trend = FocusIntensityAnalyzer._calculate_trend(accuracies) if accuracies else "stable"

        # 몰입도 점수: 평균 레벨과 정확도의 균형
        avg_level = statistics.mean(levels) if levels else 3.0
        avg_accuracy = statistics.mean(
            [1.0 if s.get("is_correct", False) else 0.0 for s in sessions]
        )
        engagement_score = (avg_level / 5.0) * avg_accuracy

        # 일관성 점수: 레벨과 정확도의 표준편차가 낮을수록 높음
        level_std = statistics.stdev(levels) if len(levels) > 1 else 0.0
        consistency_score = max(0.0, 1.0 - (level_std / 2.0))

        return {
            "avg_level_trend": level_trend,
            "accuracy_trend": accuracy_trend,
            "engagement_score": round(engagement_score, 2),
            "consistency_score": round(consistency_score, 2)
        }

    @staticmethod
    def _calculate_trend(values: List[float]) -> str:
        """값들의 추세 계산 (선형 회귀 기울기)"""
        if len(values) < 2:
            return "stable"

        # 간단한 선형 회귀 (최소자승법)
        n = len(values)
        x = list(range(n))
        y = values

        x_mean = statistics.mean(x)
        y_mean = statistics.mean(y)

        numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return "stable"

        slope = numerator / denominator

        # 기울기 기준으로 추세 판단
        if slope > 0.1:
            return "increasing"
        elif slope < -0.1:
            return "decreasing"
        else:
            return "stable"


# ============================================================================
# 사용 예시
# ============================================================================

if __name__ == "__main__":
    # 예시 1: 집중 강도 조절 계산
    print("=" * 60)
    print("예시 1: 집중 강도 자동 조절")
    print("=" * 60)

    algorithm = FocusIntensityAlgorithm()

    # 학생이 현재 레벨 3에서 문제를 잘 풀고 있는 상황
    performance = PerformanceData(
        recent_accuracy=0.92,  # 최근 5개 중 4.6개 정답 (92%)
        avg_response_time=45.0,  # 평균 45초
        expected_response_time=60.0,  # 예상 60초
        consecutive_correct=3,  # 3개 연속 정답
        consecutive_incorrect=0,
        total_attempts=15,
        hints_used_avg=0.5
    )

    adjustment = algorithm.calculate_adjustment(
        current_level=3,
        problem_difficulty=3,
        performance=performance
    )

    print(f"현재 레벨: {adjustment.previous_level}")
    print(f"새 레벨: {adjustment.new_level}")
    print(f"레벨 변경: {adjustment.level_changed}")
    print(f"조절 이유: {adjustment.adjustment_reason.value}")
    print(f"확신도: {adjustment.confidence_score * 100:.1f}%")
    print(f"메시지: {adjustment.recommendation}")

    print()

    # 예시 2: 학생이 어려워하는 상황
    print("=" * 60)
    print("예시 2: 학생이 연속 오답 중")
    print("=" * 60)

    performance_struggling = PerformanceData(
        recent_accuracy=0.4,  # 40% 정답률
        avg_response_time=150.0,  # 평균 150초 (느림)
        expected_response_time=60.0,
        consecutive_correct=0,
        consecutive_incorrect=2,  # 2개 연속 오답
        total_attempts=10,
        hints_used_avg=2.5
    )

    adjustment2 = algorithm.calculate_adjustment(
        current_level=3,
        problem_difficulty=3,
        performance=performance_struggling
    )

    print(f"현재 레벨: {adjustment2.previous_level}")
    print(f"새 레벨: {adjustment2.new_level}")
    print(f"레벨 변경: {adjustment2.level_changed}")
    print(f"조절 이유: {adjustment2.adjustment_reason.value}")
    print(f"확신도: {adjustment2.confidence_score * 100:.1f}%")
    print(f"메시지: {adjustment2.recommendation}")

    print()

    # 예시 3: 최적 레벨 분석
    print("=" * 60)
    print("예시 3: 학생별 최적 레벨 추천")
    print("=" * 60)

    level_performances = [
        {"level": 1, "accuracy_rate": 0.95, "avg_time_spent": 120, "total_attempts": 20},
        {"level": 2, "accuracy_rate": 0.92, "avg_time_spent": 100, "total_attempts": 25},
        {"level": 3, "accuracy_rate": 0.78, "avg_time_spent": 90, "total_attempts": 30},
        {"level": 4, "accuracy_rate": 0.65, "avg_time_spent": 80, "total_attempts": 15},
        {"level": 5, "accuracy_rate": 0.45, "avg_time_spent": 70, "total_attempts": 10},
    ]

    analyzer = FocusIntensityAnalyzer()
    optimal_level, confidence = analyzer.calculate_optimal_level(level_performances)

    print(f"추천 최적 레벨: {optimal_level}")
    print(f"확신도: {confidence * 100:.1f}%")
    print(f"분석: 레벨 {optimal_level}에서 가장 효율적으로 학습하고 있습니다.")

    print()

    # 예시 4: 추세 분석
    print("=" * 60)
    print("예시 4: 학습 추세 분석")
    print("=" * 60)

    session_history = [
        {"timestamp": "2025-11-18T10:00:00Z", "level": 2, "is_correct": True, "time_spent": 60},
        {"timestamp": "2025-11-18T10:05:00Z", "level": 2, "is_correct": True, "time_spent": 55},
        {"timestamp": "2025-11-18T10:10:00Z", "level": 3, "is_correct": True, "time_spent": 50},
        {"timestamp": "2025-11-18T10:15:00Z", "level": 3, "is_correct": False, "time_spent": 70},
        {"timestamp": "2025-11-18T10:20:00Z", "level": 3, "is_correct": True, "time_spent": 45},
        {"timestamp": "2025-11-18T10:25:00Z", "level": 3, "is_correct": True, "time_spent": 40},
        {"timestamp": "2025-11-18T10:30:00Z", "level": 4, "is_correct": True, "time_spent": 50},
    ]

    trends = analyzer.analyze_trends(session_history)

    print(f"평균 레벨 추세: {trends['avg_level_trend']}")
    print(f"정확도 추세: {trends['accuracy_trend']}")
    print(f"몰입도 점수: {trends['engagement_score'] * 100:.1f}%")
    print(f"일관성 점수: {trends['consistency_score'] * 100:.1f}%")
