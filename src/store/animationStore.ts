import { create } from 'zustand';
import { ProblemData, AnimationState } from '../types';

interface AnimationStore extends AnimationState {
  currentProblem: ProblemData | null;

  // Actions
  setCurrentProblem: (problem: ProblemData | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setProgress: (progress: number) => void;
  setCurrentOverlap: (overlap: number) => void;
  setPaused: (isPaused: boolean) => void;
  reset: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
}

const initialState: AnimationState = {
  isPlaying: false,
  progress: 0,
  currentOverlap: 0,
  isPaused: false,
};

export const useAnimationStore = create<AnimationStore>((set) => ({
  ...initialState,
  currentProblem: null,

  setCurrentProblem: (problem) => set({ currentProblem: problem }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setProgress: (progress) => set({ progress }),

  setCurrentOverlap: (overlap) => set({ currentOverlap: overlap }),

  setPaused: (isPaused) => set({ isPaused }),

  reset: () => set({ ...initialState }),

  play: () => set({ isPlaying: true, isPaused: false }),

  pause: () => set({ isPaused: true }),

  stop: () => set({ isPlaying: false, isPaused: false, progress: 0 }),
}));
