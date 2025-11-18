// Moodle API Types

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
  questions?: number[];
}

export interface MoodleQuestion {
  id: number;
  slot: number;
  type: string;
  page: number;
  questiontext: string;
  maxmark: number;
}

export interface MoodleAttempt {
  id: number;
  quiz: number;
  userid: number;
  attempt: number;
  state: string;
  timestart: number;
  timefinish: number;
  timemodified: number;
  sumgrades: number | null;
}

export interface MoodleQuestionAttempt {
  slot: number;
  questionid: number;
  state: string;
  status: string;
  mark: number;
  maxmark: number;
  fraction: number;
  timecreated: number;
  timemodified: number;
}

export interface MoodleUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
}

// Correlation Types

export interface CorrelationData {
  quizId: number;
  quizName: string;
  matrix: number[][];
  labels: string[];
  questions: QuestionStats[];
  timestamp: number;
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

export interface CorrelationPair {
  question1: number;
  question2: number;
  correlation: number;
}

export interface StudentPerformance {
  userId: number;
  questionId: number;
  mark: number;
  maxMark: number;
  fraction: number;
}
