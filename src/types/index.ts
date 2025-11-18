// 문제 유형
export type QuestionType = 'multiple-choice' | 'true-false' | 'short-answer';

// 난이도
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

// 문제 인터페이스
export interface Question {
  id: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  title: string;
  question: string;
  options?: string[]; // multiple-choice용
  correctAnswer: string | number;
  explanation?: string;
  timeLimit?: number; // 초 단위
  category?: string;
}

// 사용자 답안
export interface UserAnswer {
  questionId: string;
  answer: string | number;
  isCorrect: boolean;
  timeSpent: number; // 초 단위
  timestamp: number;
  usedFocusReset: boolean;
}

// 퀴즈 세션
export interface QuizSession {
  id: string;
  startTime: number;
  endTime?: number;
  questions: Question[];
  currentQuestionIndex: number;
  answers: UserAnswer[];
  score: number;
  totalQuestions: number;
}

// 머리정리 모드 활동 유형
export type FocusResetActivityType = 'breathing' | 'stretching' | 'eye-relaxation' | 'skip';

// 머리정리 모드 설정
export interface FocusResetSettings {
  enabled: boolean;
  frequency: number; // N문제마다 (1 = 매 문제)
  duration: number; // 초 단위 (5-60)
  preferredActivity: FocusResetActivityType;
  autoSkip: boolean; // 자동으로 건너뛰기
}

// 머리정리 모드 세션
export interface FocusResetSession {
  activityType: FocusResetActivityType;
  startTime: number;
  duration: number;
  completed: boolean;
  questionBefore: string; // 이전 문제 ID
  questionAfter: string; // 다음 문제 ID
}

// 학습 통계
export interface LearningStats {
  totalQuestions: number;
  correctAnswers: number;
  averageTimePerQuestion: number;
  accuracyRate: number;
  focusResetUsage: number;
  accuracyWithFocusReset: number;
  accuracyWithoutFocusReset: number;
  categoryPerformance: Record<string, {
    total: number;
    correct: number;
    averageTime: number;
  }>;
}

// 사용자 프로필
export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  createdAt: number;
  settings: FocusResetSettings;
  stats: LearningStats;
}
