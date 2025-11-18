import { Inequality } from '../types';

/**
 * 부등식 문자열을 파싱하여 Inequality 객체로 변환
 * 지원 형식:
 * - x > 2
 * - x < 5
 * - x >= -3
 * - x <= 7
 * - -3 <= x < 5
 * - 2 < x <= 8
 */
export function parseInequality(expression: string): Inequality | null {
  try {
    // 공백 제거
    const cleaned = expression.replace(/\s+/g, '');

    // 범위 부등식 (예: -3 <= x < 5 또는 2 < x <= 8)
    const rangePattern = /^(-?\d+(?:\.\d+)?)(<=?|>=?)x(<=?|>=?)(-?\d+(?:\.\d+)?)$/;
    const rangeMatch = cleaned.match(rangePattern);

    if (rangeMatch) {
      const [, leftValue, leftOp, rightOp, rightValue] = rangeMatch;

      return {
        id: crypto.randomUUID(),
        expression,
        type: 'range',
        leftBound: parseFloat(leftValue),
        rightBound: parseFloat(rightValue),
        includeLeft: leftOp.includes('='),
        includeRight: rightOp.includes('='),
      };
    }

    // 단순 부등식 (예: x > 2, x <= 5)
    const simplePattern = /^x(<=?|>=?|<|>)(-?\d+(?:\.\d+)?)$/;
    const simpleMatch = cleaned.match(simplePattern);

    if (simpleMatch) {
      const [, operator, value] = simpleMatch;
      const numValue = parseFloat(value);

      let type: Inequality['type'];
      let leftBound: number | undefined;
      let rightBound: number | undefined;
      let includeLeft: boolean | undefined;
      let includeRight: boolean | undefined;

      switch (operator) {
        case '>':
          type = 'greater';
          leftBound = numValue;
          includeLeft = false;
          break;
        case '>=':
          type = 'greaterEqual';
          leftBound = numValue;
          includeLeft = true;
          break;
        case '<':
          type = 'less';
          rightBound = numValue;
          includeRight = false;
          break;
        case '<=':
          type = 'lessEqual';
          rightBound = numValue;
          includeRight = true;
          break;
        default:
          return null;
      }

      return {
        id: crypto.randomUUID(),
        expression,
        type,
        leftBound,
        rightBound,
        includeLeft,
        includeRight,
      };
    }

    // 역순 단순 부등식 (예: 2 < x, 5 >= x)
    const reversePattern = /^(-?\d+(?:\.\d+)?)(<=?|>=?|<|>)x$/;
    const reverseMatch = cleaned.match(reversePattern);

    if (reverseMatch) {
      const [, value, operator] = reverseMatch;
      const numValue = parseFloat(value);

      // 연산자 반전
      const reversedOp = operator
        .replace('>', '_TEMP_')
        .replace('<', '>')
        .replace('_TEMP_', '<');

      let type: Inequality['type'];
      let leftBound: number | undefined;
      let rightBound: number | undefined;
      let includeLeft: boolean | undefined;
      let includeRight: boolean | undefined;

      switch (reversedOp) {
        case '>':
          type = 'greater';
          leftBound = numValue;
          includeLeft = false;
          break;
        case '>=':
          type = 'greaterEqual';
          leftBound = numValue;
          includeLeft = true;
          break;
        case '<':
          type = 'less';
          rightBound = numValue;
          includeRight = false;
          break;
        case '<=':
          type = 'lessEqual';
          rightBound = numValue;
          includeRight = true;
          break;
        default:
          return null;
      }

      return {
        id: crypto.randomUUID(),
        expression,
        type,
        leftBound,
        rightBound,
        includeLeft,
        includeRight,
      };
    }

    return null;
  } catch (error) {
    console.error('Failed to parse inequality:', error);
    return null;
  }
}

/**
 * 주어진 x 값이 부등식을 만족하는지 확인
 */
export function satisfiesInequality(x: number, inequality: Inequality): boolean {
  const { type, leftBound, rightBound, includeLeft, includeRight } = inequality;

  switch (type) {
    case 'greater':
      return x > (leftBound ?? -Infinity);
    case 'greaterEqual':
      return x >= (leftBound ?? -Infinity);
    case 'less':
      return x < (rightBound ?? Infinity);
    case 'lessEqual':
      return x <= (rightBound ?? Infinity);
    case 'range':
      const leftCheck = includeLeft
        ? x >= (leftBound ?? -Infinity)
        : x > (leftBound ?? -Infinity);
      const rightCheck = includeRight
        ? x <= (rightBound ?? Infinity)
        : x < (rightBound ?? Infinity);
      return leftCheck && rightCheck;
    default:
      return false;
  }
}

/**
 * 부등식의 구간을 문자열로 표현
 */
export function getIntervalNotation(inequality: Inequality): string {
  const { type, leftBound, rightBound, includeLeft, includeRight } = inequality;

  switch (type) {
    case 'greater':
      return `(${leftBound}, ∞)`;
    case 'greaterEqual':
      return `[${leftBound}, ∞)`;
    case 'less':
      return `(-∞, ${rightBound})`;
    case 'lessEqual':
      return `(-∞, ${rightBound}]`;
    case 'range':
      const leftBracket = includeLeft ? '[' : '(';
      const rightBracket = includeRight ? ']' : ')';
      return `${leftBracket}${leftBound}, ${rightBound}${rightBracket}`;
    default:
      return '';
  }
}
