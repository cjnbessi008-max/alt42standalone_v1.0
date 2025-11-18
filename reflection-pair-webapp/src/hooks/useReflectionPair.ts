import { create } from 'zustand';
import { ReflectionPairStore, ProblemConfig, ViewportState, InteractionEvent } from '../types';

const DEFAULT_CONFIG: ProblemConfig = {
  baseNumber: Math.E,
  xMin: -3,
  xMax: 3,
  showReflectionLine: true,
  showGrid: true,
  showAxes: true,
  difficulty: 1,
};

const DEFAULT_VIEWPORT: ViewportState = {
  centerX: 0,
  centerY: 0,
  scale: 50,
};

export const useReflectionPair = create<ReflectionPairStore>((set) => ({
  config: DEFAULT_CONFIG,
  viewport: DEFAULT_VIEWPORT,
  interactions: [],

  updateConfig: (newConfig) => {
    set((state) => ({
      config: { ...state.config, ...newConfig },
    }));

    // Log interaction
    set((state) => ({
      interactions: [
        ...state.interactions,
        {
          type: 'view',
          timestamp: new Date(),
          data: { config: newConfig },
        },
      ],
    }));
  },

  updateViewport: (newViewport) => {
    set((state) => ({
      viewport: { ...state.viewport, ...newViewport },
    }));
  },

  resetViewport: () => {
    set(() => ({
      viewport: { ...DEFAULT_VIEWPORT },
    }));

    // Log interaction
    set((state) => ({
      interactions: [
        ...state.interactions,
        {
          type: 'zoom',
          timestamp: new Date(),
          data: { action: 'reset' },
        },
      ],
    }));
  },

  addInteraction: (interaction) => {
    set((state) => ({
      interactions: [
        ...state.interactions,
        {
          ...interaction,
          timestamp: new Date(),
        },
      ],
    }));
  },

  zoomIn: () => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        scale: Math.min(state.viewport.scale * 1.2, 200),
      },
    }));

    set((state) => ({
      interactions: [
        ...state.interactions,
        {
          type: 'zoom',
          timestamp: new Date(),
          data: { action: 'in' },
        },
      ],
    }));
  },

  zoomOut: () => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        scale: Math.max(state.viewport.scale * 0.8, 10),
      },
    }));

    set((state) => ({
      interactions: [
        ...state.interactions,
        {
          type: 'zoom',
          timestamp: new Date(),
          data: { action: 'out' },
        },
      ],
    }));
  },

  toggleReflectionLine: () => {
    set((state) => ({
      config: {
        ...state.config,
        showReflectionLine: !state.config.showReflectionLine,
      },
    }));

    set((state) => ({
      interactions: [
        ...state.interactions,
        {
          type: 'toggle',
          timestamp: new Date(),
          data: { element: 'reflection_line', value: state.config.showReflectionLine },
        },
      ],
    }));
  },
}));
