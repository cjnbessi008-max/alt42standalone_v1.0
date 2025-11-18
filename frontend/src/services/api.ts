import axios from 'axios';

const API_BASE_URL = '/api';

export interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  priority_flag: 'important' | 'solve_first' | 'review' | null;
  created_at: string;
  updated_at: string;
}

export interface ProblemFilters {
  priority?: string;
  difficulty?: string;
  subject?: string;
  sort?: string;
}

export interface Stats {
  total: { count: number };
  by_priority: Array<{ priority_flag: string | null; count: number }>;
  by_difficulty: Array<{ difficulty: string; count: number }>;
  by_subject: Array<{ subject: string; count: number }>;
}

export const problemsAPI = {
  getAll: async (filters?: ProblemFilters): Promise<Problem[]> => {
    const params = new URLSearchParams();
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.subject) params.append('subject', filters.subject);
    if (filters?.sort) params.append('sort', filters.sort);

    const response = await axios.get<Problem[]>(`${API_BASE_URL}/problems?${params}`);
    return response.data;
  },

  getById: async (id: number): Promise<Problem> => {
    const response = await axios.get<Problem>(`${API_BASE_URL}/problems/${id}`);
    return response.data;
  },

  create: async (problem: Omit<Problem, 'id' | 'created_at' | 'updated_at'>): Promise<Problem> => {
    const response = await axios.post<Problem>(`${API_BASE_URL}/problems`, problem);
    return response.data;
  },

  updatePriority: async (id: number, priority_flag: string | null): Promise<Problem> => {
    const response = await axios.patch<Problem>(`${API_BASE_URL}/problems/${id}/priority`, {
      priority_flag,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/problems/${id}`);
  },

  getStats: async (): Promise<Stats> => {
    const response = await axios.get<Stats>(`${API_BASE_URL}/problems/stats/summary`);
    return response.data;
  },
};
