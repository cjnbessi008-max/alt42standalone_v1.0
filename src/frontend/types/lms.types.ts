/**
 * Moodle LMS 연동을 위한 타입 정의
 */

/**
 * Moodle 세션 정보
 */
export interface MoodleSession {
  sessionKey: string;
  userId: number;
  courseId: number;
  activityId: number;
}

/**
 * Moodle API 응답
 */
export interface MoodleApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

/**
 * 문제 제출 요청
 */
export interface SubmitAnswerRequest {
  sessionKey: string;
  problemId: number;
  answer: string;
  timeSpent: number;
  metadata?: Record<string, any>;
}

/**
 * 문제 제출 응답
 */
export interface SubmitAnswerResponse {
  correct: boolean;
  score: number;
  feedback?: string;
  explanation?: string;
}

/**
 * 문제 불러오기 요청
 */
export interface LoadProblemRequest {
  sessionKey: string;
  activityId: number;
  problemIndex?: number;
}
