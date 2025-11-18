/**
 * Game state management hook
 */
import { create } from 'zustand';
import type { Problem, Attempt, GameState } from '../types';

interface GameStore extends GameState {
  setCurrentProblem: (problem: Problem | null) => void;
  setCurrentSequence: (sequence: string[]) => void;
  swapElements: (index1: number, index2: number) => void;
  resetSequence: () => void;
  startGame: (problem: Problem) => void;
  endGame: () => void;
  setLastAttempt: (attempt: Attempt) => void;
  incrementTime: () => void;
  incrementAttempt: () => void;
}

export const useGameState = create<GameStore>((set, get) => ({
  currentProblem: null,
  currentSequence: [],
  timeElapsed: 0,
  attemptNumber: 0,
  isPlaying: false,
  lastAttempt: null,

  setCurrentProblem: (problem) => set({ currentProblem: problem }),

  setCurrentSequence: (sequence) => set({ currentSequence: sequence }),

  swapElements: (index1, index2) => {
    const { currentSequence } = get();
    const newSequence = [...currentSequence];
    [newSequence[index1], newSequence[index2]] = [newSequence[index2], newSequence[index1]];
    set({ currentSequence: newSequence });
  },

  resetSequence: () => {
    const { currentProblem } = get();
    if (currentProblem) {
      set({ currentSequence: [...currentProblem.initial_sequence] });
    }
  },

  startGame: (problem) =>
    set({
      currentProblem: problem,
      currentSequence: [...problem.initial_sequence],
      timeElapsed: 0,
      attemptNumber: 0,
      isPlaying: true,
      lastAttempt: null,
    }),

  endGame: () => set({ isPlaying: false }),

  setLastAttempt: (attempt) => set({ lastAttempt: attempt }),

  incrementTime: () => set((state) => ({ timeElapsed: state.timeElapsed + 1 })),

  incrementAttempt: () => set((state) => ({ attemptNumber: state.attemptNumber + 1 })),
}));
