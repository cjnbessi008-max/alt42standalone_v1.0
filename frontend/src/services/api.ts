// API service for communicating with backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new APIError(response.status, error.error || 'Request failed');
  }

  return response.json();
}

// Problem API
export const problemAPI = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return fetchAPI<{ problems: any[] }>(`/api/problems${query}`);
  },

  getById: (id: string) => {
    return fetchAPI<any>(`/api/problems/${id}`);
  },

  getRandom: (quantifierType?: string) => {
    const query = quantifierType ? `?quantifierType=${quantifierType}` : '';
    return fetchAPI<any>(`/api/problems/random${query}`);
  },

  create: (data: any) => {
    return fetchAPI<any>('/api/problems', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Submission API
export const submissionAPI = {
  submit: (data: any) => {
    return fetchAPI<any>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getById: (id: string) => {
    return fetchAPI<any>(`/api/submissions/${id}`);
  },

  getByStudent: (studentId: string) => {
    return fetchAPI<{ submissions: any[] }>(`/api/submissions/student/${studentId}`);
  },
};

// Progress API
export const progressAPI = {
  get: (studentId: string) => {
    return fetchAPI<any>(`/api/progress/${studentId}`);
  },

  update: (studentId: string, data: any) => {
    return fetchAPI<any>(`/api/progress/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getLeaderboard: () => {
    return fetchAPI<{ leaderboard: any[] }>('/api/progress/leaderboard/top');
  },
};

// Moodle API
export const moodleAPI = {
  sync: (data: { quizId: number; courseId: number }) => {
    return fetchAPI<any>('/api/moodle/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  sendResults: (data: any) => {
    return fetchAPI<any>('/api/moodle/results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getQuizzes: (courseId: number) => {
    return fetchAPI<{ quizzes: any[] }>(`/api/moodle/quizzes?courseId=${courseId}`);
  },
};

export default {
  problem: problemAPI,
  submission: submissionAPI,
  progress: progressAPI,
  moodle: moodleAPI,
};
