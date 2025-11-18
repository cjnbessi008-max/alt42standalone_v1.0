import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const problemsAPI = {
  getAll: () => api.get('/problems'),
  getById: (id) => api.get(`/problems/${id}`),
};

export const attemptsAPI = {
  submit: (data) => api.post('/attempts', data),
};

export const mistakeCategoriesAPI = {
  getAll: () => api.get('/mistake-categories'),
  submit: (data) => api.post('/mistake-classifications', data),
};

export const studentProgressAPI = {
  getByName: (name) => api.get(`/student-progress/${name}`),
};

export default api;
