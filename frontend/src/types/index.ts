// Type definitions for ALT42 Frontend

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: 'student' | 'teacher' | 'admin';
  grade_level?: string;
  institution?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export interface Argument {
  id: string;
  user_id: string;
  title?: string;
  content: string;
  topic?: string;
  subject: 'mathematics' | 'logic' | 'science' | 'philosophy' | 'general';
  difficulty_level?: number;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  refutation_id?: string;
  confidence_score?: number;
  fallacies_count?: number;
}

export interface Fallacy {
  id: string;
  name: string;
  category: 'formal' | 'informal' | 'statistical' | 'causal';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fallacy_name?: string;
  excerpt?: string;
  explanation?: string;
  position_start?: number;
  position_end?: number;
}

export interface Refutation {
  id: string;
  argument_id: string;
  analysis_summary?: string;
  logical_structure?: {
    premises: string[];
    conclusion?: string;
    argument_type?: string;
  };
  premise_analysis?: {
    sound_premises: string[];
    questionable_premises: Array<{ premise: string; issue: string }>;
  };
  conclusion_analysis?: {
    is_valid: boolean;
    explanation: string;
  };
  refutation_text: string;
  correct_reasoning?: string;
  guided_questions?: string[];
  confidence_score: number;
  processing_time_ms: number;
  created_at: string;
  fallacies?: Fallacy[];
}

export interface ArgumentDetail extends Argument {
  analysis_summary?: string;
  logical_structure?: any;
  premise_analysis?: any;
  conclusion_analysis?: any;
  refutation_text?: string;
  correct_reasoning?: string;
  guided_questions?: string[];
  fallacies?: Fallacy[];
}

export interface ProgressStats {
  id: string;
  user_id: string;
  total_arguments: number;
  arguments_with_fallacies: number;
  average_confidence_score?: number;
  current_streak: number;
  longest_streak: number;
  mastery_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  most_common_fallacy?: Fallacy;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field?: string; message: string }>;
}
