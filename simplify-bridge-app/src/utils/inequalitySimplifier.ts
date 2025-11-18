/**
 * Inequality Simplifier - Core Algorithm
 * 복잡한 부등식을 단계적으로 단순한 비교로 압축
 */

import type { SimplificationStep, InequalityProblem } from '../types';

/**
 * 부등식 파싱 및 정규화
 */
export function parseInequality(expression: string): {
  left: string;
  operator: string;
  right: string;
} {
  // 부등식 연산자 찾기 (<, >, <=, >=)
  const operators = ['<=', '>=', '<', '>'];

  for (const op of operators) {
    if (expression.includes(op)) {
      const [left, right] = expression.split(op).map(s => s.trim());
      return { left, operator: op, right };
    }
  }

  throw new Error('유효하지 않은 부등식입니다.');
}

/**
 * 표현식을 항으로 분해
 */
function parseTerms(expr: string): { coefficient: number; variable: string }[] {
  const terms: { coefficient: number; variable: string }[] = [];

  // 공백 제거
  expr = expr.replace(/\s+/g, '');

  // 항 분리 (+ 또는 - 기준)
  const matches = expr.match(/[+-]?[^+-]+/g) || [];

  for (const match of matches) {
    const trimmed = match.trim();

    // 상수항
    if (/^[+-]?\d+$/.test(trimmed)) {
      terms.push({ coefficient: parseInt(trimmed), variable: '' });
      continue;
    }

    // 변수항 (예: 2x, -3x, x)
    const varMatch = trimmed.match(/([+-]?\d*)(x|y|z)/i);
    if (varMatch) {
      const coef = varMatch[1] === '' ? 1 :
                   varMatch[1] === '+' ? 1 :
                   varMatch[1] === '-' ? -1 :
                   parseInt(varMatch[1]);
      terms.push({ coefficient: coef, variable: varMatch[2] });
    }
  }

  return terms;
}

/**
 * 부등식을 단계적으로 단순화
 */
export function simplifyInequality(expression: string): SimplificationStep[] {
  const steps: SimplificationStep[] = [];
  let stepId = 0;

  try {
    // 초기 부등식 파싱
    let { left, operator, right } = parseInequality(expression);

    // Step 0: 원래 부등식
    steps.push({
      id: stepId++,
      expression: `${left} ${operator} ${right}`,
      latex: expressionToLatex(`${left} ${operator} ${right}`),
      explanation: '원래 부등식',
      operation: '문제 시작',
      isSimplified: false,
    });

    // 좌변과 우변의 항 파싱
    let leftTerms = parseTerms(left);
    let rightTerms = parseTerms(right);

    // Step 1: 상수항 우변으로 이동
    const leftConstants = leftTerms.filter(t => t.variable === '');
    const leftVars = leftTerms.filter(t => t.variable !== '');

    if (leftConstants.length > 0) {
      const constantSum = leftConstants.reduce((sum, t) => sum + t.coefficient, 0);

      if (constantSum !== 0) {
        // 우변에 상수 추가
        rightTerms.push({ coefficient: -constantSum, variable: '' });
        leftTerms = leftVars;

        const newLeft = termsToString(leftTerms);
        const newRight = termsToString(rightTerms);

        steps.push({
          id: stepId++,
          expression: `${newLeft} ${operator} ${newRight}`,
          latex: expressionToLatex(`${newLeft} ${operator} ${newRight}`),
          explanation: '좌변의 상수항을 우변으로 이동',
          operation: `양변에 ${-constantSum > 0 ? '+' : ''}${-constantSum}`,
          isSimplified: false,
        });
      }
    }

    // Step 2: 우변의 변수항 좌변으로 이동
    const rightVars = rightTerms.filter(t => t.variable !== '');
    const rightConstants = rightTerms.filter(t => t.variable === '');

    if (rightVars.length > 0) {
      // 좌변에 변수항 추가 (부호 반대로)
      rightVars.forEach(term => {
        leftTerms.push({ coefficient: -term.coefficient, variable: term.variable });
      });
      rightTerms = rightConstants;

      const newLeft = termsToString(leftTerms);
      const newRight = termsToString(rightTerms);

      steps.push({
        id: stepId++,
        expression: `${newLeft} ${operator} ${newRight}`,
        latex: expressionToLatex(`${newLeft} ${operator} ${newRight}`),
        explanation: '우변의 변수항을 좌변으로 이동',
        operation: `양변에서 우변의 변수항 빼기`,
        isSimplified: false,
      });
    }

    // Step 3: 동류항 정리
    const variableMap = new Map<string, number>();
    leftTerms.forEach(term => {
      if (term.variable) {
        const current = variableMap.get(term.variable) || 0;
        variableMap.set(term.variable, current + term.coefficient);
      }
    });

    leftTerms = Array.from(variableMap.entries()).map(([variable, coefficient]) => ({
      coefficient,
      variable,
    }));

    // 우변 상수항 정리
    const rightConstantSum = rightTerms.reduce((sum, t) => sum + t.coefficient, 0);
    rightTerms = [{ coefficient: rightConstantSum, variable: '' }];

    const simplifiedLeft = termsToString(leftTerms);
    const simplifiedRight = termsToString(rightTerms);

    steps.push({
      id: stepId++,
      expression: `${simplifiedLeft} ${operator} ${simplifiedRight}`,
      latex: expressionToLatex(`${simplifiedLeft} ${operator} ${simplifiedRight}`),
      explanation: '동류항 정리',
      operation: '같은 변수끼리 합치기',
      isSimplified: false,
    });

    // Step 4: 계수로 나누기 (최종 단계)
    if (leftTerms.length === 1 && leftTerms[0].variable) {
      const coefficient = leftTerms[0].coefficient;
      const variable = leftTerms[0].variable;

      if (coefficient !== 1) {
        const finalValue = rightConstantSum / coefficient;

        // 음수로 나누면 부등호 방향 바뀜
        let finalOperator = operator;
        if (coefficient < 0) {
          finalOperator = operator === '<' ? '>' :
                         operator === '>' ? '<' :
                         operator === '<=' ? '>=' : '<=';
        }

        steps.push({
          id: stepId++,
          expression: `${variable} ${finalOperator} ${finalValue}`,
          latex: expressionToLatex(`${variable} ${finalOperator} ${finalValue}`),
          explanation: '양변을 계수로 나누기',
          operation: `양변을 ${coefficient}로 나누기${coefficient < 0 ? ' (부등호 방향 변경)' : ''}`,
          isSimplified: true,
        });
      } else {
        steps[steps.length - 1].isSimplified = true;
      }
    } else {
      steps[steps.length - 1].isSimplified = true;
    }

  } catch (error) {
    console.error('부등식 단순화 오류:', error);
    steps.push({
      id: stepId++,
      expression: expression,
      latex: expressionToLatex(expression),
      explanation: '오류가 발생했습니다',
      operation: '파싱 실패',
      isSimplified: false,
    });
  }

  return steps;
}

/**
 * 항 배열을 문자열로 변환
 */
function termsToString(terms: { coefficient: number; variable: string }[]): string {
  if (terms.length === 0) return '0';

  return terms
    .map((term, index) => {
      const { coefficient, variable } = term;

      if (variable === '') {
        // 상수항
        return index === 0 ? `${coefficient}` : `${coefficient >= 0 ? '+' : ''}${coefficient}`;
      } else {
        // 변수항
        const coefStr = coefficient === 1 ? '' :
                       coefficient === -1 ? '-' :
                       `${coefficient}`;
        const sign = index === 0 ? (coefficient < 0 ? '-' : '') :
                                   (coefficient >= 0 ? '+' : '');
        const absCoef = Math.abs(coefficient) === 1 ? '' : `${Math.abs(coefficient)}`;

        return index === 0 ? `${coefStr}${variable}` : `${sign}${absCoef}${variable}`;
      }
    })
    .join('')
    .replace(/\+\-/g, '-');
}

/**
 * 표현식을 LaTeX로 변환
 */
function expressionToLatex(expression: string): string {
  return expression
    .replace(/\*/g, '\\times ')
    .replace(/\//g, '\\div ')
    .replace(/<=/g, '\\leq ')
    .replace(/>=/g, '\\geq ')
    .replace(/</g, '< ')
    .replace(/>/g, '> ');
}

/**
 * 전체 문제 생성 (테스트용)
 */
export function createProblem(expression: string): InequalityProblem {
  const steps = simplifyInequality(expression);
  const finalStep = steps[steps.length - 1];

  return {
    id: `prob_${Date.now()}`,
    originalExpression: expression,
    difficulty: determineDifficulty(steps.length),
    steps,
    finalAnswer: finalStep.expression,
    createdAt: new Date(),
  };
}

/**
 * 난이도 결정
 */
function determineDifficulty(stepCount: number): 'easy' | 'medium' | 'hard' {
  if (stepCount <= 3) return 'easy';
  if (stepCount <= 5) return 'medium';
  return 'hard';
}
