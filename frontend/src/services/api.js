import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Practice API Service
 */
export const practiceAPI = {
  // Get next problem
  getNextProblem: (moduleId) => {
    return apiClient.get(`/practice/modules/${moduleId}/next-problem`);
  },

  // Get specific problem
  getProblemById: (moduleId, problemId) => {
    return apiClient.get(`/practice/modules/${moduleId}/problems/${problemId}`);
  },

  // Submit answer
  submitAnswer: (moduleId, data) => {
    return apiClient.post(`/practice/modules/${moduleId}/submit-answer`, data);
  },

  // Get practice suggestion
  getPracticeSuggestion: (moduleId) => {
    return apiClient.get(`/practice/modules/${moduleId}/practice-suggestion`);
  },

  // Start practice more session
  startPracticeMore: (moduleId) => {
    return apiClient.post(`/practice/modules/${moduleId}/practice-more`);
  },

  // Request hint
  requestHint: (moduleId, data) => {
    return apiClient.post(`/practice/modules/${moduleId}/request-hint`, data);
  },
};

/**
 * Progress API Service
 */
export const progressAPI = {
  // Get student progress
  getProgress: (moduleId) => {
    return apiClient.get(`/progress/modules/${moduleId}`);
  },

  // Get progress history
  getProgressHistory: (moduleId, params = {}) => {
    return apiClient.get(`/progress/modules/${moduleId}/history`, { params });
  },

  // Get mastery metrics
  getMasteryMetrics: (moduleId) => {
    return apiClient.get(`/progress/modules/${moduleId}/mastery`);
  },
};

export default apiClient;
