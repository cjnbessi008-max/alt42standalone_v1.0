"""
검증 로직 테스트
"""
import pytest
from app.validators import (
    validate_brackets,
    validate_signs,
    validate_format,
    validate_answer
)


class TestBracketValidation:
    """괄호 검증 테스트"""

    def test_balanced_brackets(self):
        """정상적인 괄호 쌍"""
        assert len(validate_brackets("(2+3)")) == 0
        assert len(validate_brackets("[1+2]")) == 0
        assert len(validate_brackets("{5-3}")) == 0
        assert len(validate_brackets("((2+3)+(4+5))")) == 0
        assert len(validate_brackets("[(2+3)]")) == 0

    def test_unbalanced_brackets(self):
        """균형이 맞지 않는 괄호"""
        errors = validate_brackets("(2+3")
        assert len(errors) > 0
        assert errors[0].type == 'bracket'

        errors = validate_brackets("2+3)")
        assert len(errors) > 0
        assert errors[0].type == 'bracket'

    def test_mismatched_brackets(self):
        """짝이 맞지 않는 괄호"""
        errors = validate_brackets("(2+3]")
        assert len(errors) > 0
        assert errors[0].type == 'bracket'

        errors = validate_brackets("[2+3)")
        assert len(errors) > 0
        assert errors[0].type == 'bracket'

    def test_nested_brackets(self):
        """중첩된 괄호"""
        assert len(validate_brackets("((2+3)+(4+5))")) == 0
        assert len(validate_brackets("[(2+3)+(4+5)]")) == 0

        errors = validate_brackets("((2+3)")
        assert len(errors) > 0


class TestSignValidation:
    """부호 검증 테스트"""

    def test_valid_signs(self):
        """정상적인 부호 사용"""
        assert len(validate_signs("2+3")) == 0
        assert len(validate_signs("5-2")) == 0
        assert len(validate_signs("2×3")) == 0
        assert len(validate_signs("6÷2")) == 0
        assert len(validate_signs("2+3-4")) == 0
        assert len(validate_signs("-5+3")) == 0  # 음수

    def test_consecutive_operators(self):
        """연속된 연산자"""
        errors = validate_signs("2++3")
        assert len(errors) > 0
        assert errors[0].type == 'sign'

        errors = validate_signs("2--3")
        assert len(errors) > 0

    def test_trailing_operator(self):
        """끝에 연산자"""
        errors = validate_signs("2+3+")
        assert len(errors) > 0
        assert errors[0].type == 'sign'

        errors = validate_signs("5-")
        assert len(errors) > 0

    def test_negative_numbers(self):
        """음수 표현"""
        # 괄호 안의 음수는 허용되어야 함
        result = validate_signs("(-5)")
        # 이 경우는 연속 연산자로 감지되지 않아야 함


class TestFormatValidation:
    """포맷 검증 테스트"""

    def test_valid_format(self):
        """정상적인 포맷"""
        assert len(validate_format("2+3")) == 0
        assert len(validate_format("(2+3)×5")) == 0
        assert len(validate_format("1/2+3/4")) == 0
        assert len(validate_format("2.5+3.7")) == 0

    def test_empty_input(self):
        """빈 입력"""
        errors = validate_format("")
        assert len(errors) > 0
        assert errors[0].type == 'format'

        errors = validate_format("   ")
        assert len(errors) > 0

    def test_invalid_characters(self):
        """허용되지 않은 문자"""
        errors = validate_format("2+3abc")
        assert len(errors) > 0
        assert errors[0].type == 'format'

        errors = validate_format("2+3!")
        assert len(errors) > 0


class TestFullValidation:
    """전체 검증 테스트"""

    def test_valid_answers(self):
        """정상적인 답안들"""
        result = validate_answer("2+3")
        assert result.is_valid is True
        assert len(result.errors) == 0

        result = validate_answer("(2+3)×5")
        assert result.is_valid is True

        result = validate_answer("1/2+3/4")
        assert result.is_valid is True

    def test_invalid_answers(self):
        """오류가 있는 답안들"""
        # 괄호 오류
        result = validate_answer("(2+3")
        assert result.is_valid is False
        assert len(result.errors) > 0

        # 부호 오류
        result = validate_answer("2++3")
        assert result.is_valid is False
        assert len(result.errors) > 0

        # 포맷 오류
        result = validate_answer("")
        assert result.is_valid is False
        assert len(result.errors) > 0

    def test_complex_expressions(self):
        """복잡한 수식"""
        result = validate_answer("((2+3)×(4-1))/5")
        assert result.is_valid is True

        result = validate_answer("[(2+3)×4]-[5÷(2-1)]")
        assert result.is_valid is True

    def test_multiple_errors(self):
        """여러 오류가 있는 경우"""
        result = validate_answer("(2++3")
        assert result.is_valid is False
        # 괄호 오류와 부호 오류 모두 감지되어야 함
