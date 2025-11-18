import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Concept Summary API
 */
export const conceptAPI = {
  /**
   * Generate a one-line summary for a concept
   */
  generateSummary: async (data) => {
    const response = await api.post('/api/concepts/generate-summary', data);
    return response.data;
  },

  /**
   * Generate summaries for multiple concepts
   */
  generateBatchSummaries: async (concepts, gradeLevel, moduleContext = null) => {
    const response = await api.post('/api/concepts/generate-batch', {
      concepts,
      grade_level: gradeLevel,
      module_context: moduleContext,
    });
    return response.data;
  },

  /**
   * Validate a concept summary
   */
  validateSummary: async (conceptName, summary, gradeLevel) => {
    const response = await api.post('/api/concepts/validate-summary', {
      concept_name: conceptName,
      summary,
      grade_level: gradeLevel,
    });
    return response.data;
  },

  /**
   * Regenerate a summary with feedback
   */
  regenerateSummary: async (conceptName, gradeLevel, feedback = null, previousSummary = null) => {
    const response = await api.post('/api/concepts/regenerate-summary', {
      concept_name: conceptName,
      grade_level: gradeLevel,
      feedback,
      previous_summary: previousSummary,
    });
    return response.data;
  },

  /**
   * Health check
   */
  healthCheck: async () => {
    const response = await api.get('/api/concepts/health');
    return response.data;
  },
};

/**
 * Module API
 */
export const moduleAPI = {
  /**
   * Get all modules
   */
  getModules: async () => {
    const response = await api.get('/api/modules');
    return response.data;
  },

  /**
   * Get module by ID
   */
  getModule: async (id) => {
    const response = await api.get(`/api/modules/${id}`);
    return response.data;
  },

  /**
   * Get concepts for a module
   */
  getModuleConcepts: async (id) => {
    const response = await api.get(`/api/modules/${id}/concepts`);
    return response.data;
  },
};

export default api;
