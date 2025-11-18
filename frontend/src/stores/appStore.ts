import { create } from 'zustand';
import { Problem, StudentSession } from '@/types';
import api from '@/services/api';

interface AppStore {
  // State
  currentSession: StudentSession | null;
  currentProblem: Problem | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  initSession: (student_name?: string, moodle_user_id?: number) => Promise<void>;
  loadProblem: (filters?: any) => Promise<void>;
  submitAnswer: (
    answer: string,
    timeSpent?: number,
    interactionData?: any
  ) => Promise<boolean>;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial State
  currentSession: null,
  currentProblem: null,
  isLoading: false,
  error: null,

  // Initialize or get session
  initSession: async (student_name?: string, moodle_user_id?: number) => {
    set({ isLoading: true, error: null });

    try {
      // Check if session exists in localStorage
      const savedSessionId = localStorage.getItem('mathgarden_session_id');
      let session: StudentSession;

      if (savedSessionId) {
        try {
          session = await api.getSession(savedSessionId);
        } catch (error) {
          // Session not found, create new one
          session = await api.createSession(student_name, moodle_user_id);
          localStorage.setItem('mathgarden_session_id', session.session_id);
        }
      } else {
        session = await api.createSession(student_name, moodle_user_id);
        localStorage.setItem('mathgarden_session_id', session.session_id);
      }

      set({ currentSession: session, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to initialize session',
        isLoading: false,
      });
    }
  },

  // Load a random problem
  loadProblem: async (filters?: any) => {
    set({ isLoading: true, error: null });

    try {
      const problem = await api.getRandomProblem(filters);
      set({ currentProblem: problem, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load problem',
        isLoading: false,
      });
    }
  },

  // Submit answer
  submitAnswer: async (
    answer: string,
    timeSpent?: number,
    interactionData?: any
  ) => {
    const { currentSession, currentProblem } = get();

    if (!currentSession || !currentProblem) {
      set({ error: 'No active session or problem' });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const result = await api.submitAttempt(
        currentSession.session_id,
        currentProblem.id,
        answer,
        timeSpent,
        interactionData
      );

      // Update session stats
      const updatedSession = await api.getSession(currentSession.session_id);
      set({ currentSession: updatedSession, isLoading: false });

      return result.is_correct;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to submit answer',
        isLoading: false,
      });
      return false;
    }
  },

  // Error management
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),

  // Reset state
  reset: () =>
    set({
      currentSession: null,
      currentProblem: null,
      isLoading: false,
      error: null,
    }),
}));
