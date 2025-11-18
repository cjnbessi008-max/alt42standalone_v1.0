import { create } from 'zustand';
import { Problem, SubmitAnswerResponse, Fraction } from '../types';

interface AppState {
  // Current user (temporary - will be replaced with auth)
  currentStudentId: string;

  // Current problem
  currentProblem: Problem | null;
  setCurrentProblem: (problem: Problem | null) => void;

  // Answer state
  studentAnswer: Fraction | null;
  setStudentAnswer: (answer: Fraction | null) => void;

  // Submission result
  submissionResult: SubmitAnswerResponse | null;
  setSubmissionResult: (result: SubmitAnswerResponse | null) => void;

  // Timer
  startTime: number | null;
  setStartTime: (time: number | null) => void;
  getTimeSpent: () => number;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // Reset state
  reset: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  currentStudentId: '00000000-0000-0000-0000-000000000001', // Demo student
  currentProblem: null,
  studentAnswer: null,
  submissionResult: null,
  startTime: null,
  isLoading: false,
  error: null,

  // Actions
  setCurrentProblem: (problem) => set({ currentProblem: problem, startTime: Date.now() }),

  setStudentAnswer: (answer) => set({ studentAnswer: answer }),

  setSubmissionResult: (result) => set({ submissionResult: result }),

  setStartTime: (time) => set({ startTime: time }),

  getTimeSpent: () => {
    const { startTime } = get();
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  },

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      currentProblem: null,
      studentAnswer: null,
      submissionResult: null,
      startTime: null,
      error: null,
    }),
}));
