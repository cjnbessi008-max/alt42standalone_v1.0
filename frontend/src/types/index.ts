/**
 * Type definitions for ALT42 LMS Integration & Tips System
 */

// 문제 유형
export interface ProblemType {
  id: string;
  name: string;
  name_ko: string;
  category: 'algebra' | 'geometry' | 'calculus' | 'statistics';
  description?: string;
  description_ko?: string;
  metadata: Record<string, any>;
}

// 관점 전환 팁
export interface PerspectiveTip {
  id: string;
  problem_type_id: string;
  tip_level: 1 | 2 | 3;  // 1: basic, 2: intermediate, 3: advanced
  perspective_type: 'visual' | 'algebraic' | 'geometric' | 'conceptual';
  title: string;
  title_ko: string;
  content: string;
  content_ko: string;
  example_problem?: Record<string, any>;
  trigger_conditions: Record<string, any>;
  effectiveness_score: number;
  usage_count: number;
}

// 팁 요청
export interface TipRequest {
  student_id: string;
  problem_id: string;
  current_attempt_number: number;
  time_spent_seconds?: number;
  previous_answers?: Record<string, any>[];
}

// 팁 응답
export interface TipResponse {
  tip: PerspectiveTip;
  recommendation_id: string;
  confidence_score: number;
  personalized: boolean;
  alternative_tips: PerspectiveTip[];
}

// 학생
export interface Student {
  id: string;
  lms_integration_id: string;
  external_student_id: string;
  name: string;
  grade_level?: string;
  metadata: Record<string, any>;
}

// 문제
export interface Problem {
  id: string;
  problem_type_id: string;
  lms_integration_id?: string;
  external_problem_id?: string;
  title: string;
  content: Record<string, any>;
  difficulty_level: number;
  metadata: Record<string, any>;
}

// 학생 시도
export interface StudentAttempt {
  id: string;
  student_id: string;
  problem_id: string;
  attempt_number: number;
  answer_submitted: Record<string, any>;
  is_correct?: boolean;
  time_spent_seconds?: number;
  tips_viewed: string[];
  tip_helped?: boolean;
}

// 학습 프로필
export interface StudentLearningProfile {
  id: string;
  student_id: string;
  problem_type_id: string;
  preferred_perspective_type?: string;
  weak_areas: string[];
  strong_areas: string[];
  tip_effectiveness: Record<string, number>;
}

// LMS 연동 설정
export interface LMSIntegration {
  id: string;
  lms_type: 'canvas' | 'moodle' | 'blackboard' | 'custom';
  institution_name: string;
  api_endpoint: string;
  is_active: boolean;
  last_sync_at?: string;
}

// API 응답
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

// 팁 분석
export interface TipAnalytics {
  total_tips_shown: number;
  helpful_rate: number;
  most_effective_tips: PerspectiveTip[];
  least_effective_tips: PerspectiveTip[];
  perspective_type_breakdown: {
    [key: string]: {
      shown: number;
      helpful_rate: number;
    };
  };
}
