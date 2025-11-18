import axios from 'axios';
import { Student, StudentTimeline, ModuleTimeline } from '../types/timeline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const timelineApi = {
  // Get list of all students
  getStudents: async (): Promise<Student[]> => {
    const response = await api.get('/timeline/students');
    return response.data;
  },

  // Get complete timeline for a student
  getStudentTimeline: async (
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<StudentTimeline> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await api.get(`/timeline/students/${studentId}`, { params });
    return response.data;
  },

  // Get module-specific timeline for a student
  getModuleTimeline: async (
    studentId: string,
    moduleId: string
  ): Promise<ModuleTimeline> => {
    const response = await api.get(`/timeline/students/${studentId}/modules/${moduleId}`);
    return response.data;
  },
};

export default api;
