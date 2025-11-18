import axios from 'axios';

// API base URL - configure this based on your environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);

    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error?.message || 'An error occurred';
      throw new Error(message);
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

/**
 * Fetch a problem
 * @param {number} studentId - Student ID (optional, for personalized problem)
 * @param {number} difficulty - Difficulty level (optional)
 * @returns {Promise<Object>} Problem data
 */
export const fetchProblem = async (studentId = null, difficulty = null) => {
  const params = {};
  if (studentId) params.student_id = studentId;
  if (difficulty) params.difficulty = difficulty;

  const response = await api.get('/problem', { params });
  return response.data;
};

/**
 * Get a specific problem by ID
 * @param {number} problemId - Problem ID
 * @returns {Promise<Object>} Problem data
 */
export const getProblem = async (problemId) => {
  const response = await api.get(`/problem/${problemId}`);
  return response.data;
};

/**
 * Submit an answer
 * @param {Object} submitData - Submission data
 * @param {number} submitData.student_id - Student ID
 * @param {number} submitData.problem_id - Problem ID
 * @param {number} submitData.answer - Student's answer
 * @param {number} submitData.time_spent - Time spent in seconds
 * @param {boolean} submitData.hint_used - Whether hint was used
 * @param {string} submitData.session_id - Session ID (optional)
 * @returns {Promise<Object>} Result data with feedback
 */
export const submitAnswer = async (submitData) => {
  const response = await api.post('/submit', submitData);
  return response.data;
};

/**
 * Get hint for a problem
 * @param {number} problemId - Problem ID
 * @returns {Promise<Object>} Hint data
 */
export const getHint = async (problemId) => {
  const response = await api.post('/problem/hint', { problem_id: problemId });
  return response.data;
};

/**
 * Get step-by-step solution
 * @param {number} problemId - Problem ID
 * @returns {Promise<Object>} Steps data
 */
export const getSteps = async (problemId) => {
  const response = await api.post('/problem/steps', { problem_id: problemId });
  return response.data;
};

/**
 * Get student progress
 * @param {number} studentId - Student ID
 * @returns {Promise<Object>} Progress data
 */
export const getProgress = async (studentId) => {
  const response = await api.get(`/progress/${studentId}`, {
    params: { action: 'summary' }
  });
  return response.data;
};

/**
 * Get recent attempts
 * @param {number} studentId - Student ID
 * @param {number} limit - Number of attempts to fetch
 * @returns {Promise<Object>} Recent attempts data
 */
export const getRecentAttempts = async (studentId, limit = 10) => {
  const response = await api.get(`/progress/${studentId}`, {
    params: { action: 'recent', limit }
  });
  return response.data;
};

/**
 * Get leaderboard
 * @param {number} limit - Number of students to fetch
 * @param {string} timeframe - Timeframe ('all', 'today', 'week', 'month')
 * @returns {Promise<Object>} Leaderboard data
 */
export const getLeaderboard = async (limit = 10, timeframe = 'all') => {
  const response = await api.get('/progress/0', {
    params: { action: 'leaderboard', limit, timeframe }
  });
  return response.data;
};

/**
 * Search problems
 * @param {Object} filters - Search filters
 * @param {number} filters.difficulty - Difficulty level
 * @param {number} filters.base - Logarithm base
 * @param {string} filters.type - Problem type
 * @returns {Promise<Object>} Search results
 */
export const searchProblems = async (filters = {}) => {
  const response = await api.get('/problem', { params: filters });
  return response.data;
};

export default api;
