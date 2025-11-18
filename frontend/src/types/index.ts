/**
 * Condition types for color-coded highlighting
 */
export enum ConditionType {
  VALUE = 'value',           // Given values/data (blue)
  CONSTRAINT = 'constraint', // Constraints (green)
  RANGE = 'range',          // Range/boundary conditions (yellow)
  IMPORTANT = 'important',   // Important conditions/errors (red)
  CONDITIONAL = 'conditional' // Conditional logic (purple)
}

/**
 * Condition item to be highlighted
 */
export interface Condition {
  id: string;
  type: ConditionType;
  text: string;
  description?: string;
}

/**
 * Problem structure
 */
export interface Problem {
  id: string;
  title: string;
  description: string;
  conditions: Condition[];
  problemType: 'fraction' | 'equation' | 'geometry' | 'other';
}

/**
 * Color configuration for each condition type
 */
export interface ColorConfig {
  primary: string;
  background: string;
  border: string;
  hover: string;
}
