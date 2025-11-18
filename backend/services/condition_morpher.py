"""
Condition Morphing Engine
학생 상태에 따라 점화식 조건을 실시간으로 변경
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime
from enum import Enum
import random

from backend.models.recurrence import (
    RecurrenceRelation,
    create_arithmetic_sequence,
    create_geometric_sequence,
    create_fibonacci_sequence,
    create_custom_linear_recurrence
)


class MorphTrigger(Enum):
    """조건 변경 트리거"""
    CONSECUTIVE_CORRECT = "consecutive_correct"
    CONSECUTIVE_WRONG = "consecutive_wrong"
    TIME_THRESHOLD = "time_threshold"
    PATTERN_MASTERY = "pattern_mastery"
    STRUGGLE_DETECTED = "struggle_detected"
    PROFICIENCY_LEVEL = "proficiency_level"
    MANUAL_ADJUSTMENT = "manual_adjustment"


@dataclass
class StudentAttempt:
    """학생 답안 시도"""
    timestamp: datetime
    problem_id: str
    answer: float
    expected_value: float
    is_correct: bool
    time_spent_seconds: int
    problem_expression: str = ""
    difficulty_level: int = 1


@dataclass
class StudentState:
    """학생의 현재 학습 상태"""
    student_id: str
    current_problem: RecurrenceRelation
    attempts: List[StudentAttempt] = field(default_factory=list)

    # 성과 지표
    consecutive_correct: int = 0
    consecutive_wrong: int = 0
    total_correct: int = 0
    total_attempts: int = 0

    # 시간 지표
    avg_response_time: float = 0.0
    last_attempt_time: Optional[datetime] = None

    # 숙련도 지표
    difficulty_level: int = 1  # 1-5
    mastery_score: float = 0.0  # 0.0-1.0

    # 메타데이터
    session_id: Optional[str] = None
    started_at: Optional[datetime] = None

    def __post_init__(self):
        if self.started_at is None:
            self.started_at = datetime.now()

    def update(self, attempt: StudentAttempt):
        """시도 기록 업데이트"""
        self.attempts.append(attempt)
        self.total_attempts += 1
        self.last_attempt_time = attempt.timestamp

        # 정답/오답 처리
        if attempt.is_correct:
            self.consecutive_correct += 1
            self.consecutive_wrong = 0
            self.total_correct += 1
        else:
            self.consecutive_wrong += 1
            self.consecutive_correct = 0

        # 평균 응답 시간 업데이트 (최근 10개 기준)
        recent_attempts = self.attempts[-10:]
        times = [a.time_spent_seconds for a in recent_attempts]
        self.avg_response_time = sum(times) / len(times)

        # 숙련도 점수 계산
        if self.total_attempts > 0:
            self.mastery_score = self.total_correct / self.total_attempts

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환"""
        return {
            'student_id': self.student_id,
            'consecutive_correct': self.consecutive_correct,
            'consecutive_wrong': self.consecutive_wrong,
            'total_correct': self.total_correct,
            'total_attempts': self.total_attempts,
            'avg_response_time': self.avg_response_time,
            'difficulty_level': self.difficulty_level,
            'mastery_score': self.mastery_score,
            'last_attempt_time': self.last_attempt_time.isoformat() if self.last_attempt_time else None
        }


@dataclass
class MorphRule:
    """Morphing 규칙"""
    id: Optional[str] = None
    name: str = ""
    trigger: MorphTrigger = MorphTrigger.CONSECUTIVE_CORRECT
    condition: Optional[Callable[[StudentState], bool]] = None
    transformation: Optional[Callable[[RecurrenceRelation], RecurrenceRelation]] = None
    priority: int = 0
    is_active: bool = True

    def evaluate(self, student_state: StudentState) -> bool:
        """조건 평가"""
        if not self.is_active or self.condition is None:
            return False
        return self.condition(student_state)

    def apply(self, problem: RecurrenceRelation) -> RecurrenceRelation:
        """변환 적용"""
        if self.transformation is None:
            return problem
        return self.transformation(problem)


class ConditionMorpher:
    """조건 변환 엔진"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.rules: List[MorphRule] = []
        self.event_handlers: List[Callable] = []

        # 기본 설정
        self.min_correct_threshold = self.config.get('min_correct_threshold', 3)
        self.min_wrong_threshold = self.config.get('min_wrong_threshold', 3)
        self.time_threshold_seconds = self.config.get('time_threshold_seconds', 120)
        self.mastery_threshold = self.config.get('mastery_threshold', 0.8)

        # 기본 규칙 초기화
        self._initialize_default_rules()

    def _initialize_default_rules(self):
        """기본 Morphing 규칙 설정"""

        # 규칙 1: N회 연속 정답 → 난이도 상승
        self.rules.append(MorphRule(
            name="Increase Difficulty on Consecutive Correct",
            trigger=MorphTrigger.CONSECUTIVE_CORRECT,
            condition=lambda state: state.consecutive_correct >= self.min_correct_threshold,
            transformation=self._increase_difficulty,
            priority=1
        ))

        # 규칙 2: N회 연속 오답 → 난이도 하락
        self.rules.append(MorphRule(
            name="Decrease Difficulty on Consecutive Wrong",
            trigger=MorphTrigger.CONSECUTIVE_WRONG,
            condition=lambda state: state.consecutive_wrong >= self.min_wrong_threshold,
            transformation=self._decrease_difficulty,
            priority=2
        ))

        # 규칙 3: 평균 응답 시간 초과 → 단순화
        self.rules.append(MorphRule(
            name="Simplify on Time Threshold",
            trigger=MorphTrigger.TIME_THRESHOLD,
            condition=lambda state: state.avg_response_time > self.time_threshold_seconds,
            transformation=self._simplify_problem,
            priority=3
        ))

        # 규칙 4: 숙련도 높음 → 난이도 상승
        self.rules.append(MorphRule(
            name="Increase on High Mastery",
            trigger=MorphTrigger.PATTERN_MASTERY,
            condition=lambda state: (
                state.mastery_score >= self.mastery_threshold
                and state.total_attempts >= 5
            ),
            transformation=self._increase_difficulty,
            priority=4
        ))

    def morph(
        self,
        current_problem: RecurrenceRelation,
        student_state: StudentState
    ) -> RecurrenceRelation:
        """
        학생 상태에 따라 문제 변형

        Args:
            current_problem: 현재 문제
            student_state: 학생 상태

        Returns:
            변형된 RecurrenceRelation (변경 없으면 원본 반환)
        """
        # 우선순위 순으로 규칙 평가
        for rule in sorted(self.rules, key=lambda r: r.priority):
            if rule.evaluate(student_state):
                # 변형 적용
                morphed = rule.apply(current_problem)

                # Morphing 발생 여부 확인
                if morphed.expression != current_problem.expression:
                    # 이벤트 발행
                    self._emit_morph_event({
                        'trigger': rule.trigger.value,
                        'rule_name': rule.name,
                        'student_id': student_state.student_id,
                        'original': current_problem.to_dict(),
                        'morphed': morphed.to_dict(),
                        'student_state_snapshot': student_state.to_dict(),
                        'occurred_at': datetime.now().isoformat()
                    })

                    return morphed

        # 변경 없음
        return current_problem

    def _increase_difficulty(self, problem: RecurrenceRelation) -> RecurrenceRelation:
        """
        난이도 증가 변환

        전략:
        1. 등차수열 → 등비수열
        2. 1차 → 2차 (피보나치 유형)
        3. 계수 증가
        4. 난이도 레벨 +1
        """
        current_tags = problem.concept_tags
        current_diff = problem.difficulty_level

        # 이미 최고 난이도면 변경 없음
        if current_diff >= 5:
            return problem

        # 등차수열이면 등비수열로
        if 'arithmetic' in current_tags and problem.order == 1:
            # 등차수열의 공차 추출 시도
            # a_n = a_{n-1} + d 형태
            import re
            match = re.search(r'a_\{n-1\}\s*\+\s*([\d.]+)', problem.expression)
            if match:
                common_diff = float(match.group(1))
                # 공차를 공비로 변환 (비율 유지)
                common_ratio = 1 + (common_diff / 10)  # 휴리스틱
                return create_geometric_sequence(
                    problem.initial_conditions.get(0, 1),
                    common_ratio
                )

        # 1차 → 2차 (피보나치)
        if problem.order == 1 and 'fibonacci' not in current_tags:
            return create_fibonacci_sequence()

        # 2차이면 계수 증가
        if problem.order == 2:
            # 일반 선형 점화식으로 변환
            coeffs = [1.5, 0.5]  # 더 복잡한 계수
            return create_custom_linear_recurrence(
                coeffs,
                problem.initial_conditions
            )

        # 기본: 난이도만 증가
        new_problem = RecurrenceRelation(**problem.__dict__)
        new_problem.difficulty_level = min(current_diff + 1, 5)
        return new_problem

    def _decrease_difficulty(self, problem: RecurrenceRelation) -> RecurrenceRelation:
        """
        난이도 감소 변환

        전략:
        1. 등비수열 → 등차수열
        2. 2차 → 1차
        3. 계수 감소
        4. 난이도 레벨 -1
        """
        current_tags = problem.concept_tags
        current_diff = problem.difficulty_level

        # 이미 최저 난이도면 변경 없음
        if current_diff <= 1:
            return problem

        # 등비수열이면 등차수열로
        if 'geometric' in current_tags and problem.order == 1:
            return create_arithmetic_sequence(
                problem.initial_conditions.get(0, 1),
                2  # 단순한 공차
            )

        # 2차이면 1차로
        if problem.order == 2:
            return create_arithmetic_sequence(
                problem.initial_conditions.get(0, 1),
                1  # 가장 단순한 등차수열
            )

        # 피보나치면 등차수열로
        if 'fibonacci' in current_tags:
            return create_arithmetic_sequence(1, 1)

        # 기본: 난이도만 감소
        new_problem = RecurrenceRelation(**problem.__dict__)
        new_problem.difficulty_level = max(current_diff - 1, 1)
        return new_problem

    def _simplify_problem(self, problem: RecurrenceRelation) -> RecurrenceRelation:
        """
        문제 단순화

        시간 초과 시 호출 - 더 쉬운 형태로 변환
        """
        # 계수를 작은 정수로 변경
        if problem.order == 1:
            # 등차수열로 단순화
            return create_arithmetic_sequence(1, 1)
        elif problem.order == 2:
            # 단순한 1차로
            return create_arithmetic_sequence(1, 2)

        # 난이도 대폭 감소
        new_problem = RecurrenceRelation(**problem.__dict__)
        new_problem.difficulty_level = max(problem.difficulty_level - 2, 1)
        return new_problem

    def add_rule(self, rule: MorphRule):
        """규칙 추가"""
        self.rules.append(rule)

    def remove_rule(self, rule_id: str):
        """규칙 제거"""
        self.rules = [r for r in self.rules if r.id != rule_id]

    def on_morph_event(self, handler: Callable[[Dict], None]):
        """Morphing 이벤트 핸들러 등록"""
        self.event_handlers.append(handler)

    def _emit_morph_event(self, event: Dict[str, Any]):
        """Morphing 이벤트 발행"""
        for handler in self.event_handlers:
            try:
                handler(event)
            except Exception as e:
                print(f"Error in morph event handler: {e}")

    def generate_problem_at_difficulty(
        self,
        difficulty: int,
        concept_preference: Optional[List[str]] = None
    ) -> RecurrenceRelation:
        """
        지정된 난이도의 문제 생성

        Args:
            difficulty: 난이도 (1-5)
            concept_preference: 선호 개념 태그 리스트

        Returns:
            생성된 RecurrenceRelation
        """
        if difficulty <= 1:
            # 단순 등차수열
            return create_arithmetic_sequence(
                random.randint(1, 5),
                random.randint(1, 3)
            )
        elif difficulty == 2:
            # 등비수열
            return create_geometric_sequence(
                random.randint(1, 3),
                random.uniform(1.5, 2.5)
            )
        elif difficulty == 3:
            # 피보나치
            return create_fibonacci_sequence()
        elif difficulty == 4:
            # 일반 2차 선형
            coeffs = [
                random.uniform(0.5, 2.0),
                random.uniform(0.5, 2.0)
            ]
            initials = {0: random.randint(1, 5), 1: random.randint(1, 5)}
            return create_custom_linear_recurrence(coeffs, initials)
        else:  # difficulty == 5
            # 복잡한 3차 선형
            coeffs = [
                random.uniform(0.5, 1.5),
                random.uniform(0.5, 1.5),
                random.uniform(0.5, 1.5)
            ]
            initials = {0: 1, 1: 1, 2: 2}
            return create_custom_linear_recurrence(coeffs, initials)

    def manual_morph(
        self,
        student_state: StudentState,
        target_difficulty: Optional[int] = None,
        target_concept: Optional[str] = None
    ) -> RecurrenceRelation:
        """
        수동 Morphing (교사용)

        Args:
            student_state: 학생 상태
            target_difficulty: 목표 난이도
            target_concept: 목표 개념 (arithmetic, geometric, fibonacci 등)

        Returns:
            변형된 문제
        """
        if target_difficulty is not None:
            new_problem = self.generate_problem_at_difficulty(target_difficulty)
        elif target_concept is not None:
            # 개념별 생성
            if target_concept == 'arithmetic':
                new_problem = create_arithmetic_sequence(1, 2)
            elif target_concept == 'geometric':
                new_problem = create_geometric_sequence(2, 2)
            elif target_concept == 'fibonacci':
                new_problem = create_fibonacci_sequence()
            else:
                new_problem = student_state.current_problem
        else:
            new_problem = student_state.current_problem

        # 수동 Morphing 이벤트 발행
        self._emit_morph_event({
            'trigger': MorphTrigger.MANUAL_ADJUSTMENT.value,
            'rule_name': 'Manual Teacher Adjustment',
            'student_id': student_state.student_id,
            'original': student_state.current_problem.to_dict(),
            'morphed': new_problem.to_dict(),
            'student_state_snapshot': student_state.to_dict(),
            'occurred_at': datetime.now().isoformat()
        })

        return new_problem
