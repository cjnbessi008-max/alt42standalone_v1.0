/**
 * Base (진법) 타입
 */
export type BaseType = 2 | 10 | 16;

/**
 * 변환 단계 정보
 */
export interface ConversionStep {
  id: number;
  description: string;
  formula?: string;
  value: string;
  base: BaseType;
}

/**
 * 문제 데이터 (Moodle에서 받아올 데이터)
 */
export interface ProblemData {
  id: string;
  question: string;
  sourceValue: string;
  sourceBase: BaseType;
  targetBase: BaseType;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * 애니메이션 상태
 */
export interface AnimationState {
  currentStep: number;
  isPlaying: boolean;
  speed: number; // ms
}

/**
 * Moodle API 응답
 */
export interface MoodleApiResponse {
  success: boolean;
  data?: ProblemData[];
  error?: string;
}
