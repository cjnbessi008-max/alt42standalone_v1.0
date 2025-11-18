/**
 * Zustand store for metacognition state management
 */

import { create } from 'zustand';
import type { MetacognitionState, CurrentActivity, ReflectionPrompt } from '../../../shared/types';

interface MetacognitionStore {
  metacognitionState: MetacognitionState | null;
  currentActivity: CurrentActivity | null;
  reflectionPrompts: ReflectionPrompt[];
  focusAlerts: any[];
  setMetacognitionState: (state: MetacognitionState) => void;
  setCurrentActivity: (activity: CurrentActivity | null) => void;
  addReflectionPrompt: (prompt: ReflectionPrompt) => void;
  addFocusAlert: (alert: any) => void;
  clearFocusAlerts: () => void;
}

export const useMetacognitionStore = create<MetacognitionStore>((set) => ({
  metacognitionState: null,
  currentActivity: null,
  reflectionPrompts: [],
  focusAlerts: [],

  setMetacognitionState: (state: MetacognitionState) =>
    set({
      metacognitionState: state,
      currentActivity: state.currentActivity,
      reflectionPrompts: state.reflectionPrompts
    }),

  setCurrentActivity: (activity: CurrentActivity | null) =>
    set({ currentActivity: activity }),

  addReflectionPrompt: (prompt: ReflectionPrompt) =>
    set((state) => ({
      reflectionPrompts: [...state.reflectionPrompts, prompt]
    })),

  addFocusAlert: (alert: any) =>
    set((state) => ({
      focusAlerts: [...state.focusAlerts, alert]
    })),

  clearFocusAlerts: () =>
    set({ focusAlerts: [] })
}));
