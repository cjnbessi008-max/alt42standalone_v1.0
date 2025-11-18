/**
 * Understanding Level Types
 * 학습자의 이해도 수준을 나타내는 타입 정의
 */

export type UnderstandingLevel = 1 | 2 | 3;

export interface UnderstandingData {
  level: UnderstandingLevel;
  studentId: string;
  moduleId: string;
  updatedAt: Date;
  history?: UnderstandingHistoryEntry[];
}

export interface UnderstandingHistoryEntry {
  level: UnderstandingLevel;
  achievedAt: Date;
  trigger: string; // e.g., 'mastered_concept', 'correct_streak', 'complexity_increase'
}

export interface UnderstandingMetrics {
  accuracy: number; // 0-100
  problemsAttempted: number;
  correctStreak: number;
  averageTimePerProblem: number; // in seconds
  consistencyScore: number; // 0-100
}

export const UNDERSTANDING_LEVEL_CONFIG = {
  1: {
    label: '기초',
    labelEn: 'Novice',
    description: '개념을 이해하고 있는 단계',
    color: '#FF6B6B',
    minAccuracy: 0,
    maxAccuracy: 40,
    minProblems: 0
  },
  2: {
    label: '중급',
    labelEn: 'Intermediate',
    description: '개념을 적용할 수 있는 단계',
    color: '#FFD700',
    minAccuracy: 40,
    maxAccuracy: 80,
    minProblems: 5
  },
  3: {
    label: '숙달',
    labelEn: 'Mastery',
    description: '개념을 완전히 숙달한 단계',
    color: '#2ECC71',
    minAccuracy: 80,
    maxAccuracy: 100,
    minProblems: 15
  }
} as const;
