import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('moodle_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API methods
export const combinationBlocksAPI = {
  // Get all blocks
  getAllBlocks: async () => {
    const response = await api.get('/blocks');
    return response.data;
  },

  // Get block by ID
  getBlockById: async (id) => {
    const response = await api.get(`/blocks/${id}`);
    return response.data;
  },

  // Submit attempt
  submitAttempt: async (attemptData) => {
    const response = await api.post('/attempts', attemptData);
    return response.data;
  },

  // Get user progress
  getProgress: async (userId, blockId) => {
    const response = await api.get(`/progress/${userId}/${blockId}`);
    return response.data;
  },

  // Get hints
  getHints: async (blockId) => {
    const response = await api.get(`/hints/${blockId}`);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
