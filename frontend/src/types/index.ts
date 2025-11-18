// Moodle Types
export interface MoodleQuiz {
  id: number;
  course: number;
  name: string;
  intro: string;
  timeopen: number;
  timeclose: number;
  timelimit: number;
  grade: number;
  sumgrades: number;
}

export interface QuestionStats {
  id: number;
  slot: number;
  questiontext: string;
  totalAttempts: number;
  correctAttempts: number;
  averageMark: number;
  maxMark: number;
  successRate: number;
}

export interface CorrelationData {
  quizId: number;
  quizName: string;
  matrix: number[][];
  labels: string[];
  questions: QuestionStats[];
  timestamp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
