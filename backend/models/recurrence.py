"""
Recurrence Relation Models
점화식 데이터 모델 및 계산 로직
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime
import json
import re


@dataclass
class RecurrenceRelation:
    """점화식 데이터 모델"""

    id: Optional[str] = None
    expression: str = ""  # 수식 (예: "a_n = 2*a_{n-1} + 1")
    order: int = 1  # 차수 (재귀 깊이)
    initial_conditions: Dict[int, float] = field(default_factory=dict)  # 초기값 {0: 1, 1: 1}
    domain: str = "natural"  # "natural", "integer", "real"
    constraints: List[str] = field(default_factory=list)  # 제약 조건
    difficulty_level: int = 1  # 1-5
    concept_tags: List[str] = field(default_factory=list)  # ["fibonacci", "linear"]

    # 메타데이터
    name: str = ""
    description: str = ""
    moodle_question_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()

    def evaluate(self, n: int) -> float:
        """
        n번째 항 계산

        Args:
            n: 계산할 항의 인덱스

        Returns:
            계산된 값

        Raises:
            ValueError: 초기값이 부족하거나 n이 유효하지 않을 때
        """
        if n < 0:
            raise ValueError(f"n must be non-negative, got {n}")

        # 초기값 확인
        if n in self.initial_conditions:
            return self.initial_conditions[n]

        # 초기값이 충분한지 확인
        required_initials = list(range(self.order))
        for i in required_initials:
            if i not in self.initial_conditions:
                raise ValueError(f"Missing initial condition for index {i}")

        # 동적 프로그래밍으로 계산
        return self._compute(n)

    def _compute(self, n: int) -> float:
        """동적 프로그래밍으로 효율적 계산"""
        # 메모이제이션 테이블 초기화
        memo = self.initial_conditions.copy()

        # 초기값 이후부터 n까지 계산
        start_index = max(memo.keys()) + 1 if memo else 0

        for i in range(start_index, n + 1):
            # 수식 평가
            value = self._evaluate_expression(i, memo)
            memo[i] = value

        return memo[n]

    def _evaluate_expression(self, n: int, memo: Dict[int, float]) -> float:
        """
        주어진 인덱스에서 수식 평가

        Args:
            n: 현재 인덱스
            memo: 이전 계산 결과

        Returns:
            계산된 값
        """
        # 수식에서 우변 추출
        if '=' not in self.expression:
            raise ValueError(f"Invalid expression format: {self.expression}")

        rhs = self.expression.split('=')[1].strip()

        # a_{n-k} 형태를 실제 값으로 치환
        # 예: a_{n-1} → memo[n-1], a_{n-2} → memo[n-2]
        pattern = r'a_\{n-(\d+)\}'
        matches = re.finditer(pattern, rhs)

        replaced_expr = rhs
        for match in matches:
            offset = int(match.group(1))
            index = n - offset
            if index not in memo:
                raise ValueError(f"Cannot evaluate: memo[{index}] not available")
            replaced_expr = replaced_expr.replace(match.group(0), str(memo[index]))

        # a_n → n으로 치환
        replaced_expr = replaced_expr.replace('a_n', str(n))

        # n을 실제 값으로 치환 (단순 n 변수)
        replaced_expr = replaced_expr.replace('n', str(n))

        # 수식 평가 (안전한 eval 사용)
        try:
            result = self._safe_eval(replaced_expr)
            return float(result)
        except Exception as e:
            raise ValueError(f"Failed to evaluate expression '{replaced_expr}': {str(e)}")

    def _safe_eval(self, expr: str) -> float:
        """
        안전한 수식 평가

        허용된 연산자와 함수만 사용 가능
        """
        # 허용된 이름들
        safe_dict = {
            '__builtins__': {},
            'abs': abs,
            'min': min,
            'max': max,
            'pow': pow,
            'round': round,
        }

        # 수학 함수 추가
        import math
        for name in ['sqrt', 'sin', 'cos', 'tan', 'log', 'exp', 'floor', 'ceil']:
            safe_dict[name] = getattr(math, name)

        try:
            return eval(expr, safe_dict, {})
        except Exception as e:
            raise ValueError(f"Unsafe or invalid expression: {expr}") from e

    def to_dict(self) -> Dict[str, Any]:
        """딕셔너리로 변환 (JSON 직렬화용)"""
        return {
            'id': self.id,
            'expression': self.expression,
            'order': self.order,
            'initial_conditions': self.initial_conditions,
            'domain': self.domain,
            'constraints': self.constraints,
            'difficulty_level': self.difficulty_level,
            'concept_tags': self.concept_tags,
            'name': self.name,
            'description': self.description,
            'moodle_question_id': self.moodle_question_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'RecurrenceRelation':
        """딕셔너리로부터 생성"""
        # 날짜 파싱
        if data.get('created_at'):
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        if data.get('updated_at'):
            data['updated_at'] = datetime.fromisoformat(data['updated_at'])

        return cls(**data)

    def generate_sequence(self, length: int) -> List[float]:
        """
        수열의 처음 length개 항 생성

        Args:
            length: 생성할 항의 개수

        Returns:
            수열 리스트
        """
        sequence = []
        for i in range(length):
            sequence.append(self.evaluate(i))
        return sequence

    def __str__(self) -> str:
        """문자열 표현"""
        return f"RecurrenceRelation({self.expression}, order={self.order}, difficulty={self.difficulty_level})"

    def __repr__(self) -> str:
        return self.__str__()


# 점화식 유형별 팩토리 함수
def create_arithmetic_sequence(first_term: float, common_diff: float) -> RecurrenceRelation:
    """
    등차수열 생성

    Args:
        first_term: 첫 항 (a_0)
        common_diff: 공차 (d)

    Returns:
        등차수열 RecurrenceRelation
    """
    return RecurrenceRelation(
        expression=f"a_n = a_{{n-1}} + {common_diff}",
        order=1,
        initial_conditions={0: first_term},
        difficulty_level=1,
        concept_tags=["arithmetic", "linear"],
        name=f"Arithmetic Sequence (d={common_diff})",
        description=f"등차수열: 첫 항 {first_term}, 공차 {common_diff}"
    )


def create_geometric_sequence(first_term: float, common_ratio: float) -> RecurrenceRelation:
    """
    등비수열 생성

    Args:
        first_term: 첫 항 (a_0)
        common_ratio: 공비 (r)

    Returns:
        등비수열 RecurrenceRelation
    """
    return RecurrenceRelation(
        expression=f"a_n = a_{{n-1}} * {common_ratio}",
        order=1,
        initial_conditions={0: first_term},
        difficulty_level=2,
        concept_tags=["geometric", "exponential"],
        name=f"Geometric Sequence (r={common_ratio})",
        description=f"등비수열: 첫 항 {first_term}, 공비 {common_ratio}"
    )


def create_fibonacci_sequence() -> RecurrenceRelation:
    """
    피보나치 수열 생성

    Returns:
        피보나치 수열 RecurrenceRelation
    """
    return RecurrenceRelation(
        expression="a_n = a_{n-1} + a_{n-2}",
        order=2,
        initial_conditions={0: 0, 1: 1},
        difficulty_level=3,
        concept_tags=["fibonacci", "recursive", "classic"],
        name="Fibonacci Sequence",
        description="피보나치 수열: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)"
    )


def create_custom_linear_recurrence(
    coefficients: List[float],
    initial_conditions: Dict[int, float],
    constant: float = 0
) -> RecurrenceRelation:
    """
    일반 선형 점화식 생성

    Args:
        coefficients: 계수 리스트 [c1, c2, ...] → a_n = c1*a_{n-1} + c2*a_{n-2} + ...
        initial_conditions: 초기값
        constant: 상수항

    Returns:
        선형 점화식 RecurrenceRelation
    """
    order = len(coefficients)

    # 수식 생성
    terms = []
    for i, coeff in enumerate(coefficients, 1):
        if coeff != 0:
            term = f"{coeff}*a_{{n-{i}}}" if coeff != 1 else f"a_{{n-{i}}}"
            terms.append(term)

    if constant != 0:
        terms.append(str(constant))

    expression = "a_n = " + " + ".join(terms)

    return RecurrenceRelation(
        expression=expression,
        order=order,
        initial_conditions=initial_conditions,
        difficulty_level=min(3 + order, 5),
        concept_tags=["linear", "homogeneous" if constant == 0 else "non-homogeneous"],
        name=f"Linear Recurrence (order {order})",
        description=f"선형 점화식: {expression}"
    )
