/**
 * 적분 문제 타입 정의
 */

export interface IntegralProblem {
  id: string;
  problemText: string;
  latex: string;
  difficulty: 'easy' | 'medium' | 'hard';
  integralType: IntegralType;
  steps?: IntegralStep[];
  coreRules?: CoreRule[];
}

export type IntegralType =
  | 'power_rule'           // 거듭제곱 법칙: ∫ x^n dx
  | 'substitution'         // 치환적분
  | 'integration_by_parts' // 부분적분
  | 'trigonometric'        // 삼각함수
  | 'exponential'          // 지수함수
  | 'logarithmic'          // 로그함수
  | 'rational'             // 유리함수
  | 'definite';            // 정적분

export interface IntegralStep {
  stepNumber: number;
  description: string;
  latex: string;
  appliedRule?: CoreRule;
  highlightedParts?: HighlightedPart[];
}

export interface CoreRule {
  ruleId: string;
  ruleName: string;
  ruleFormula: string;
  ruleLatex: string;
  description: string;
  category: IntegralType;
}

export interface HighlightedPart {
  partId: string;
  latex: string;
  color: string;
  label: string;
  tooltipText?: string;
}

/**
 * Moodle에서 가져온 문제 데이터
 */
export interface MoodleProblem {
  id: number;
  questiontext: string;
  questiontype: string;
  category: number;
  difficulty?: number;
  metadata?: Record<string, any>;
}

/**
 * 하이라이팅 설정
 */
export interface HighlightConfig {
  enableAutoHighlight: boolean;
  highlightColors: {
    integrand: string;
    limits: string;
    variable: string;
    appliedRule: string;
    result: string;
  };
  showTooltips: boolean;
  showStepByStep: boolean;
}
