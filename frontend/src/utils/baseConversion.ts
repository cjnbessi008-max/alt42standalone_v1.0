import type { BaseType, ConversionStep } from '../types';

/**
 * 진법 변환 유틸리티 함수
 */

/**
 * 숫자를 특정 진법으로 변환
 */
export function convertToBase(value: number, targetBase: BaseType): string {
  if (targetBase === 10) {
    return value.toString();
  } else if (targetBase === 2) {
    return value.toString(2);
  } else if (targetBase === 16) {
    return value.toString(16).toUpperCase();
  }
  return value.toString();
}

/**
 * 특정 진법의 문자열을 10진수로 변환
 */
export function parseFromBase(value: string, sourceBase: BaseType): number {
  return parseInt(value, sourceBase);
}

/**
 * 진법 이름 반환
 */
export function getBaseName(base: BaseType): string {
  switch (base) {
    case 2:
      return '2진수 (Binary)';
    case 10:
      return '10진수 (Decimal)';
    case 16:
      return '16진수 (Hexadecimal)';
    default:
      return `${base}진수`;
  }
}

/**
 * 진법 접두어 반환
 */
export function getBasePrefix(base: BaseType): string {
  switch (base) {
    case 2:
      return '0b';
    case 10:
      return '';
    case 16:
      return '0x';
    default:
      return '';
  }
}

/**
 * 진법 변환 단계별 설명 생성
 */
export function generateConversionSteps(
  sourceValue: string,
  sourceBase: BaseType,
  targetBase: BaseType
): ConversionStep[] {
  const steps: ConversionStep[] = [];
  const decimalValue = parseFromBase(sourceValue, sourceBase);

  // Step 1: 원본 값 표시
  steps.push({
    id: 1,
    description: `원본 값: ${getBaseName(sourceBase)}`,
    value: `${getBasePrefix(sourceBase)}${sourceValue}`,
    base: sourceBase,
  });

  // Step 2: 10진수로 변환 (source가 10진수가 아닌 경우)
  if (sourceBase !== 10) {
    const explanation = generateDecimalConversionExplanation(sourceValue, sourceBase);
    steps.push({
      id: 2,
      description: '10진수로 변환',
      formula: explanation,
      value: decimalValue.toString(),
      base: 10,
    });
  }

  // Step 3: 목표 진법으로 변환 (target이 10진수가 아닌 경우)
  if (targetBase !== 10) {
    const targetValue = convertToBase(decimalValue, targetBase);
    const explanation = generateBaseConversionExplanation(decimalValue, targetBase);
    steps.push({
      id: steps.length + 1,
      description: `${getBaseName(targetBase)}로 변환`,
      formula: explanation,
      value: `${getBasePrefix(targetBase)}${targetValue}`,
      base: targetBase,
    });
  } else {
    // 이미 10진수로 변환했으므로 결과 표시
    steps.push({
      id: steps.length + 1,
      description: '변환 완료',
      value: decimalValue.toString(),
      base: 10,
    });
  }

  return steps;
}

/**
 * N진수 -> 10진수 변환 설명 생성
 */
function generateDecimalConversionExplanation(value: string, base: BaseType): string {
  const digits = value.split('').reverse();
  const parts: string[] = [];

  digits.forEach((digit, index) => {
    const digitValue = parseInt(digit, base);
    parts.push(`${digit} × ${base}^${index}`);
  });

  return parts.reverse().join(' + ');
}

/**
 * 10진수 -> N진수 변환 설명 생성
 */
function generateBaseConversionExplanation(decimal: number, targetBase: BaseType): string {
  const steps: string[] = [];
  let remaining = decimal;

  while (remaining > 0) {
    const quotient = Math.floor(remaining / targetBase);
    const remainder = remaining % targetBase;
    steps.push(`${remaining} ÷ ${targetBase} = ${quotient} ... ${remainder}`);
    remaining = quotient;
  }

  return steps.join('\n');
}

/**
 * 값이 유효한 진법 문자열인지 검증
 */
export function isValidBaseString(value: string, base: BaseType): boolean {
  try {
    const parsed = parseInt(value, base);
    return !isNaN(parsed) && parsed >= 0;
  } catch {
    return false;
  }
}
