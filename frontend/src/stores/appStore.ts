/**
 * Application State Store
 * Global state management using Zustand
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppState, Question, Student } from '@types/index';

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      currentQuestion: null,
      currentStudent: null,
      sessionId: null,
      isLoading: false,
      error: null,

      setCurrentQuestion: (question) =>
        set({ currentQuestion: question }, false, 'setCurrentQuestion'),

      setCurrentStudent: (student) =>
        set({ currentStudent: student }, false, 'setCurrentStudent'),

      setSessionId: (sessionId) =>
        set({ sessionId }, false, 'setSessionId'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      setError: (error) =>
        set({ error }, false, 'setError'),

      reset: () =>
        set(
          {
            currentQuestion: null,
            currentStudent: null,
            sessionId: null,
            isLoading: false,
            error: null,
          },
          false,
          'reset'
        ),
    }),
    { name: 'AppStore' }
  )
);
