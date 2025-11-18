/**
 * TypeScript Type Definitions
 */

export interface Artwork {
  id: number;
  number: number;
  title: string;
  description: string;
  svg_data: string;
  color_scheme: string;
  difficulty_level: number;
  created_at: string;
  updated_at: string;
}

export interface Problem {
  id: number;
  moodle_question_id: number;
  course_id: number | null;
  quiz_id: number | null;
  question_text: string;
  question_type: string;
  correct_answer: string;
  artwork_number: number | null;
  difficulty: number;
  points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  artwork_title?: string;
  artwork_svg?: string;
}

export interface Student {
  id: number;
  moodle_user_id: number;
  username: string;
  email: string;
  full_name: string;
  grade_level: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProgress {
  id: number;
  student_id: number;
  problem_id: number;
  artwork_number: number;
  attempt_number: number;
  user_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
  score: number;
  attempted_at: string;
  completed_at: string | null;
}

export interface ProgressSubmission {
  student_id: number;
  problem_id: number;
  artwork_number: number;
  attempt_number?: number;
  user_answer: string;
  is_correct: boolean;
  time_spent_seconds: number;
  score: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MoodleSyncRequest {
  type: 'students' | 'problems';
  course_id: number;
  quiz_id?: number;
}

export interface MoodleSyncResponse {
  success: boolean;
  synced?: number;
  error?: string;
}
