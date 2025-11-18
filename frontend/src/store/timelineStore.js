import { create } from 'zustand';

export const useTimelineStore = create((set, get) => ({
  // State
  currentTimeline: null,
  steps: [],
  isRecording: false,
  startTime: null,

  // Actions
  startTimeline: (timeline) => {
    set({
      currentTimeline: timeline,
      steps: [],
      isRecording: true,
      startTime: new Date()
    });
  },

  addStep: (step) => {
    set((state) => ({
      steps: [...state.steps, step]
    }));
  },

  completeTimeline: (finalAnswer, isCorrect) => {
    set({
      isRecording: false,
      currentTimeline: {
        ...get().currentTimeline,
        final_answer: finalAnswer,
        is_correct: isCorrect,
        completed_at: new Date()
      }
    });
  },

  resetTimeline: () => {
    set({
      currentTimeline: null,
      steps: [],
      isRecording: false,
      startTime: null
    });
  },

  updateSteps: (steps) => {
    set({ steps });
  }
}));
