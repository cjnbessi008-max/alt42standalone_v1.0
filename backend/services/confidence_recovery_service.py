"""
자동 난이도 조정 및 자신감 회복 서비스
Auto Difficulty Adjustment and Confidence Recovery Service
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import json


class AdjustmentType(Enum):
    """난이도 조정 타입"""
    UPWARD = "upward"
    DOWNWARD = "downward"
    RESET = "reset"


class TriggerReason(Enum):
    """난이도 조정 트리거 사유"""
    CONSECUTIVE_FAILURES = "consecutive_failures"
    LOW_ACCURACY = "low_accuracy"
    LOW_CONFIDENCE = "low_confidence"
    EXCESSIVE_TIME = "excessive_time"
    MANUAL = "manual"
    LMS_RECOMMENDATION = "lms_recommendation"


class RecoveryPhase(Enum):
    """회복 단계"""
    IMMEDIATE_DOWNWARD = "immediate_downward"
    GRADUAL_RETURN = "gradual_return"
    COMPLETED = "completed"


@dataclass
class StudentAttempt:
    """학생 시도 데이터"""
    is_correct: bool
    time_spent: int  # seconds
    attempted_at: datetime
    hint_used: bool = False


@dataclass
class StudentConfidenceData:
    """학생 신뢰도 데이터"""
    student_id: str
    module_id: str
    confidence_score: int
    current_difficulty: int
    original_difficulty: int
    consecutive_failures: int
    consecutive_successes: int
    total_attempts: int
    correct_attempts: int
    recent_attempts: List[StudentAttempt]
    in_recovery_mode: bool
    target_time_per_problem: int = 120  # 기본 2분


@dataclass
class RecoveryPathPhase:
    """회복 경로 단계"""
    phase: RecoveryPhase
    difficulty: int
    required_successes: int
    description: str


@dataclass
class RecoveryRecommendation:
    """회복 추천 데이터"""
    needs_intervention: bool
    current_confidence_score: int
    recommended_action: str
    recommended_difficulty: int
    current_difficulty: int
    trigger_reason: TriggerReason
    failure_count: int
    recovery_path: Optional[List[RecoveryPathPhase]]
    estimated_time_minutes: int


class ConfidenceScoreCalculator:
    """신뢰도 점수 계산기"""

    @staticmethod
    def calculate_confidence_score(
        previous_score: int,
        is_correct: bool,
        time_spent: int,
        target_time: int
    ) -> int:
        """
        신뢰도 점수 계산

        Args:
            previous_score: 이전 점수 (0-100)
            is_correct: 정답 여부
            time_spent: 소요 시간 (초)
            target_time: 목표 시간 (초)

        Returns:
            새로운 신뢰도 점수 (0-100)
        """
        # 기본 점수 (이전 점수의 90% 유지)
        base_score = previous_score * 0.9

        # 정답 여부에 따른 보너스/패널티
        correctness_bonus = 10 if is_correct else -15

        # 속도 보너스 (정답인 경우에만)
        speed_bonus = 0
        if is_correct:
            speed_ratio = (target_time - time_spent) / target_time
            speed_bonus = min(5, max(-5, speed_ratio * 10))

        # 새 점수 계산 (0-100 범위로 제한)
        new_score = base_score + correctness_bonus + speed_bonus
        return max(0, min(100, int(new_score)))

    @staticmethod
    def batch_update_score(
        initial_score: int,
        attempts: List[StudentAttempt],
        target_time: int = 120
    ) -> int:
        """
        여러 시도에 대해 점수를 일괄 업데이트

        Args:
            initial_score: 초기 점수
            attempts: 시도 목록
            target_time: 목표 시간 (초)

        Returns:
            최종 신뢰도 점수
        """
        current_score = initial_score
        for attempt in attempts:
            current_score = ConfidenceScoreCalculator.calculate_confidence_score(
                current_score,
                attempt.is_correct,
                attempt.time_spent,
                target_time
            )
        return current_score


class DifficultyAdjustmentAnalyzer:
    """난이도 조정 분석기"""

    # 조정 트리거 임계값
    CONSECUTIVE_FAILURE_THRESHOLD = 3
    LOW_ACCURACY_THRESHOLD = 0.3
    LOW_CONFIDENCE_THRESHOLD = 40
    EXCESSIVE_TIME_MULTIPLIER = 2.0

    @staticmethod
    def should_trigger_downward_adjustment(
        student_data: StudentConfidenceData
    ) -> Tuple[bool, Optional[TriggerReason]]:
        """
        난이도 하향 조정이 필요한지 판단

        Args:
            student_data: 학생 신뢰도 데이터

        Returns:
            (조정 필요 여부, 트리거 사유)
        """
        # 조건 1: 연속 오답
        if student_data.consecutive_failures >= DifficultyAdjustmentAnalyzer.CONSECUTIVE_FAILURE_THRESHOLD:
            return True, TriggerReason.CONSECUTIVE_FAILURES

        # 조건 2: 정답률 저하
        recent_attempts = student_data.recent_attempts[-10:]
        if len(recent_attempts) >= 5:
            accuracy = sum(1 for a in recent_attempts if a.is_correct) / len(recent_attempts)
            if accuracy < DifficultyAdjustmentAnalyzer.LOW_ACCURACY_THRESHOLD:
                return True, TriggerReason.LOW_ACCURACY

        # 조건 3: 신뢰도 점수 저하
        if student_data.confidence_score < DifficultyAdjustmentAnalyzer.LOW_CONFIDENCE_THRESHOLD:
            return True, TriggerReason.LOW_CONFIDENCE

        # 조건 4: 소요 시간 과다
        if len(recent_attempts) >= 3:
            avg_time = sum(a.time_spent for a in recent_attempts) / len(recent_attempts)
            if avg_time > student_data.target_time_per_problem * DifficultyAdjustmentAnalyzer.EXCESSIVE_TIME_MULTIPLIER:
                return True, TriggerReason.EXCESSIVE_TIME

        return False, None

    @staticmethod
    def calculate_target_difficulty(
        current_difficulty: int,
        trigger_reason: TriggerReason,
        confidence_score: int
    ) -> int:
        """
        목표 난이도 계산

        Args:
            current_difficulty: 현재 난이도 (1-5)
            trigger_reason: 트리거 사유
            confidence_score: 신뢰도 점수

        Returns:
            권장 난이도 (1-5)
        """
        # 기본 전략: 2단계 하향
        adjustment = -2

        # 사유에 따른 조정
        if trigger_reason == TriggerReason.CONSECUTIVE_FAILURES:
            # 연속 실패: 2단계 하향
            adjustment = -2
        elif trigger_reason == TriggerReason.LOW_CONFIDENCE:
            # 신뢰도 극저: 더 많이 하향
            if confidence_score < 30:
                adjustment = -3
            else:
                adjustment = -2
        elif trigger_reason == TriggerReason.LOW_ACCURACY:
            # 정답률 저조: 2단계 하향
            adjustment = -2
        elif trigger_reason == TriggerReason.EXCESSIVE_TIME:
            # 시간 과다: 1단계 하향 (이해도는 있으나 속도 문제)
            adjustment = -1

        target = current_difficulty + adjustment
        return max(1, min(5, target))


class RecoveryPathGenerator:
    """회복 경로 생성기"""

    @staticmethod
    def generate_recovery_path(
        current_difficulty: int,
        target_difficulty: int
    ) -> List[RecoveryPathPhase]:
        """
        목표 난이도로 단계적 복귀 경로 생성

        Args:
            current_difficulty: 현재 난이도
            target_difficulty: 목표(원래) 난이도

        Returns:
            회복 경로 단계 목록
        """
        path = []

        # 1단계: 즉시 하향 (2단계 낮춤)
        downward_difficulty = max(1, current_difficulty - 2)
        path.append(RecoveryPathPhase(
            phase=RecoveryPhase.IMMEDIATE_DOWNWARD,
            difficulty=downward_difficulty,
            required_successes=3,
            description=f'자신감 회복 단계 - 난이도 {downward_difficulty} 문제로 성공 경험 축적'
        ))

        # 2단계: 점진적 복귀
        current = downward_difficulty
        while current < target_difficulty:
            current += 1
            path.append(RecoveryPathPhase(
                phase=RecoveryPhase.GRADUAL_RETURN,
                difficulty=current,
                required_successes=2,
                description=f'난이도 {current}로 점진적 복귀'
            ))

        return path

    @staticmethod
    def estimate_recovery_time(recovery_path: List[RecoveryPathPhase]) -> int:
        """
        회복 예상 시간 계산 (분)

        Args:
            recovery_path: 회복 경로

        Returns:
            예상 소요 시간 (분)
        """
        total_problems = sum(phase.required_successes for phase in recovery_path)
        # 문제당 평균 2분 가정
        return total_problems * 2


class ConfidenceRecoveryService:
    """자신감 회복 서비스 메인 클래스"""

    def __init__(self):
        self.score_calculator = ConfidenceScoreCalculator()
        self.adjustment_analyzer = DifficultyAdjustmentAnalyzer()
        self.path_generator = RecoveryPathGenerator()

    def check_student_needs_intervention(
        self,
        student_data: StudentConfidenceData
    ) -> RecoveryRecommendation:
        """
        학생이 개입이 필요한지 확인하고 추천 생성

        Args:
            student_data: 학생 신뢰도 데이터

        Returns:
            회복 추천 데이터
        """
        # 난이도 조정 필요 여부 확인
        needs_adjustment, trigger_reason = self.adjustment_analyzer.should_trigger_downward_adjustment(
            student_data
        )

        if not needs_adjustment:
            return RecoveryRecommendation(
                needs_intervention=False,
                current_confidence_score=student_data.confidence_score,
                recommended_action="none",
                recommended_difficulty=student_data.current_difficulty,
                current_difficulty=student_data.current_difficulty,
                trigger_reason=None,
                failure_count=student_data.consecutive_failures,
                recovery_path=None,
                estimated_time_minutes=0
            )

        # 목표 난이도 계산
        target_difficulty = self.adjustment_analyzer.calculate_target_difficulty(
            student_data.current_difficulty,
            trigger_reason,
            student_data.confidence_score
        )

        # 회복 경로 생성
        recovery_path = self.path_generator.generate_recovery_path(
            student_data.current_difficulty,
            student_data.original_difficulty
        )

        # 예상 시간 계산
        estimated_time = self.path_generator.estimate_recovery_time(recovery_path)

        return RecoveryRecommendation(
            needs_intervention=True,
            current_confidence_score=student_data.confidence_score,
            recommended_action="difficulty_downward",
            recommended_difficulty=target_difficulty,
            current_difficulty=student_data.current_difficulty,
            trigger_reason=trigger_reason,
            failure_count=student_data.consecutive_failures,
            recovery_path=recovery_path,
            estimated_time_minutes=estimated_time
        )

    def update_confidence_after_attempt(
        self,
        student_data: StudentConfidenceData,
        attempt: StudentAttempt
    ) -> int:
        """
        시도 후 신뢰도 점수 업데이트

        Args:
            student_data: 학생 신뢰도 데이터
            attempt: 새로운 시도

        Returns:
            업데이트된 신뢰도 점수
        """
        new_score = self.score_calculator.calculate_confidence_score(
            student_data.confidence_score,
            attempt.is_correct,
            attempt.time_spent,
            student_data.target_time_per_problem
        )
        return new_score

    def should_progress_to_next_phase(
        self,
        current_phase: RecoveryPathPhase,
        recent_successes: int
    ) -> bool:
        """
        다음 회복 단계로 진행할 수 있는지 확인

        Args:
            current_phase: 현재 회복 단계
            recent_successes: 최근 성공 횟수

        Returns:
            진행 가능 여부
        """
        return recent_successes >= current_phase.required_successes

    def generate_recovery_problems(
        self,
        difficulty: int,
        count: int,
        module_id: str
    ) -> List[Dict]:
        """
        회복용 문제 생성 (AI 연동 부분은 추후 구현)

        Args:
            difficulty: 난이도
            count: 문제 개수
            module_id: 모듈 ID

        Returns:
            문제 목록
        """
        # 실제로는 AI 파이프라인과 연동하여 생성
        # 현재는 플레이스홀더
        return [
            {
                "id": f"recovery_prob_{i}",
                "difficulty": difficulty,
                "type": "confidence_boost",
                "module_id": module_id,
                "estimated_time": 120
            }
            for i in range(count)
        ]


class LMSIntegrationAnalyzer:
    """LMS 연동 분석기"""

    @staticmethod
    def analyze_lms_performance_data(
        lms_data: Dict
    ) -> Tuple[bool, Optional[str], Optional[int]]:
        """
        LMS 성과 데이터 분석

        Args:
            lms_data: LMS에서 받은 성과 데이터

        Returns:
            (개입 필요 여부, 사유, 권장 난이도)
        """
        # 점수 추세 분석
        scores = lms_data.get('recent_scores', [])
        if not scores or len(scores) < 3:
            return False, None, None

        # 평균 점수 계산
        avg_score = sum(scores) / len(scores)

        # 하향 추세 확인
        is_declining = all(
            scores[i] >= scores[i + 1]
            for i in range(len(scores) - 1)
        )

        # 개입 필요 판단
        if avg_score < 60 and is_declining:
            # 평균 60점 미만이고 하향 추세
            if avg_score < 40:
                return True, "severe_performance_decline", 2
            else:
                return True, "moderate_performance_decline", 3
        elif avg_score < 50:
            return True, "low_performance", 2

        return False, None, None

    @staticmethod
    def generate_lms_recommendation(
        lms_data: Dict,
        analysis_result: Tuple[bool, Optional[str], Optional[int]]
    ) -> Dict:
        """
        LMS 추천 데이터 생성

        Args:
            lms_data: LMS 원본 데이터
            analysis_result: 분석 결과

        Returns:
            추천 데이터
        """
        needs_intervention, reason, recommended_difficulty = analysis_result

        if not needs_intervention:
            return {
                "recommendation": "continue",
                "message": "학생이 정상적으로 학습 중입니다.",
                "details": {}
            }

        scores = lms_data.get('recent_scores', [])
        avg_score = sum(scores) / len(scores) if scores else 0

        return {
            "recommendation": "trigger_confidence_recovery",
            "message": "자신감 회복 모드 추천",
            "details": {
                "current_avg_score": round(avg_score, 1),
                "threshold": 60,
                "action": f"reduce_difficulty_to_level_{recommended_difficulty}",
                "reason": reason,
                "recommended_difficulty": recommended_difficulty,
                "estimated_recovery_time_minutes": 20,
                "teacher_notification_priority": "medium" if avg_score >= 40 else "high"
            }
        }


# ============================================
# 유틸리티 함수
# ============================================

def format_recovery_recommendation_for_ui(
    recommendation: RecoveryRecommendation
) -> Dict:
    """
    UI용 추천 데이터 포맷팅

    Args:
        recommendation: 회복 추천 데이터

    Returns:
        UI 친화적 포맷의 딕셔너리
    """
    if not recommendation.needs_intervention:
        return {
            "show_notification": False
        }

    return {
        "show_notification": True,
        "title": "💪 자신감 회복 모드 추천",
        "message": "최근 문제가 조금 어려웠나 봐요. 더 쉬운 문제로 자신감을 되찾아볼까요?",
        "current_difficulty": recommendation.current_difficulty,
        "recommended_difficulty": recommendation.recommended_difficulty,
        "trigger_reason_text": {
            TriggerReason.CONSECUTIVE_FAILURES: "연속 오답이 발생했습니다",
            TriggerReason.LOW_ACCURACY: "정답률이 낮아졌습니다",
            TriggerReason.LOW_CONFIDENCE: "자신감 점수가 낮습니다",
            TriggerReason.EXCESSIVE_TIME: "문제 풀이에 시간이 오래 걸리고 있습니다"
        }.get(recommendation.trigger_reason, "학습에 어려움이 감지되었습니다"),
        "estimated_time_text": f"약 {recommendation.estimated_time_minutes}분 소요",
        "recovery_path": [
            {
                "phase": phase.phase.value,
                "difficulty": phase.difficulty,
                "description": phase.description,
                "required_successes": phase.required_successes
            }
            for phase in (recommendation.recovery_path or [])
        ]
    }


# ============================================
# 테스트/예시 코드
# ============================================

if __name__ == "__main__":
    # 예시: 학생 데이터 생성
    sample_attempts = [
        StudentAttempt(is_correct=False, time_spent=180, attempted_at=datetime.now() - timedelta(minutes=10)),
        StudentAttempt(is_correct=False, time_spent=210, attempted_at=datetime.now() - timedelta(minutes=8)),
        StudentAttempt(is_correct=True, time_spent=150, attempted_at=datetime.now() - timedelta(minutes=6)),
        StudentAttempt(is_correct=False, time_spent=240, attempted_at=datetime.now() - timedelta(minutes=4)),
        StudentAttempt(is_correct=False, time_spent=200, attempted_at=datetime.now() - timedelta(minutes=2)),
    ]

    student_data = StudentConfidenceData(
        student_id="student_001",
        module_id="module_fractions",
        confidence_score=45,
        current_difficulty=4,
        original_difficulty=4,
        consecutive_failures=4,
        consecutive_successes=0,
        total_attempts=10,
        correct_attempts=3,
        recent_attempts=sample_attempts,
        in_recovery_mode=False,
        target_time_per_problem=120
    )

    # 서비스 초기화
    service = ConfidenceRecoveryService()

    # 개입 필요 여부 확인
    recommendation = service.check_student_needs_intervention(student_data)

    print("=== 자신감 회복 추천 결과 ===")
    print(f"개입 필요: {recommendation.needs_intervention}")
    print(f"현재 신뢰도 점수: {recommendation.current_confidence_score}")
    print(f"권장 조치: {recommendation.recommended_action}")
    print(f"현재 난이도: {recommendation.current_difficulty}")
    print(f"권장 난이도: {recommendation.recommended_difficulty}")
    print(f"트리거 사유: {recommendation.trigger_reason.value if recommendation.trigger_reason else 'N/A'}")
    print(f"예상 소요 시간: {recommendation.estimated_time_minutes}분")

    if recommendation.recovery_path:
        print("\n=== 회복 경로 ===")
        for i, phase in enumerate(recommendation.recovery_path, 1):
            print(f"{i}. {phase.description}")
            print(f"   난이도: {phase.difficulty}, 필요 성공 횟수: {phase.required_successes}")

    # UI 포맷 변환
    ui_data = format_recovery_recommendation_for_ui(recommendation)
    print("\n=== UI 데이터 ===")
    print(json.dumps(ui_data, indent=2, ensure_ascii=False))
