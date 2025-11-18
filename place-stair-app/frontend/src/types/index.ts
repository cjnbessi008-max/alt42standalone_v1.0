// Place Stair Problem Types (matching backend)
export interface PlaceStairProblem {
  id: number;
  type: 'identification' | 'composition' | 'decomposition' | 'comparison';
  number: number;
  question: string;
  maxDigits: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  hints?: string[];
  createdAt: Date;
}

// Answer structure
export interface PlaceValues {
  ones?: number;
  tens?: number;
  hundreds?: number;
  thousands?: number;
}

// Validation result
export interface ValidationResult {
  isCorrect: boolean;
  feedback: string;
}

// App state
export interface AppState {
  currentProblem: PlaceStairProblem | null;
  problems: PlaceStairProblem[];
  currentIndex: number;
  studentId: number | null;
  courseId: number | null;
  score: number;
  startTime: number;
  showHint: boolean;
  showFeedback: boolean;
  feedbackMessage: string;
}

// Stair configuration for visualization
export interface StairConfig {
  place: 'ones' | 'tens' | 'hundreds' | 'thousands';
  value: number;
  maxValue: number;
  color: string;
  label: string;
}
