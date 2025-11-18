/**
 * Substitution Glow Feature Types
 * 치환 시각화를 위한 타입 정의
 */

export type SubstitutionStatus = 'pending' | 'correct' | 'incorrect' | 'partial';

export type GlowColor = 'green' | 'red' | 'orange' | 'blue' | 'none';

export interface SubstitutionStep {
  id: string;
  stepNumber: number;
  originalExpression: string;
  substitutedExpression: string;
  variableFrom: string;
  variableTo: string;
  explanation: string;
  isCorrect?: boolean;
}

export interface SubstitutionProblem {
  id: string;
  title: string;
  description: string;
  initialEquation: string;
  targetVariable: string;
  steps: SubstitutionStep[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  hints: string[];
}

export interface SubstitutionAttempt {
  stepId: string;
  userInput: string;
  submittedExpression: string;
  isCorrect: boolean;
  feedback: string;
  timestamp: Date;
}

export interface SubstitutionValidationResult {
  isValid: boolean;
  status: SubstitutionStatus;
  glowColor: GlowColor;
  feedback: string;
  correctAnswer?: string;
}

export interface SubstitutionState {
  currentProblem: SubstitutionProblem | null;
  currentStepIndex: number;
  attempts: SubstitutionAttempt[];
  isCompleted: boolean;
  score: number;
}
