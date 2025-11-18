// 문항 상태
export const QuestionStatus = {
  UNSEEN: 'UNSEEN',
  SCANNED: 'SCANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  SOLVED_CORRECT: 'SOLVED_CORRECT',
  SOLVED_WRONG: 'SOLVED_WRONG',
  SKIPPED: 'SKIPPED',
  GIVEN_UP: 'GIVEN_UP',
} as const;
export type QuestionStatus = typeof QuestionStatus[keyof typeof QuestionStatus];

// 난이도
export const Difficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
  NO_IDEA: 'NO_IDEA',
} as const;
export type Difficulty = typeof Difficulty[keyof typeof Difficulty];

// 라운드 번호
export const RoundNumber = {
  ROUND_1: 1,
  ROUND_2: 2,
  ROUND_3: 3,
} as const;
export type RoundNumber = typeof RoundNumber[keyof typeof RoundNumber];

// 라운드별 문항 상태 기록
export interface QuestionRoundRecord {
  roundNumber: RoundNumber;
  status: QuestionStatus;
  difficulty?: Difficulty;
  startTime: Date;
  endTime?: Date;
  timeSpent: number;
}

// 문항 정보
export interface Question {
  questionIndex: number;
  rounds: QuestionRoundRecord[];
  finalResult?: 'correct' | 'wrong' | 'unsolved';
  actualDifficulty?: Difficulty;
  notes?: string;
}

// 라운드 전략
export interface RoundStrategy {
  round1MaxTimePerQuestion: number;
  round2MaxTimePerQuestion: number;
  round3MaxTimePerQuestion: number;
}

// 시험 세션
export interface ExamSession {
  sessionId: string;
  userId?: string;
  examName: string;
  examDate: Date;
  totalTimeMinutes: number;
  questionCount: number;
  strategy: RoundStrategy;
  questions: Question[];
  currentRound: RoundNumber;
  currentQuestionIndex: number;
  startTime: Date;
  endTime?: Date;
  preTensionLevel?: number;
  status: 'setup' | 'in_progress' | 'completed';
}

// 멘탈 이벤트 타입
export interface MentalEvent {
  id: string;
  sessionId: string;
  timestamp: Date;
  triggerType: 'time_threshold' | 'manual';
  message: string;
  remainingTimePercent?: number;
}

// 세션 통계
export interface SessionStats {
  sessionId: string;
  easyQuestionsTotal: number;
  easyQuestionsSolved: number;
  easyQuestionsUnsolved: number;
  totalTimeSpent: number;
  averageTimePerQuestion: number;
  maxTimeOnSingleQuestion: number;
  questionsOver3Minutes: number;
  round1Stats: {
    questionsScanned: number;
    questionsSolved: number;
    timeSpent: number;
  };
  round2Stats: {
    questionsAttempted: number;
    questionsSolved: number;
    timeSpent: number;
  };
  round3Stats: {
    questionsAttempted: number;
    questionsSolved: number;
    questionsGivenUp: number;
    timeSpent: number;
  };
  last10MinutesStats: {
    questionsAttempted: number;
    questionsSolved: number;
    pointsEarned?: number;
  };
  patterns: {
    easyQuestionsLeftBehind: boolean;
    excessiveAttachmentToHardQuestions: boolean;
    lateRushPattern: boolean;
    earlyExhaustionPattern: boolean;
  };
}

// 코칭 메시지
export interface CoachingMessage {
  id: string;
  sessionId: string;
  type: 'success' | 'warning' | 'tip' | 'encouragement';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// 호흡 가이드
export interface BreathingGuide {
  phase: 'inhale' | 'hold' | 'exhale';
  duration: number;
  currentSecond: number;
}
