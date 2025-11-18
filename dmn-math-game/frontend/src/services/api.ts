import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface GameSession {
  id: string;
  student_id: string;
  started_at: string;
  ended_at?: string;
  total_problems: number;
  correct_answers: number;
  duration_seconds?: number;
  difficulty_level: number;
  is_completed: boolean;
  accuracy: number;
}

export interface Problem {
  id: string;
  session_id: string;
  problem_type: 'addition' | 'subtraction' | 'multiplication';
  operand_1: number;
  operand_2: number;
  difficulty_level: number;
  question: string;
}

export interface AnswerResult {
  answer_id: string;
  is_correct: boolean;
  correct_answer?: number;
  feedback: string;
}

export interface StudentProgress {
  id: string;
  student_id: string;
  current_difficulty_level: number;
  total_sessions: number;
  total_problems_solved: number;
  total_correct_answers: number;
  average_accuracy: number;
  last_session_at?: string;
}

// Game API
export const gameApi = {
  startSession: async (studentId: string): Promise<GameSession> => {
    const response = await api.post('/api/game/start', { student_id: studentId });
    return response.data.session;
  },

  getSession: async (sessionId: string): Promise<GameSession> => {
    const response = await api.get(`/api/game/session/${sessionId}`);
    return response.data.session;
  },

  getNextProblem: async (sessionId: string): Promise<Problem> => {
    const response = await api.post('/api/game/problem', { session_id: sessionId });
    return response.data.problem;
  },

  submitAnswer: async (
    problemId: string,
    sessionId: string,
    studentId: string,
    answer: number,
    timeSpent?: number
  ): Promise<AnswerResult> => {
    const response = await api.post('/api/game/answer', {
      problem_id: problemId,
      session_id: sessionId,
      student_id: studentId,
      answer,
      time_spent: timeSpent,
    });
    return response.data;
  },

  endSession: async (sessionId: string): Promise<GameSession> => {
    const response = await api.post(`/api/game/session/${sessionId}/end`);
    return response.data.session;
  },
};

// Student API
export const studentApi = {
  getProgress: async (studentId: string): Promise<StudentProgress | null> => {
    const response = await api.get(`/api/student/${studentId}/progress`);
    return response.data.progress;
  },

  getSessionHistory: async (studentId: string, limit = 10): Promise<GameSession[]> => {
    const response = await api.get(`/api/student/${studentId}/sessions?limit=${limit}`);
    return response.data.sessions;
  },

  createStudent: async (name: string, email?: string, gradeLevel?: string): Promise<any> => {
    const response = await api.post('/api/student/create', {
      name,
      email,
      grade_level: gradeLevel,
    });
    return response.data.student;
  },
};

export default api;
