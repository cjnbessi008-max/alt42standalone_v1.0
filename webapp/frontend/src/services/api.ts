import axios from 'axios';

const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Concepts
export const getConceptsconst = () => api.get('/concepts');
export const getConceptById = (id: number) => api.get(`/concepts/${id}`);
export const getConceptProblems = (id: number) => api.get(`/concepts/${id}/problems`);

// Problems
export const getProblems = () => api.get('/problems');
export const getProblemById = (id: number) => api.get(`/problems/${id}`);

// Students
export const getStudents = () => api.get('/students');
export const getStudentById = (id: number) => api.get(`/students/${id}`);
export const createStudent = (data: any) => api.post('/students', data);

// Progress
export const getStudentProgress = (studentId: number) =>
  api.get(`/progress/${studentId}`);
export const submitProgress = (studentId: number, data: any) =>
  api.post(`/progress/${studentId}`, data);

// Recommendations
export const getRecommendations = (studentId: number, limit = 10) =>
  api.get(`/recommendations/${studentId}?limit=${limit}`);

// Graph
export const getGraphData = (params?: any) =>
  api.get('/graph', { params });

// Analytics
export const getAnalytics = (studentId: number) =>
  api.get(`/analytics/${studentId}`);
