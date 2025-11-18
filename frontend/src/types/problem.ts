/**
 * 문제 데이터 타입 정의
 */

export interface Asymptotes {
  vertical: number[];
  horizontal: number[];
  oblique: Array<{
    slope: number;
    intercept: number;
  }>;
}

export interface ProblemData {
  id: number;
  question_name?: string;
  function: string;
  asymptotes: Asymptotes;
  domain: [number, number];
  range: [number, number];
  animation_duration: number;
}

export interface ApiResponse {
  success: boolean;
  data?: ProblemData;
  error?: string;
  timestamp?: number;
}

export interface Point {
  x: number;
  y: number;
}
