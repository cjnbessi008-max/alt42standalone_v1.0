import { create } from 'zustand';
import type { Student, LearningSession, EmotionRecord } from '../types';

interface AppStore {
  currentStudent: Student | null;
  activeSession: LearningSession | null;
  recentEmotions: EmotionRecord[];

  setCurrentStudent: (student: Student | null) => void;
  setActiveSession: (session: LearningSession | null) => void;
  setRecentEmotions: (emotions: EmotionRecord[]) => void;
  addEmotion: (emotion: EmotionRecord) => void;
}

export const useStore = create<AppStore>((set) => ({
  currentStudent: null,
  activeSession: null,
  recentEmotions: [],

  setCurrentStudent: (student) => set({ currentStudent: student }),
  setActiveSession: (session) => set({ activeSession: session }),
  setRecentEmotions: (emotions) => set({ recentEmotions: emotions }),
  addEmotion: (emotion) =>
    set((state) => ({
      recentEmotions: [emotion, ...state.recentEmotions].slice(0, 50),
    })),
}));
