export interface Problem {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface UserProgress {
  totalProblems: number;
  solvedProblems: number;
  currentProblemIndex: number;
}

export type MoodType = 'neutral' | 'happy' | 'excited' | 'celebrating';
