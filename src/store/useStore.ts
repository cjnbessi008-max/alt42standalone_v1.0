import { create } from 'zustand';
import { AppState, VisualizationSettings } from '../types';

const defaultVisualizationSettings: VisualizationSettings = {
  minValue: -10,
  maxValue: 10,
  resolution: 200,
  lightColor: '#FFD700',
  backgroundColor: '#1a1a1a',
};

export const useStore = create<AppState>((set) => ({
  currentProblem: null,
  inequality: null,
  visualizationSettings: defaultVisualizationSettings,
  isLoading: false,
  error: null,

  setCurrentProblem: (problem) => set({ currentProblem: problem }),

  setInequality: (inequality) => set({ inequality }),

  updateVisualizationSettings: (settings) =>
    set((state) => ({
      visualizationSettings: { ...state.visualizationSettings, ...settings },
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set({
    currentProblem: null,
    inequality: null,
    visualizationSettings: defaultVisualizationSettings,
    isLoading: false,
    error: null,
  }),
}));
