export interface Problem {
  id: number;
  problem_type: string;
  question_text: string;
  correct_numerator: number;
  correct_denominator: number;
  difficulty: string;
  created_at: string;
}

export interface PredictionRequest {
  student_id: string;
  problem_id: number;
  answer_numerator: number;
  answer_denominator: number;
  correct_numerator: number;
  correct_denominator: number;
}

export interface PredictionResponse {
  is_likely_wrong: boolean;
  error_type: string | null;
  explanation: string | null;
  suggestion: string | null;
  confidence: number;
}

export interface AnswerSubmit {
  student_id: string;
  problem_id: number;
  answer_numerator: number;
  answer_denominator: number;
}

export interface AttemptResponse {
  id: number;
  is_correct: boolean;
  prediction_was_shown: boolean;
  correct_answer: string;
  message: string;
}
