export interface EquationStep {
  expression: string;
  description: string;
  expanded?: boolean;
}

export interface ProblemData {
  id?: string;
  equation: string;
  steps: EquationStep[];
  difficulty?: number;
  subject?: string;
}

export interface MoodleResponse {
  success: boolean;
  data?: ProblemData;
  error?: string;
}
