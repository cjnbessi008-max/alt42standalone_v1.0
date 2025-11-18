/**
 * API service layer
 */
import axios from 'axios';
import type { Student, Problem, Attempt, StudentProgress, DifficultyLevel } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Student APIs
export const studentApi = {
  getById: (id: number) => api.get<Student>(`/students/${id}`),
  getByMoodleId: (moodleId: number) => api.get<Student>(`/students/moodle/${moodleId}`),
  create: (student: Partial<Student>) => api.post<Student>('/students/', student),
  syncFromMoodle: (moodleId: number) => api.post<Student>(`/students/sync/${moodleId}`),
};

// Problem APIs
export const problemApi = {
  getAll: (params?: {
    difficulty?: DifficultyLevel;
    pattern_type_id?: number;
    is_active?: boolean;
  }) => api.get<Problem[]>('/problems/', { params }),
  getById: (id: number) => api.get<Problem>(`/problems/${id}`),
  getRandomNext: (params?: {
    difficulty?: DifficultyLevel;
    pattern_type_id?: number;
  }) => api.get<Problem>('/problems/random/next', { params }),
  getPatternTypes: () => api.get('/problems/pattern-types'),
};

// Attempt APIs
export const attemptApi = {
  submit: (attempt: {
    problem_id: number;
    student_id: number;
    submitted_sequence: string[];
    time_spent_seconds?: number;
  }) => api.post<Attempt>('/attempts/', attempt),
  getStudentAttempts: (studentId: number, params?: { skip?: number; limit?: number }) =>
    api.get<Attempt[]>(`/attempts/student/${studentId}`, { params }),
  getStudentProgress: (studentId: number) =>
    api.get<StudentProgress[]>(`/attempts/progress/${studentId}`),
};

export default api;
