// Distribution types
export type DistributionType = 'normal' | 'uniform' | 'binomial' | 'exponential' | 'poisson';

export interface DistributionParams {
  type: DistributionType;
  mean?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  n?: number;
  p?: number;
  lambda?: number;
}

export interface DistributionPoint {
  x: number;
  y: number;
}

// Moodle integration types
export interface MoodleQuestion {
  id: number;
  questionText: string;
  questionType: string;
  options?: string[];
  correctAnswer?: string;
  metadata?: Record<string, unknown>;
}

export interface MoodleUserResponse {
  questionId: number;
  userId: number;
  answer: string;
  timestamp: number;
  isCorrect: boolean;
}

export interface MoodleConfig {
  moodleUrl: string;
  token: string;
  courseId?: number;
  quizId?: number;
}

// App state types
export interface AppState {
  currentDistribution: DistributionParams;
  targetDistribution: DistributionParams | null;
  isMorphing: boolean;
  morphProgress: number;
  moodleQuestion: MoodleQuestion | null;
  isConnectedToMoodle: boolean;

  // Actions
  setCurrentDistribution: (params: DistributionParams) => void;
  setTargetDistribution: (params: DistributionParams | null) => void;
  startMorph: () => void;
  updateMorphProgress: (progress: number) => void;
  setMoodleQuestion: (question: MoodleQuestion | null) => void;
  setMoodleConnection: (connected: boolean) => void;
}
