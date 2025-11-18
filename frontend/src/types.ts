/**
 * Type definitions for Learning Stress Indicator
 * 학습 스트레스 지표 타입 정의
 */

export enum StressLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

export interface StressFactor {
  score: number;
  weight: number;
  value: number;
  unit: string;
}

export interface StressFactors {
  error_rate: StressFactor;
  time_spent: StressFactor;
  retry_count: StressFactor;
  response_trend: StressFactor;
}

export interface StressIndicator {
  student_id: string;
  module_id: string;
  session_id: string;
  stress_level: StressLevel;
  stress_score: number;
  factors: StressFactors;
  timestamp: string;
  recommendations: string[];
}

export interface StressMetrics {
  total_students: number;
  low_stress_count: number;
  medium_stress_count: number;
  high_stress_count: number;
  average_stress_score: number;
  timestamp: string;
}

export interface LearningActivity {
  student_id: string;
  module_id: string;
  session_id: string;
  time_spent_minutes: number;
  problems_attempted: number;
  problems_correct: number;
  retry_count: number;
  average_response_time: number;
  response_time_trend: number;
  timestamp?: string;
}
