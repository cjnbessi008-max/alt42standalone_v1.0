/**
 * Application State Management with Zustand
 */

import { create } from 'zustand';
import type { AppState, LogicFlowGraph, QuizProblem, MoodleConfig } from '@types/index';

interface AppStore extends AppState {
  // Actions
  setCurrentQuestion: (question: QuizProblem | null) => void;
  setLogicFlow: (flow: LogicFlowGraph | null) => void;
  setMoodleConfig: (config: MoodleConfig) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: AppState = {
  currentQuestion: null,
  logicFlow: null,
  moodleConfig: null,
  isLoading: false,
  error: null,
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,

  setCurrentQuestion: (question) => set({ currentQuestion: question }),

  setLogicFlow: (flow) => set({ logicFlow: flow }),

  setMoodleConfig: (config) => set({ moodleConfig: config }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
