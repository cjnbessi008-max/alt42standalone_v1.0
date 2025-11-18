/**
 * 삼각형 닮음 조건 타입 정의
 */

export type SimilarityType = 'AAA' | 'SAS' | 'SSS';

export interface SimilarityCondition {
  id: string;
  type: SimilarityType;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  formula: string;
  example: string;
  color: string;
  icon: string;
}

export interface MoodleProblem {
  id: number;
  questionId: number;
  title: string;
  content: string;
  similarityType: SimilarityType;
  difficulty: 'easy' | 'medium' | 'hard';
  triangleData?: {
    triangle1: {
      angles?: number[];
      sides?: number[];
    };
    triangle2: {
      angles?: number[];
      sides?: number[];
    };
  };
}

export interface StudentProgress {
  problemId: number;
  attempts: number;
  isCorrect: boolean;
  timeSpent: number;
  lastAttempt: Date;
}
