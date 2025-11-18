export type FormulaCategory =
  | 'algebra'
  | 'geometry'
  | 'trigonometry'
  | 'calculus'
  | 'physics'
  | 'statistics';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Formula {
  id: string;
  imageUrl: string;
  text: string;
  components: FormulaComponent[];
  category?: FormulaCategory;
  difficulty?: DifficultyLevel;
  name?: string;
  description?: string;
}

export interface FormulaComponent {
  id: string;
  text: string;
  type: 'variable' | 'operator' | 'constant' | 'function' | 'expression';
  position: number;
}

export interface Question {
  id: string;
  text: string;
  hint?: string;
  focusComponent?: string; // ID of the component to highlight
}

export type LearningPhase = 'upload' | 'initial-view' | 'question' | 'reveal' | 'complete';

export interface LearningSession {
  formulaId: string;
  formulaText: string;
  startedAt: number;
  completedAt?: number;
  cyclesCompleted: number;
  questionsAnswered: number;
}

export interface LearningStats {
  totalSessions: number;
  totalFormulasLearned: number;
  totalTimeSpent: number; // in milliseconds
  formulasCompleted: string[]; // formula IDs
  recentSessions: LearningSession[];
  lastActiveDate?: number;
}

export interface CategoryInfo {
  id: FormulaCategory;
  name: string;
  icon: string;
  description: string;
}
