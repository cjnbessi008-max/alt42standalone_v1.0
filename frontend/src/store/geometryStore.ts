/**
 * Unfolding Net Live - State Management
 * Zustand를 사용한 전개도 상태 관리
 */

import { create } from 'zustand';
import {
  GeometryState,
  AnimationState,
  UnfoldingProblem,
  AnimationConfig,
  InteractionEvent,
} from '../types/geometry';

interface GeometryStore extends GeometryState {
  // Actions
  setProblem: (problem: UnfoldingProblem) => void;
  setAnimationState: (state: AnimationState) => void;
  setAnimationProgress: (progress: number) => void;
  updateAnimationConfig: (config: Partial<AnimationConfig>) => void;
  selectFace: (faceId: string | null) => void;
  addInteraction: (event: InteractionEvent) => void;
  reset: () => void;

  // Animation controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleAnimation: () => void;
}

const initialState: GeometryState = {
  currentProblem: null,
  animationState: AnimationState.IDLE,
  animationProgress: 0,
  animationConfig: {
    speed: 1.0,
    autoReverse: false,
    pauseOnComplete: true,
    duration: 3000,
  },
  selectedFaceId: null,
  interactionHistory: [],
};

export const useGeometryStore = create<GeometryStore>((set, get) => ({
  ...initialState,

  setProblem: (problem) => set({
    currentProblem: problem,
    animationProgress: 0,
    animationState: AnimationState.IDLE,
    selectedFaceId: null,
  }),

  setAnimationState: (state) => set({ animationState: state }),

  setAnimationProgress: (progress) => {
    const clamped = Math.max(0, Math.min(1, progress));
    set({ animationProgress: clamped });

    // Auto-pause on complete
    const { animationConfig, animationState } = get();
    if (clamped >= 1 && animationConfig.pauseOnComplete && animationState === AnimationState.UNFOLDING) {
      set({ animationState: AnimationState.PAUSED });
    }
  },

  updateAnimationConfig: (config) => set((state) => ({
    animationConfig: { ...state.animationConfig, ...config },
  })),

  selectFace: (faceId) => set({ selectedFaceId: faceId }),

  addInteraction: (event) => set((state) => ({
    interactionHistory: [...state.interactionHistory.slice(-99), event], // Keep last 100 events
  })),

  reset: () => set(initialState),

  // Animation controls
  play: () => {
    const { animationProgress } = get();
    if (animationProgress >= 1) {
      set({ animationProgress: 0, animationState: AnimationState.UNFOLDING });
    } else {
      set({ animationState: AnimationState.UNFOLDING });
    }
  },

  pause: () => set({ animationState: AnimationState.PAUSED }),

  stop: () => set({
    animationState: AnimationState.IDLE,
    animationProgress: 0,
  }),

  toggleAnimation: () => {
    const { animationState, animationProgress } = get();

    if (animationState === AnimationState.UNFOLDING) {
      set({ animationState: AnimationState.PAUSED });
    } else if (animationState === AnimationState.PAUSED) {
      set({ animationState: AnimationState.UNFOLDING });
    } else {
      // IDLE or FOLDING
      if (animationProgress >= 1) {
        set({ animationProgress: 0, animationState: AnimationState.UNFOLDING });
      } else {
        set({ animationState: AnimationState.UNFOLDING });
      }
    }
  },
}));
