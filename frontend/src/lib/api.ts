import axios, { AxiosError } from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginInput,
  RegisterInput,
  User,
  Problem,
  CreateProblemInput,
  Story,
  GenerateStoryInput,
  StudentAnalytics,
  StudentProgress,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data!;
  },

  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data!;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Problem API
export const problemApi = {
  create: async (data: CreateProblemInput): Promise<Problem> => {
    const response = await api.post<ApiResponse<Problem>>('/problems', data);
    return response.data.data!;
  },

  getAll: async (filters?: {
    subject?: string;
    topic?: string;
    difficulty?: string;
    type?: string;
  }): Promise<Problem[]> => {
    const response = await api.get<ApiResponse<Problem[]>>('/problems', { params: filters });
    return response.data.data!;
  },

  getById: async (id: string): Promise<Problem> => {
    const response = await api.get<ApiResponse<Problem>>(`/problems/${id}`);
    return response.data.data!;
  },

  update: async (id: string, data: Partial<CreateProblemInput>): Promise<Problem> => {
    const response = await api.put<ApiResponse<Problem>>(`/problems/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/problems/${id}`);
  },

  getStats: async (): Promise<any> => {
    const response = await api.get<ApiResponse<any>>('/problems/stats');
    return response.data.data!;
  },
};

// Story API
export const storyApi = {
  generate: async (data: GenerateStoryInput): Promise<Story> => {
    const response = await api.post<ApiResponse<Story>>('/stories/generate', data);
    return response.data.data!;
  },

  getAll: async (filters?: { theme?: string }): Promise<Story[]> => {
    const response = await api.get<ApiResponse<Story[]>>('/stories', { params: filters });
    return response.data.data!;
  },

  getById: async (id: string): Promise<Story> => {
    const response = await api.get<ApiResponse<Story>>(`/stories/${id}`);
    return response.data.data!;
  },

  getByProblemId: async (problemId: string): Promise<Story[]> => {
    const response = await api.get<ApiResponse<Story[]>>(`/stories/problem/${problemId}`);
    return response.data.data!;
  },

  regenerate: async (id: string, theme?: string): Promise<Story> => {
    const response = await api.put<ApiResponse<Story>>(`/stories/${id}/regenerate`, { theme });
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/stories/${id}`);
  },
};

// Student API
export const studentApi = {
  getAvailableStories: async (): Promise<Story[]> => {
    const response = await api.get<ApiResponse<Story[]>>('/student/stories');
    return response.data.data!;
  },

  startStory: async (storyId: string): Promise<{ progress: StudentProgress; story: Story }> => {
    const response = await api.post<ApiResponse<{ progress: StudentProgress; story: Story }>>(
      '/student/stories/start',
      { storyId }
    );
    return response.data.data!;
  },

  completeStory: async (
    storyId: string,
    data: {
      choicesMade: string[];
      isCorrect: boolean;
      timeSpent: number;
    }
  ): Promise<StudentProgress> => {
    const response = await api.post<ApiResponse<StudentProgress>>(
      `/student/stories/${storyId}/complete`,
      data
    );
    return response.data.data!;
  },

  getProgress: async (): Promise<StudentProgress[]> => {
    const response = await api.get<ApiResponse<StudentProgress[]>>('/student/progress');
    return response.data.data!;
  },

  getAnalytics: async (): Promise<StudentAnalytics> => {
    const response = await api.get<ApiResponse<StudentAnalytics>>('/student/analytics');
    return response.data.data!;
  },

  getStoryProgress: async (storyId: string): Promise<StudentProgress[]> => {
    const response = await api.get<ApiResponse<StudentProgress[]>>(
      `/student/stories/${storyId}/progress`
    );
    return response.data.data!;
  },
};

export default api;
