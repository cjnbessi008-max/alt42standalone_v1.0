/**
 * TypeScript type definitions for LMS Bottleneck Detection System
 */

export interface Student {
  id: string
  student_number: string
  name: string
  grade_level: string | null
  email: string | null
}

export interface ProblemType {
  id: string
  name: string
  category: string
  description: string | null
  difficulty_level: number
  expected_solve_time_seconds: number
}

export interface Bottleneck {
  id: string
  student_id: string
  problem_type_id: string
  problem_type_name: string
  category: string
  accuracy_rate: number
  avg_solve_time_seconds: number
  difficulty_score: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  detection_reason: string
  detected_at: string
  is_active: boolean
  recommended_actions: {
    focus_areas: string[]
    suggested_resources: string[]
    practice_strategy: string
  } | null
}

export interface PerformanceSummary {
  student_id: string
  overall: {
    total_attempts: number
    correct_attempts: number
    accuracy_rate: number
  }
  by_problem_type: ProblemTypePerformance[]
  strongest_types: ProblemTypePerformance[]
  weakest_types: ProblemTypePerformance[]
}

export interface ProblemTypePerformance {
  problem_type_id: string
  problem_type_name: string
  category: string
  total_attempts: number
  correct_attempts: number
  accuracy_rate: number
  mastery_level: number
  trend: 'improving' | 'stable' | 'declining' | 'unknown'
  avg_solve_time: number
}

export interface RealtimePerformance {
  student_id: string
  period_minutes: number
  activity: string
  recent_attempts?: number
  recent_correct?: number
  recent_accuracy?: number
  avg_time_seconds?: number
  attempts?: {
    problem_id: string
    is_correct: boolean
    time_spent: number
    submitted_at: string
  }[]
}

export interface WebSocketMessage {
  type: 'connection' | 'bottleneck_detected' | 'echo'
  message?: string
  student_id?: string
  data?: any
  timestamp?: string
}
