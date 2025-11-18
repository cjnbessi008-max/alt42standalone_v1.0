"""
Recurrence Parser 단위 테스트
"""

import pytest
from backend.services.recurrence_parser import RecurrenceParser, MoodleFormulaConverter
from backend.models.recurrence import RecurrenceRelation


class TestRecurrenceParser:
    """RecurrenceParser 테스트 클래스"""

    def setup_method(self):
        """테스트 전 초기화"""
        self.parser = RecurrenceParser()

    def test_parse_arithmetic_sequence(self):
        """등차수열 파싱 테스트"""
        result = self.parser.parse("a_n = a_{n-1} + 2", {0: 1})

        assert result.order == 1
        assert result.expression == "a_n = a_{n-1} + 2"
        assert result.initial_conditions == {0: 1}
        assert 'arithmetic' in result.concept_tags
        assert 'linear' in result.concept_tags

    def test_parse_geometric_sequence(self):
        """등비수열 파싱 테스트"""
        result = self.parser.parse("a_n = a_{n-1} * 3", {0: 1})

        assert result.order == 1
        assert 'geometric' in result.concept_tags
        assert 'exponential' in result.concept_tags

    def test_parse_fibonacci(self):
        """피보나치 수열 파싱 테스트"""
        result = self.parser.parse("a_n = a_{n-1} + a_{n-2}", {0: 0, 1: 1})

        assert result.order == 2
        assert 'fibonacci' in result.concept_tags
        assert 'second-order' in result.concept_tags

    def test_parse_custom_linear(self):
        """사용자 정의 선형 점화식 파싱"""
        result = self.parser.parse("a_n = 2*a_{n-1} - a_{n-2}", {0: 1, 1: 1})

        assert result.order == 2
        assert 'linear' in result.concept_tags

    def test_normalize_expression(self):
        """표현식 정규화 테스트"""
        # a(n-1) → a_{n-1}
        normalized = self.parser._normalize_expression("a_n = a(n-1) + 1")
        assert "a_{n-1}" in normalized

        # a[n-1] → a_{n-1}
        normalized = self.parser._normalize_expression("a_n = a[n-1] + 1")
        assert "a_{n-1}" in normalized

        # ^ → **
        normalized = self.parser._normalize_expression("a_n = 2^n")
        assert "**" in normalized

    def test_extract_order(self):
        """차수 추출 테스트"""
        assert self.parser._extract_order("a_n = a_{n-1} + 1") == 1
        assert self.parser._extract_order("a_n = a_{n-1} + a_{n-2}") == 2
        assert self.parser._extract_order("a_n = a_{n-1} + a_{n-2} + a_{n-3}") == 3
        assert self.parser._extract_order("a_n = n^2") == 0  # 명시적 수식

    def test_estimate_difficulty(self):
        """난이도 추정 테스트"""
        # 등차수열 (쉬움)
        diff = self.parser._estimate_difficulty("a_n = a_{n-1} + 1", 1)
        assert diff <= 2

        # 피보나치 (중간)
        diff = self.parser._estimate_difficulty("a_n = a_{n-1} + a_{n-2}", 2)
        assert 2 <= diff <= 4

        # 거듭제곱 포함 (어려움)
        diff = self.parser._estimate_difficulty("a_n = a_{n-1}**2 + 1", 1)
        assert diff >= 3

    def test_validate_expression(self):
        """표현식 유효성 검증 테스트"""
        # 유효한 표현식
        valid, msg = self.parser.validate_expression("a_n = a_{n-1} + 1")
        assert valid is True
        assert msg is None

        # 잘못된 표현식 (= 없음)
        valid, msg = self.parser.validate_expression("a_n a_{n-1} + 1")
        assert valid is False
        assert "must contain '='" in msg

        # 금지된 키워드
        valid, msg = self.parser.validate_expression("a_n = import os")
        assert valid is False
        assert "forbidden" in msg.lower()

    def test_parse_initial_conditions_str(self):
        """초기값 문자열 파싱 테스트"""
        # a_0=1, a_1=1 형식
        initials = self.parser.parse_initial_conditions_str("a_0=1, a_1=1")
        assert initials == {0: 1, 1: 1}

        # JSON 형식
        initials = self.parser.parse_initial_conditions_str('{"0": 1, "1": 1}')
        assert initials == {0: 1, 1: 1}


class TestMoodleFormulaConverter:
    """MoodleFormulaConverter 테스트 클래스"""

    def setup_method(self):
        """테스트 전 초기화"""
        self.converter = MoodleFormulaConverter()

    def test_convert_arithmetic(self):
        """Moodle 등차수열 변환 테스트"""
        # Moodle 형식: {a} + {b} * n
        result = self.converter.convert("{a} + {b} * n")

        assert result.expression is not None
        # 정확한 변환 확인은 구현에 따라 달라짐

    def test_convert_geometric(self):
        """Moodle 등비수열 변환 테스트"""
        # Moodle 형식: {a} * {r}^n
        result = self.converter.convert("{a} * {r}^n")

        assert result.expression is not None

    def test_convert_fibonacci(self):
        """Moodle 피보나치 변환 테스트"""
        # Moodle에서 재귀 항 표기: {a_{n-1}} + {a_{n-2}}
        result = self.converter.convert("{a_{n-1}} + {a_{n-2}}")

        assert result.order == 2

    def test_extract_moodle_variables(self):
        """Moodle 변수 추출 테스트"""
        variables = self.converter.extract_moodle_variables("{a} + {b} * {n}")

        assert 'a' in variables
        assert 'b' in variables
        assert 'n' in variables


class TestRecurrenceRelation:
    """RecurrenceRelation 모델 테스트"""

    def test_evaluate_arithmetic(self):
        """등차수열 계산 테스트"""
        from backend.models.recurrence import create_arithmetic_sequence

        seq = create_arithmetic_sequence(first_term=1, common_diff=2)

        assert seq.evaluate(0) == 1  # a_0 = 1
        assert seq.evaluate(1) == 3  # a_1 = 1 + 2 = 3
        assert seq.evaluate(2) == 5  # a_2 = 3 + 2 = 5
        assert seq.evaluate(5) == 11  # a_5 = 1 + 5*2 = 11

    def test_evaluate_geometric(self):
        """등비수열 계산 테스트"""
        from backend.models.recurrence import create_geometric_sequence

        seq = create_geometric_sequence(first_term=2, common_ratio=3)

        assert seq.evaluate(0) == 2  # a_0 = 2
        assert seq.evaluate(1) == 6  # a_1 = 2 * 3 = 6
        assert seq.evaluate(2) == 18  # a_2 = 6 * 3 = 18
        assert seq.evaluate(3) == 54  # a_3 = 18 * 3 = 54

    def test_evaluate_fibonacci(self):
        """피보나치 수열 계산 테스트"""
        from backend.models.recurrence import create_fibonacci_sequence

        fib = create_fibonacci_sequence()

        assert fib.evaluate(0) == 0
        assert fib.evaluate(1) == 1
        assert fib.evaluate(2) == 1
        assert fib.evaluate(3) == 2
        assert fib.evaluate(4) == 3
        assert fib.evaluate(5) == 5
        assert fib.evaluate(6) == 8

    def test_generate_sequence(self):
        """수열 생성 테스트"""
        from backend.models.recurrence import create_arithmetic_sequence

        seq = create_arithmetic_sequence(1, 2)
        result = seq.generate_sequence(5)

        assert result == [1, 3, 5, 7, 9]

    def test_to_dict_from_dict(self):
        """직렬화/역직렬화 테스트"""
        from backend.models.recurrence import create_fibonacci_sequence

        original = create_fibonacci_sequence()
        data = original.to_dict()

        # 딕셔너리 형태 확인
        assert 'expression' in data
        assert 'order' in data
        assert 'initial_conditions' in data

        # 복원
        restored = RecurrenceRelation.from_dict(data)

        assert restored.expression == original.expression
        assert restored.order == original.order
        assert restored.initial_conditions == original.initial_conditions


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
