// Type definitions for ALT42 API Gateway

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: 'student' | 'teacher' | 'admin';
  grade_level?: string;
  institution?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
  preferences?: Record<string, any>;
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
  analysis_started_at?: Date;
  analysis_completed_at?: Date;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, any>;
}

export interface Refutation {
  id: string;
  argument_id: string;
  analysis_summary?: string;
  logical_structure?: Record<string, any>;
  premise_analysis?: Record<string, any>;
  conclusion_analysis?: Record<string, any>;
  refutation_text: string;
  correct_reasoning?: string;
  guided_questions?: Array<string>;
  confidence_score?: number;
  ai_model?: string;
  processing_time_ms?: number;
  created_at: Date;
  metadata?: Record<string, any>;
}

export interface Fallacy {
  id: string;
  name: string;
  category: 'formal' | 'informal' | 'statistical' | 'causal';
  description: string;
  examples?: Array<string>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  educational_content?: string;
  created_at: Date;
  updated_at: Date;
}

export interface FallacyInstance {
  id: string;
  refutation_id: string;
  fallacy_id: string;
  excerpt: string;
  explanation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  position_start?: number;
  position_end?: number;
  created_at: Date;
}

export interface ProgressStats {
  id: string;
  user_id: string;
  total_arguments: number;
  arguments_with_fallacies: number;
  most_common_fallacy_id?: string;
  average_confidence_score?: number;
  improvement_rate?: number;
  current_streak: number;
  longest_streak: number;
  last_submission_date?: Date;
  mastery_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  statistics?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Express.Request {
  user?: JWTPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field?: string; message: string }>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AnalysisRequest {
  content: string;
  title?: string;
  topic?: string;
  subject?: string;
}

export interface AnalysisResponse {
  argument_id: string;
  refutation_id: string;
  fallacies_detected: number;
  processing_time_ms: number;
  confidence_score: number;
}
