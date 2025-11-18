import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

// Modules API
export const getAllModules = () => apiClient.get('/modules');

export const getModuleById = (id) => apiClient.get(`/modules/${id}`);

export const createModule = (moduleData) => apiClient.post('/modules', moduleData);

export const updateModule = (id, moduleData) => apiClient.put(`/modules/${id}`, moduleData);

export const deleteModule = (id) => apiClient.delete(`/modules/${id}`);

export const startGeneration = (id) => apiClient.post(`/modules/${id}/generate`);

export const getGenerationStatus = (id) => apiClient.get(`/modules/${id}/status`);

// Case Roadmap API
export const getCaseRoadmap = (moduleId) => apiClient.get(`/case-roadmap/${moduleId}`);

export const getPipelineProgress = (moduleId) =>
  apiClient.get(`/case-roadmap/${moduleId}/pipeline`);

export const completePipelineStage = (moduleId, stage, data) =>
  apiClient.post(`/case-roadmap/${moduleId}/pipeline/${stage}/complete`, data);

export const getAllActiveCases = () => apiClient.get('/case-roadmap/active');

export default apiClient;
