import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';

const api = axios.create({
  baseURL: `${API_BASE_URL}${API_V1_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Problems API
export const problemsAPI = {
  list: (params?: any) => api.get('/problems', { params }),
  get: (id: string) => api.get(`/problems/${id}`),
  create: (data: any) => api.post('/problems', data),
  update: (id: string, data: any) => api.put(`/problems/${id}`, data),
  delete: (id: string) => api.delete(`/problems/${id}`),
};

// Solutions API
export const solutionsAPI = {
  list: (params?: any) => api.get('/solutions', { params }),
  get: (id: string) => api.get(`/solutions/${id}`),
  create: (data: any) => api.post('/solutions', data),
  update: (id: string, data: any) => api.put(`/solutions/${id}`, data),
  submit: (id: string) => api.post(`/solutions/${id}/submit`),
};

// Analysis API
export const analysisAPI = {
  analyze: (solutionId: string) => api.post(`/analysis/solutions/${solutionId}`),
  getResults: (solutionId: string, includeDetails = true) =>
    api.get(`/analysis/solutions/${solutionId}`, { params: { include_details: includeDetails } }),
  getById: (analysisId: string, includeDetails = true) =>
    api.get(`/analysis/${analysisId}`, { params: { include_details: includeDetails } }),
  getGaps: (analysisId: string, severity?: string) =>
    api.get(`/analysis/gaps/${analysisId}`, { params: { severity } }),
};

// Users API
export const usersAPI = {
  list: (params?: any) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  getByUsername: (username: string) => api.get(`/users/username/${username}`),
  create: (data: any) => api.post('/users', data),
};

export default api;
