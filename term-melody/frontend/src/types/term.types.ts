/**
 * 수학 항(Term) 관련 타입 정의
 */

export interface ParsedExpression {
  original: string
  terms: ExpressionTerm[]
  variables: string[]
  constants: number[]
}

export interface ExpressionTerm {
  coefficient: number
  variable?: string
  exponent?: number
  sign: '+' | '-'
}

export interface TermComparison {
  term1: ExpressionTerm
  term2: ExpressionTerm
  coefficientChange: number
  variableChange: boolean
  changeType: 'increase' | 'decrease' | 'same' | 'transform'
}

export interface MathExpression {
  leftSide: string
  rightSide: string
  operator: '=' | '<' | '>' | '<=' | '>='
}
