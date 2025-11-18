/**
 * Complexity type definitions
 * Matches backend complexity_analyzer.py types
 */

export enum ComplexityLevel {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  VERY_COMPLEX = 'very_complex',
}

export interface ComplexityMetrics {
  condition_count: number;
  nesting_depth: number;
  entity_count: number;
  has_cyclical_dependencies: boolean;
}

export interface ComplexityAssessment {
  metrics: ComplexityMetrics;
  level: ComplexityLevel;
  requires_focus_card: boolean;
  recommendations: string[];
  focus_message?: string;
}

export interface FocusCardProps {
  assessment: ComplexityAssessment;
  onContinue: () => void;
  onRequestHelp?: () => void;
  language?: 'ko' | 'en';
}
