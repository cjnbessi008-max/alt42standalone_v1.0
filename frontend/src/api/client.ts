import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // No response received
      console.error('Network Error:', error.request);
    } else {
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export interface Student {
  id: string;
  name: string;
  email?: string;
  grade_level?: string;
  external_id?: string;
  created_at: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  problem_type: string;
  difficulty_level: number;
  correct_answer: string;
  answer_type: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface AttemptResponse {
  id: string;
  student_id: string;
  problem_id: string;
  submitted_answer: string;
  is_correct: boolean;
  time_spent_seconds?: number;
  attempted_at: string;
}

export interface AttemptWithFeedback {
  attempt: AttemptResponse;
  needs_explanation: boolean;
  problem_details?: Problem;
}

export interface ReasoningExplanation {
  id: string;
  attempt_id: string;
  student_id: string;
  problem_id: string;
  explanation_text: string;
  language: string;
  submitted_at: string;
}

export interface AIFeedback {
  id: string;
  reasoning_explanation_id: string;
  student_id: string;
  identified_misconception: string;
  reasoning_error_type?: string;
  corrective_feedback: string;
  encouragement?: string;
  ai_model: string;
  confidence_score?: number;
  processing_time_ms?: number;
  created_at: string;
}

export interface ReasoningAnalysis {
  reasoning_explanation: ReasoningExplanation;
  ai_feedback: AIFeedback;
  next_steps?: string;
}

export interface LearningProgress {
  id: string;
  student_id: string;
  problem_type: string;
  total_attempts: number;
  correct_attempts: number;
  common_errors?: any;
  last_attempt_at?: string;
  mastery_level: number;
  accuracy_rate: number;
}

// API Methods
export const api = {
  // Students
  createStudent: (data: { name: string; email?: string; grade_level?: string; external_id?: string }) =>
    apiClient.post<Student>('/api/students/', data),

  getStudent: (studentId: string) =>
    apiClient.get<Student>(`/api/students/${studentId}`),

  // Problems
  getProblems: (params?: { problem_type?: string; difficulty?: number }) =>
    apiClient.get<Problem[]>('/api/problems/', { params }),

  getProblem: (problemId: string) =>
    apiClient.get<Problem>(`/api/problems/${problemId}`),

  getRandomProblem: (params?: { problem_type?: string; difficulty?: number }) =>
    apiClient.get<Problem>('/api/problems/random/next', { params }),

  // Submissions
  submitAnswer: (data: {
    student_id: string;
    problem_id: string;
    submitted_answer: string;
    time_spent_seconds?: number;
  }) =>
    apiClient.post<AttemptWithFeedback>('/api/submissions/submit-answer', data),

  submitReasoning: (data: {
    attempt_id: string;
    student_id: string;
    explanation_text: string;
    language?: string;
  }) =>
    apiClient.post<ReasoningAnalysis>('/api/submissions/submit-reasoning', {
      ...data,
      language: data.language || 'ko',
    }),

  // Progress
  getStudentProgress: (studentId: string) =>
    apiClient.get<LearningProgress[]>(`/api/progress/student/${studentId}`),

  getStudentAttempts: (studentId: string, params?: { problem_type?: string; limit?: number }) =>
    apiClient.get<AttemptResponse[]>(`/api/progress/student/${studentId}/attempts`, { params }),
};
