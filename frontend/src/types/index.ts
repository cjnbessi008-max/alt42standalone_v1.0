/**
 * Frontend 타입 정의
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
  | 'power_rule'
  | 'substitution'
  | 'integration_by_parts'
  | 'trigonometric'
  | 'exponential'
  | 'logarithmic'
  | 'rational'
  | 'definite';

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

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}
