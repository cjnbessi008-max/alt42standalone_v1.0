/**
 * Type definitions for AI Education System
 */

export interface SuggestedQuestion {
  question: string;
  rationale: string;
  category: 'clarification' | 'strategy' | 'reflection';
}

export interface QuestionSuggestionResponse {
  suggestion_id: string;
  student_id: string;
  problem_id: string;
  suggestions: SuggestedQuestion[];
  context_used?: {
    total_attempts: number;
    struggling_concepts: string[];
  };
  created_at: string;
}

export interface QuestionSuggestionRequest {
  student_id: string;
  problem_id: string;
  current_attempt_data?: Record<string, any>;
  include_context?: boolean;
}

export interface QuestionFeedbackRequest {
  suggestion_id: string;
  student_id: string;
  accepted_suggestion?: number; // 1-3
  helpfulness_rating: number; // 1-5
  comment?: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  problem_type: string;
  difficulty_level: number;
  content: Record<string, any>;
}
