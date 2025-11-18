import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * Problem API calls
 */
export const problemAPI = {
  // Get all problems
  getAll: async () => {
    const response = await api.get('/api/problems');
    return response.data;
  },

  // Get problem by ID
  getById: async (id) => {
    const response = await api.get(`/api/problems/${id}`);
    return response.data;
  },

  // Get problem by Moodle ID
  getByMoodleId: async (moodleId) => {
    const response = await api.get(`/api/problems/moodle/${moodleId}`);
    return response.data;
  },

  // Get smooth intervals
  getSmoothIntervals: async (id) => {
    const response = await api.get(`/api/problems/${id}/smooth-intervals`);
    return response.data;
  },

  // Create problem
  create: async (problemData) => {
    const response = await api.post('/api/problems', problemData);
    return response.data;
  }
};

/**
 * Moodle API calls
 */
export const moodleAPI = {
  // Test connection
  testConnection: async () => {
    const response = await api.get('/api/moodle/test');
    return response.data;
  },

  // Sync problem from Moodle
  syncProblem: async (questionId) => {
    const response = await api.post(`/api/moodle/sync/${questionId}`);
    return response.data;
  },

  // Get course
  getCourse: async (courseId) => {
    const response = await api.get(`/api/moodle/course/${courseId}`);
    return response.data;
  }
};

export default api;
