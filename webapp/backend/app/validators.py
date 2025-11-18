"""
답안 검증 모듈
부호와 괄호를 검증하는 함수들을 제공합니다.
"""
import re
from typing import List
from app.models import ValidationError, ValidationResult


def validate_brackets(input_str: str) -> List[ValidationError]:
    """
    괄호 균형 검증
    지원 괄호: (), [], {}

    Args:
        input_str: 검증할 문자열

    Returns:
        검증 오류 리스트
    """
    errors: List[ValidationError] = []
    stack: List[str] = []
    pairs = {')': '(', ']': '[', '}': '{'}
    opening = ['(', '[', '{']
    closing = [')', ']', '}']

    for i, char in enumerate(input_str):
        if char in opening:
            stack.append(char)
        elif char in closing:
            if not stack:
                errors.append(ValidationError(
                    field='answer',
                    message=f'위치 {i + 1}에서 여는 괄호 없이 닫는 괄호 "{char}"가 있습니다.',
                    type='bracket'
                ))
                return errors

            last_opening = stack.pop()
            if last_opening != pairs[char]:
                errors.append(ValidationError(
                    field='answer',
                    message=f'위치 {i + 1}에서 괄호 짝이 맞지 않습니다. "{last_opening}"를 닫아야 하는데 "{char}"가 있습니다.',
                    type='bracket'
                ))
                return errors

    if stack:
        errors.append(ValidationError(
            field='answer',
            message=f'닫히지 않은 괄호가 있습니다: {", ".join(stack)}',
            type='bracket'
        ))

    return errors


def validate_signs(input_str: str) -> List[ValidationError]:
    """
    부호 검증
    - 연속된 부호 체크 (예: ++, --, +-)
    - 끝에 부호가 오는지 체크
    - 시작에 부호가 올 수 있음 (음수 표현)

    Args:
        input_str: 검증할 문자열

    Returns:
        검증 오류 리스트
    """
    errors: List[ValidationError] = []

    # 연속된 연산자 체크 (단, 괄호 앞뒤는 허용)
    consecutive_ops = re.finditer(r'[+\-×÷*/]{2,}', input_str)
    for match in consecutive_ops:
        # 음수 표현 허용: +(- 또는 -(- 또는 ×(- 등
        prev_char = input_str[match.start() - 1] if match.start() > 0 else ''

        # 괄호 앞의 부호는 허용 (예: +(- 또는 ×(-)
        if not (prev_char == '(' and match.group()[0] in ['+', '-']):
            errors.append(ValidationError(
                field='answer',
                message=f'위치 {match.start() + 1}에서 연속된 연산자가 있습니다: "{match.group()}"',
                type='sign'
            ))

    # 끝에 연산자가 오는지 체크
    if re.search(r'[+\-×÷*/]$', input_str.strip()):
        errors.append(ValidationError(
            field='answer',
            message='수식이 연산자로 끝날 수 없습니다.',
            type='sign'
        ))

    return errors


def validate_format(input_str: str) -> List[ValidationError]:
    """
    기본 포맷 검증
    - 허용된 문자만 포함되어 있는지
    - 빈 입력 체크

    Args:
        input_str: 검증할 문자열

    Returns:
        검증 오류 리스트
    """
    errors: List[ValidationError] = []

    if not input_str or not input_str.strip():
        errors.append(ValidationError(
            field='answer',
            message='답안을 입력해주세요.',
            type='format'
        ))
        return errors

    # 허용된 문자: 숫자, 연산자(+, -, ×, ÷, *, /), 괄호, 공백, 소수점
    allowed_pattern = re.compile(r'^[0-9+\-×÷*/()[\]{}\s.]+$')
    if not allowed_pattern.match(input_str):
        errors.append(ValidationError(
            field='answer',
            message='허용되지 않은 문자가 포함되어 있습니다. 숫자, 연산자(+, -, ×, ÷), 괄호만 사용 가능합니다.',
            type='format'
        ))

    return errors


def validate_answer(answer: str) -> ValidationResult:
    """
    전체 검증 실행

    Args:
        answer: 검증할 답안

    Returns:
        검증 결과
    """
    errors: List[ValidationError] = []

    # 1. 포맷 검증
    format_errors = validate_format(answer)
    if format_errors:
        return ValidationResult(is_valid=False, errors=format_errors)

    # 2. 괄호 검증
    bracket_errors = validate_brackets(answer)
    errors.extend(bracket_errors)

    # 3. 부호 검증
    sign_errors = validate_signs(answer)
    errors.extend(sign_errors)

    return ValidationResult(
        is_valid=len(errors) == 0,
        errors=errors
    )
