import { create } from 'zustand';
import { Student, StudentScore, StudentScoreTrend } from './types';
import { studentsApi, scoresApi } from './api';

interface AppState {
  students: Student[];
  selectedStudent: Student | null;
  studentScores: StudentScore[];
  scoreTrend: StudentScoreTrend | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchStudents: () => Promise<void>;
  fetchLatestScores: () => Promise<void>;
  fetchStudentScoreTrend: (studentId: number, days?: number) => Promise<void>;
  selectStudent: (student: Student | null) => void;
  recalculateScores: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  students: [],
  selectedStudent: null,
  studentScores: [],
  scoreTrend: null,
  loading: false,
  error: null,

  fetchStudents: async () => {
    set({ loading: true, error: null });
    try {
      const students = await studentsApi.getAll();
      set({ students, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch students', loading: false });
      console.error('Error fetching students:', error);
    }
  },

  fetchLatestScores: async () => {
    set({ loading: true, error: null });
    try {
      const scores = await scoresApi.getLatest();
      set({ studentScores: scores, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch latest scores', loading: false });
      console.error('Error fetching scores:', error);
    }
  },

  fetchStudentScoreTrend: async (studentId: number, days: number = 30) => {
    set({ loading: true, error: null });
    try {
      const trend = await studentsApi.getScoreTrend(studentId, days);
      set({ scoreTrend: trend, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch score trend', loading: false });
      console.error('Error fetching score trend:', error);
    }
  },

  selectStudent: (student: Student | null) => {
    set({ selectedStudent: student, scoreTrend: null });
    if (student) {
      get().fetchStudentScoreTrend(student.id);
    }
  },

  recalculateScores: async () => {
    set({ loading: true, error: null });
    try {
      await scoresApi.calculate();
      await get().fetchLatestScores();
      if (get().selectedStudent) {
        await get().fetchStudentScoreTrend(get().selectedStudent!.id);
      }
      set({ loading: false });
    } catch (error) {
      set({ error: 'Failed to recalculate scores', loading: false });
      console.error('Error recalculating scores:', error);
    }
  },
}));
