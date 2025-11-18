export interface Student {
  id: string;
  name: string;
  email?: string;
  grade_level?: string;
  is_teacher: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningActivity {
  id: string;
  student_id: string;
  session_start: string;
  session_end?: string;
  duration_minutes?: number;
  subject: string;
  topic?: string;
  total_problems: number;
  correct_answers: number;
  incorrect_answers: number;
  hints_used: number;
  self_confidence_before?: number;
  self_confidence_after?: number;
  created_at: string;
  updated_at: string;
}

export interface GrowthInsight {
  id: string;
  student_id: string;
  insight_date: string;
  period_type: string;
  dimension: string;
  title: string;
  description: string;
  recommendation?: string;
  improvement_percentage?: number;
  confidence_score?: number;
  evidence_data?: {
    metric: string;
    previous_value: number;
    current_value: number;
    comparison_period: string;
  };
  ai_model?: string;
  created_at: string;
}

export interface DailyGrowthReport {
  student_id: string;
  report_date: string;
  insights: GrowthInsight[];
  summary: string;
  overall_improvement: number;
  key_achievements: string[];
  recommendations: string[];
}

export interface ProblemAttempt {
  id: string;
  activity_id: string;
  problem_id: string;
  problem_type?: string;
  difficulty_level?: number;
  attempt_number: number;
  time_spent_seconds?: number;
  is_correct: boolean;
  hints_requested: number;
  gave_up: boolean;
  attempted_at: string;
}
