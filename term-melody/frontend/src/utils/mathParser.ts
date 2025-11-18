/**
 * 수학 표현식 파서
 */

import type { ParsedExpression, ExpressionTerm } from '@types/term.types'

/**
 * 수학 표현식을 파싱하여 항 추출
 * 예: "3x + 2" -> { original: "3x + 2", terms: [...], variables: ['x'], constants: [2] }
 */
export function parseExpression(expression: string): ParsedExpression {
  const normalized = expression.replace(/\s+/g, '')
  const terms: ExpressionTerm[] = []
  const variables = new Set<string>()
  const constants: number[] = []

  // 항 분리를 위한 정규식
  // 예: +3x, -2x^2, +5, -3
  const termPattern = /([+-]?)(\d*\.?\d*)([a-z]?)(\^(\d+))?/gi

  let matches
  while ((matches = termPattern.exec(normalized)) !== null) {
    const [, sign, coeff, variable, , exponent] = matches

    if (!coeff && !variable) continue

    const term: ExpressionTerm = {
      coefficient: 0,
      sign: (sign === '-' ? '-' : '+') as '+' | '-',
    }

    // 계수 파싱
    if (variable) {
      const coeffValue = coeff === '' || coeff === '+' ? 1 : coeff === '-' ? -1 : parseFloat(coeff)
      term.coefficient = sign === '-' ? -Math.abs(coeffValue) : coeffValue
      term.variable = variable
      variables.add(variable)

      if (exponent) {
        term.exponent = parseInt(exponent)
      }
    } else if (coeff) {
      const value = parseFloat(coeff)
      term.coefficient = sign === '-' ? -value : value
      constants.push(term.coefficient)
    }

    if (term.coefficient !== 0 || term.variable) {
      terms.push(term)
    }
  }

  return {
    original: expression,
    terms,
    variables: Array.from(variables),
    constants,
  }
}

/**
 * 항을 문자열로 변환
 */
export function termToString(term: ExpressionTerm): string {
  const sign = term.sign === '+' ? '+' : '-'
  const absCoeff = Math.abs(term.coefficient)

  let result = ''

  if (term.variable) {
    const coeffStr = absCoeff === 1 ? '' : absCoeff.toString()
    result = `${coeffStr}${term.variable}`
    if (term.exponent && term.exponent !== 1) {
      result += `^${term.exponent}`
    }
  } else {
    result = absCoeff.toString()
  }

  return sign + result
}

/**
 * 두 항 비교
 */
export function compareTerms(term1: ExpressionTerm, term2: ExpressionTerm) {
  const coeffChange = term2.coefficient - term1.coefficient
  const variableChange = term1.variable !== term2.variable

  let changeType: 'increase' | 'decrease' | 'same' | 'transform'

  if (variableChange) {
    changeType = 'transform'
  } else if (coeffChange > 0) {
    changeType = 'increase'
  } else if (coeffChange < 0) {
    changeType = 'decrease'
  } else {
    changeType = 'same'
  }

  return {
    term1,
    term2,
    coefficientChange: coeffChange,
    variableChange,
    changeType,
  }
}
