import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Routine APIs
export const routineAPI = {
  getTypes: () => api.get('/routines/types'),
  getTypesByCategory: (category: string) => api.get(`/routines/types/category/${category}`),
  getRecommendation: (userId: string) => api.get(`/routines/recommend/${userId}`),
  startRoutine: (data: {
    userId: string;
    routineTypeId: string;
    moodleQuizId?: number;
    moodleAttemptId?: number;
    triggerReason?: string;
  }) => api.post('/routines/start', data),
  completeRoutine: (data: {
    routineRecordId: string;
    rating?: number;
    feedback?: string;
    duration?: number;
  }) => api.post('/routines/complete', data),
  getHistory: (userId: string, limit?: number) =>
    api.get(`/routines/history/${userId}`, { params: { limit } }),
  getStatistics: (userId: string) => api.get(`/routines/statistics/${userId}`),
};

// Moodle APIs
export const moodleAPI = {
  getUser: (userId: number) => api.get(`/moodle/user/${userId}`),
  getRecentAttempts: (afterTimestamp?: number) =>
    api.get('/moodle/attempts/recent', { params: { after: afterTimestamp } }),
  analyzeAttempt: (attemptId: number) => api.get(`/moodle/attempt/${attemptId}/analyze`),
  getUserStreak: (userId: number, limit?: number) =>
    api.get(`/moodle/user/${userId}/streak`, { params: { limit } }),
  getQuiz: (quizId: number) => api.get(`/moodle/quiz/${quizId}`),
};

// User APIs
export const userAPI = {
  syncUser: (moodleUserId: number) => api.post('/users/sync', { moodleUserId }),
  getUser: (userId: string) => api.get(`/users/${userId}`),
  getUserByMoodleId: (moodleUserId: number) => api.get(`/users/moodle/${moodleUserId}`),
  updatePreferences: (userId: string, preferences: any) =>
    api.put(`/users/${userId}/preferences`, { preferences }),
};

// Health API
export const healthAPI = {
  check: () => api.get('/health'),
};
