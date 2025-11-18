/**
 * 로그 성질 타입 정의
 */
export interface LogProperty {
  id: string;
  title: string;
  formula: string;
  explanation: string;
  example?: string;
  category: 'basic' | 'change-of-base' | 'exponential' | 'advanced';
}

/**
 * LMS 문제 데이터 타입
 */
export interface ProblemData {
  id: number;
  type: 'logarithm-property';
  properties: LogProperty[];
  difficulty: 'easy' | 'medium' | 'hard';
  source: 'moodle' | 'custom';
}

/**
 * 카드 뒤집기 상태
 */
export interface FlipCardState {
  isFlipped: boolean;
  currentIndex: number;
}

/**
 * LMS API 응답
 */
export interface LMSResponse {
  success: boolean;
  data?: ProblemData;
  error?: string;
}
