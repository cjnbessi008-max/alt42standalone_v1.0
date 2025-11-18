/**
 * Mathematical term representation
 * 수학 항 표현
 */
export interface MathTerm {
  id: string;
  coefficient: number;
  variable?: string;
  exponent?: number;
  isConstant: boolean;
  originalIndex: number;
}

/**
 * Mathematical expression
 * 수학 수식
 */
export interface MathExpression {
  id: string;
  terms: MathTerm[];
  operator?: '+' | '-' | '*' | '/';
  latex: string;
}

/**
 * Animation step for term motion
 * 항 이동 애니메이션 단계
 */
export interface AnimationStep {
  id: string;
  description: string;
  descriptionKo: string;
  fromExpression: MathExpression;
  toExpression: MathExpression;
  termMappings: TermMapping[];
  duration: number;
}

/**
 * Mapping between terms in animation
 * 애니메이션에서 항들 간의 매핑
 */
export interface TermMapping {
  fromTermId: string;
  toTermId: string;
  action: 'move' | 'combine' | 'split' | 'transform';
  color?: string;
}

/**
 * Problem from LMS
 * LMS로부터 받은 문제
 */
export interface Problem {
  id: number;
  title: string;
  description: string;
  initialExpression: string;
  targetExpression: string;
  steps: AnimationStep[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

/**
 * Student progress
 * 학생 진행 상황
 */
export interface StudentProgress {
  problemId: number;
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  timeSpent: number;
  attempts: number;
}
