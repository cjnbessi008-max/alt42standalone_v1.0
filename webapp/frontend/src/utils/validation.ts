import { ValidationError, ValidationResult } from '../types';

/**
 * 괄호 균형 검증
 * 지원 괄호: (), [], {}
 */
export function validateBrackets(input: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const stack: string[] = [];
  const pairs: { [key: string]: string } = {
    ')': '(',
    ']': '[',
    '}': '{'
  };
  const opening = ['(', '[', '{'];
  const closing = [')', ']', '}'];

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (opening.includes(char)) {
      stack.push(char);
    } else if (closing.includes(char)) {
      if (stack.length === 0) {
        errors.push({
          field: 'answer',
          message: `위치 ${i + 1}에서 여는 괄호 없이 닫는 괄호 '${char}'가 있습니다.`,
          type: 'bracket'
        });
        return errors;
      }

      const lastOpening = stack.pop();
      if (lastOpening !== pairs[char]) {
        errors.push({
          field: 'answer',
          message: `위치 ${i + 1}에서 괄호 짝이 맞지 않습니다. '${lastOpening}'를 닫아야 하는데 '${char}'가 있습니다.`,
          type: 'bracket'
        });
        return errors;
      }
    }
  }

  if (stack.length > 0) {
    errors.push({
      field: 'answer',
      message: `닫히지 않은 괄호가 있습니다: ${stack.join(', ')}`,
      type: 'bracket'
    });
  }

  return errors;
}

/**
 * 부호 검증
 * - 연속된 부호 체크 (예: ++, --, +-)
 * - 끝에 부호가 오는지 체크
 * - 시작에 부호가 올 수 있음 (음수 표현)
 */
export function validateSigns(input: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // 연속된 연산자 체크 (단, 괄호 앞뒤는 허용)
  const consecutiveOps = /[+\-×÷*\/]{2,}/g;
  let match;
  while ((match = consecutiveOps.exec(input)) !== null) {
    // 음수 표현 허용: +(- 또는 -(- 또는 ×(- 등
    const prevChar = match.index > 0 ? input[match.index - 1] : '';
    const nextChar = match.index + match[0].length < input.length
      ? input[match.index + match[0].length]
      : '';

    if (!(prevChar === '(' && (match[0][0] === '+' || match[0][0] === '-'))) {
      errors.push({
        field: 'answer',
        message: `위치 ${match.index + 1}에서 연속된 연산자가 있습니다: "${match[0]}"`,
        type: 'sign'
      });
    }
  }

  // 끝에 연산자가 오는지 체크
  if (/[+\-×÷*\/]$/.test(input.trim())) {
    errors.push({
      field: 'answer',
      message: '수식이 연산자로 끝날 수 없습니다.',
      type: 'sign'
    });
  }

  // 괄호 바로 뒤에 연산자가 없는지 체크 (숫자가 와야 함)
  const invalidAfterClosing = /\)[+\-×÷*\/]\(/g;
  if (invalidAfterClosing.test(input)) {
    // 이것은 실제로 유효함 (예: (2+3)+(4+5))
    // 체크 제거
  }

  return errors;
}

/**
 * 기본 포맷 검증
 * - 허용된 문자만 포함되어 있는지
 * - 빈 입력 체크
 */
export function validateFormat(input: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input || input.trim().length === 0) {
    errors.push({
      field: 'answer',
      message: '답안을 입력해주세요.',
      type: 'format'
    });
    return errors;
  }

  // 허용된 문자: 숫자, 연산자(+, -, ×, ÷, *, /), 괄호, 공백, 소수점
  const allowedPattern = /^[0-9+\-×÷*/()[\]{}\s.]+$/;
  if (!allowedPattern.test(input)) {
    errors.push({
      field: 'answer',
      message: '허용되지 않은 문자가 포함되어 있습니다. 숫자, 연산자(+, -, ×, ÷), 괄호만 사용 가능합니다.',
      type: 'format'
    });
  }

  return errors;
}

/**
 * 전체 검증 실행
 */
export function validateAnswer(answer: string): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. 포맷 검증
  const formatErrors = validateFormat(answer);
  if (formatErrors.length > 0) {
    return { isValid: false, errors: formatErrors };
  }

  // 2. 괄호 검증
  const bracketErrors = validateBrackets(answer);
  errors.push(...bracketErrors);

  // 3. 부호 검증
  const signErrors = validateSigns(answer);
  errors.push(...signErrors);

  return {
    isValid: errors.length === 0,
    errors
  };
}
