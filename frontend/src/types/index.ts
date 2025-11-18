export interface Problem {
  id: string;
  title: string;
  description: string;
  subject: 'MATHEMATICS' | 'PHYSICS' | 'CHEMISTRY' | 'PROGRAMMING' | 'LOGIC';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  expected_steps: any[];
  expected_reasoning?: string;
  metadata: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Solution {
  id: string;
  problem_id: string;
  user_id: string;
  status: 'DRAFT' | 'SUBMITTED' | 'ANALYZED' | 'REVIEWED';
  submitted_steps: any[];
  raw_input?: string;
  time_spent_seconds: number;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GapAnalysis {
  id: string;
  solution_id: string;
  completeness_score: number;
  logic_continuity_score: number;
  correctness_score: number;
  overall_score: number;
  total_gaps_detected: number;
  critical_gaps_count: number;
  missing_steps_count: number;
  logical_errors_count: number;
  ai_summary?: string;
  ai_feedback?: string;
  ai_model_used?: string;
  detailed_analysis: any;
  analyzed_at: string;
  created_at: string;
  detected_gaps?: DetectedGap[];
  step_comparisons?: StepComparison[];
  feedback_items?: FeedbackItem[];
}

export interface DetectedGap {
  id: string;
  gap_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  after_step_number?: number;
  before_step_number?: number;
  description: string;
  expected_content?: string;
  suggestion?: string;
  metadata: any;
  created_at: string;
}

export interface StepComparison {
  id: string;
  student_step_number?: number;
  expected_step_number?: number;
  similarity_score?: number;
  match_type?: string;
  student_content?: string;
  expected_content?: string;
  comparison_notes?: string;
  metadata: any;
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  feedback_type: string;
  content: string;
  priority: number;
  related_step_number?: number;
  metadata: any;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  metadata: any;
  created_at: string;
}
