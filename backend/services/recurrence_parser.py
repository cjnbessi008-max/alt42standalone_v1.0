"""
Recurrence Relation Parser
점화식 파싱 및 분석
"""

import re
from typing import Dict, List, Optional, Tuple
from backend.models.recurrence import RecurrenceRelation


class RecurrenceParser:
    """점화식 파서"""

    def __init__(self):
        # 점화식 패턴
        self.recurrence_pattern = re.compile(r'a_\{n-(\d+)\}')
        self.explicit_pattern = re.compile(r'a_n\s*=\s*(.+)')

    def parse(
        self,
        expression: str,
        initial_conditions: Optional[Dict[int, float]] = None
    ) -> RecurrenceRelation:
        """
        점화식 문자열을 파싱

        Args:
            expression: 점화식 문자열 (예: "a_n = 2*a_{n-1} + 1")
            initial_conditions: 초기값 (없으면 자동 추론 시도)

        Returns:
            RecurrenceRelation 객체

        Raises:
            ValueError: 파싱 실패 시

        Examples:
            >>> parser = RecurrenceParser()
            >>> rec = parser.parse("a_n = 2*a_{n-1} + 1", {0: 1})
            >>> rec.order
            1
        """
        # 표현식 정규화
        expression = self._normalize_expression(expression)

        # 차수 결정
        order = self._extract_order(expression)

        # 초기값 검증
        if initial_conditions is None:
            initial_conditions = self._infer_initial_conditions(order)

        # 난이도 추정
        difficulty = self._estimate_difficulty(expression, order)

        # 개념 태그 추출
        tags = self._extract_concept_tags(expression, order)

        return RecurrenceRelation(
            expression=expression,
            order=order,
            initial_conditions=initial_conditions,
            difficulty_level=difficulty,
            concept_tags=tags
        )

    def _normalize_expression(self, expr: str) -> str:
        """표현식 정규화"""
        # 공백 제거
        expr = expr.strip()

        # a(n-1) → a_{n-1} 변환
        expr = re.sub(r'a\(n-(\d+)\)', r'a_{n-\1}', expr)

        # a[n-1] → a_{n-1} 변환
        expr = re.sub(r'a\[n-(\d+)\]', r'a_{n-\1}', expr)

        # a_n-1 → a_{n-1} 변환 (중괄호 없는 경우)
        expr = re.sub(r'a_n-(\d+)(?![}])', r'a_{n-\1}', expr)

        # 곱셈 기호 명시화: 2a → 2*a
        expr = re.sub(r'(\d)([a-z])', r'\1*\2', expr)

        # × → * 변환
        expr = expr.replace('×', '*')
        expr = expr.replace('÷', '/')

        # 거듭제곱 표기 변환: ^ → **
        expr = expr.replace('^', '**')

        return expr

    def _extract_order(self, expr: str) -> int:
        """
        점화식의 차수 추출

        Args:
            expr: 정규화된 표현식

        Returns:
            차수 (최대 재귀 깊이)
        """
        matches = self.recurrence_pattern.findall(expr)

        if not matches:
            # 재귀 항이 없으면 명시적 수식 (차수 0)
            return 0

        # 최대 offset 찾기
        offsets = [int(m) for m in matches]
        return max(offsets)

    def _infer_initial_conditions(self, order: int) -> Dict[int, float]:
        """
        초기값 자동 추론 (기본값)

        Args:
            order: 점화식 차수

        Returns:
            기본 초기값
        """
        # 기본값: 0부터 order-1까지 모두 1
        return {i: 1.0 for i in range(order)}

    def _estimate_difficulty(self, expr: str, order: int) -> int:
        """
        난이도 추정 (1-5)

        기준:
        - 차수가 높을수록 어려움
        - 비선형 항이 있으면 어려움
        - 조건부 로직이 있으면 어려움
        """
        difficulty = 1

        # 차수 기반
        difficulty += min(order, 2)  # +0~2

        # 비선형 패턴 검사
        if '**' in expr or '^' in expr:
            difficulty += 1  # 거듭제곱

        if '*a_' in expr and 'a_' in expr.split('*a_')[1]:
            difficulty += 1  # 곱셈 항 (a_n * a_m)

        # 조건부 로직
        if 'if' in expr.lower() or '?' in expr:
            difficulty += 1

        # 복잡한 함수
        complex_funcs = ['sin', 'cos', 'tan', 'log', 'exp', 'sqrt']
        if any(func in expr for func in complex_funcs):
            difficulty += 1

        return min(difficulty, 5)

    def _extract_concept_tags(self, expr: str, order: int) -> List[str]:
        """개념 태그 추출"""
        tags = []

        # 차수 기반 태그
        if order == 0:
            tags.append("explicit")
        elif order == 1:
            tags.append("first-order")
        elif order == 2:
            tags.append("second-order")
        else:
            tags.append(f"order-{order}")

        # 패턴 기반 태그
        # 등차수열: a_n = a_{n-1} + c
        if re.match(r'a_n\s*=\s*a_\{n-1\}\s*[+\-]\s*[\d.]+$', expr):
            tags.append("arithmetic")
            tags.append("linear")

        # 등비수열: a_n = a_{n-1} * c
        if re.match(r'a_n\s*=\s*a_\{n-1\}\s*\*\s*[\d.]+$', expr):
            tags.append("geometric")
            tags.append("exponential")

        # 피보나치: a_n = a_{n-1} + a_{n-2}
        if re.match(r'a_n\s*=\s*a_\{n-1\}\s*\+\s*a_\{n-2\}$', expr):
            tags.append("fibonacci")
            tags.append("classic")

        # 선형 점화식
        if order > 0 and '**' not in expr and '^' not in expr:
            if '*a_' not in expr or expr.count('*a_') == expr.count('a_') - 1:
                tags.append("linear")

        # 비선형
        if '**' in expr or '^' in expr or ('*a_' in expr and expr.count('*') > 1):
            tags.append("non-linear")

        # 동차 vs 비동차
        # 비동차: 상수항이 있음
        rhs = expr.split('=')[1] if '=' in expr else expr
        # 단순 휴리스틱: + 또는 - 뒤에 숫자만 있으면 상수항
        if re.search(r'[+\-]\s*\d+(?:\.\d+)?(?:\s|$)', rhs):
            tags.append("non-homogeneous")
        else:
            tags.append("homogeneous")

        return tags

    def parse_initial_conditions_str(self, init_str: str) -> Dict[int, float]:
        """
        초기값 문자열 파싱

        Args:
            init_str: 초기값 문자열 (예: "a_0=1, a_1=1" 또는 "{0:1, 1:1}")

        Returns:
            초기값 딕셔너리
        """
        initial_conditions = {}

        # JSON 형식
        if init_str.strip().startswith('{'):
            import json
            try:
                data = json.loads(init_str)
                return {int(k): float(v) for k, v in data.items()}
            except Exception:
                pass

        # a_0=1, a_1=1 형식
        pattern = r'a_(\d+)\s*=\s*([\d.]+)'
        matches = re.finditer(pattern, init_str)

        for match in matches:
            index = int(match.group(1))
            value = float(match.group(2))
            initial_conditions[index] = value

        return initial_conditions

    def validate_expression(self, expr: str) -> Tuple[bool, Optional[str]]:
        """
        표현식 유효성 검증

        Args:
            expr: 점화식 표현식

        Returns:
            (유효 여부, 에러 메시지)
        """
        # 기본 형식 검증
        if '=' not in expr:
            return False, "Expression must contain '=' sign"

        lhs, rhs = expr.split('=', 1)

        # 좌변 검증
        if 'a_n' not in lhs:
            return False, "Left-hand side must contain 'a_n'"

        # 우변 검증
        if not rhs.strip():
            return False, "Right-hand side is empty"

        # 재귀 항 순환 참조 검증
        order = self._extract_order(expr)
        if order == 0:
            # 명시적 수식은 a_{n-k} 없어야 함
            if self.recurrence_pattern.search(expr):
                return False, "Explicit formula should not contain recurrence terms"

        # 금지된 문자 검증 (보안)
        forbidden = ['import', '__', 'exec', 'eval', 'compile', 'open', 'file']
        if any(word in rhs.lower() for word in forbidden):
            return False, f"Expression contains forbidden keywords"

        return True, None


class MoodleFormulaConverter:
    """Moodle 수식을 표준 점화식으로 변환"""

    def convert(self, moodle_formula: str) -> RecurrenceRelation:
        """
        Moodle Formula를 RecurrenceRelation으로 변환

        Moodle Formula Examples:
        - {a} + {b} * n           → a_n = a + b*n (등차수열)
        - {a} * {r}^n             → a_n = a * r^n (등비수열)
        - {a_{n-1}} + {a_{n-2}}   → a_n = a_{n-1} + a_{n-2} (피보나치)

        Args:
            moodle_formula: Moodle 수식

        Returns:
            RecurrenceRelation 객체
        """
        # Moodle 변수 표기법 제거: {var} → var
        formula = re.sub(r'\{([^}]+)\}', r'\1', moodle_formula)

        # a_{n-k} 형태가 있으면 점화식
        parser = RecurrenceParser()

        # 'a_n =' 추가 (Moodle은 우변만 있음)
        if 'a_n' not in formula:
            formula = f"a_n = {formula}"

        # 파싱
        try:
            return parser.parse(formula)
        except Exception as e:
            # 파싱 실패 시 기본 명시적 수식으로 처리
            return RecurrenceRelation(
                expression=formula,
                order=0,
                initial_conditions={},
                difficulty_level=1,
                concept_tags=["moodle-import", "explicit"]
            )

    def extract_moodle_variables(self, moodle_formula: str) -> List[str]:
        """Moodle 수식에서 변수 추출"""
        pattern = r'\{([^}]+)\}'
        matches = re.findall(pattern, moodle_formula)
        return matches
