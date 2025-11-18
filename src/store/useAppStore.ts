import { create } from 'zustand';
import { AppState, DistributionParams, MoodleQuestion } from '../types';

export const useAppStore = create<AppState>((set) => ({
  currentDistribution: {
    type: 'normal',
    mean: 0,
    stdDev: 1,
  },
  targetDistribution: null,
  isMorphing: false,
  morphProgress: 0,
  moodleQuestion: null,
  isConnectedToMoodle: false,

  setCurrentDistribution: (params: DistributionParams) =>
    set({ currentDistribution: params }),

  setTargetDistribution: (params: DistributionParams | null) =>
    set({ targetDistribution: params }),

  startMorph: () =>
    set({ isMorphing: true, morphProgress: 0 }),

  updateMorphProgress: (progress: number) =>
    set({ morphProgress: progress, isMorphing: progress < 1 }),

  setMoodleQuestion: (question: MoodleQuestion | null) =>
    set({ moodleQuestion: question }),

  setMoodleConnection: (connected: boolean) =>
    set({ isConnectedToMoodle: connected }),
}));
