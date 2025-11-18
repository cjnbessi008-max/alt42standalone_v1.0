// Zustand store for Length Assist feature

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Line,
  GeometricShape,
  RatioCalculation,
  LengthAssistProblem,
  InteractionEvent,
  CanvasConfig,
} from '@/types/geometry';
import { calculateRatio } from '@/utils/geometry';

interface LengthAssistState {
  // Current problem
  currentProblem: LengthAssistProblem | null;

  // Canvas state
  lines: Line[];
  shapes: GeometricShape[];
  selectedLineId: string | null;
  canvasConfig: CanvasConfig;

  // Measurements
  currentRatio: RatioCalculation | null;

  // Interaction tracking
  interactions: InteractionEvent[];
  startTime: number | null;

  // UI state
  isLoading: boolean;
  error: string | null;
  showHints: boolean;

  // Actions
  setProblem: (problem: LengthAssistProblem) => void;
  addLine: (line: Line) => void;
  updateLine: (lineId: string, updates: Partial<Line>) => void;
  removeLine: (lineId: string) => void;
  selectLine: (lineId: string | null) => void;
  calculateCurrentRatio: (line1Id: string, line2Id: string) => void;
  addInteraction: (interaction: InteractionEvent) => void;
  startProblem: () => void;
  submitAnswer: () => void;
  resetProblem: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  toggleHints: () => void;
  updateCanvasConfig: (config: Partial<CanvasConfig>) => void;
}

const defaultCanvasConfig: CanvasConfig = {
  width: 375, // iPhone SE width
  height: 600,
  backgroundColor: '#f5f5f5',
  gridEnabled: true,
  snapToGrid: false,
  gridSize: 20,
};

export const useLengthAssistStore = create<LengthAssistState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentProblem: null,
      lines: [],
      shapes: [],
      selectedLineId: null,
      canvasConfig: defaultCanvasConfig,
      currentRatio: null,
      interactions: [],
      startTime: null,
      isLoading: false,
      error: null,
      showHints: false,

      // Actions
      setProblem: (problem) => {
        set({
          currentProblem: problem,
          lines: problem.lines,
          shapes: problem.shapes,
          currentRatio: null,
          interactions: [],
          startTime: null,
          error: null,
        });
      },

      addLine: (line) => {
        set((state) => ({
          lines: [...state.lines, line],
        }));

        get().addInteraction({
          type: 'click',
          timestamp: Date.now(),
          elementId: line.id,
          data: { action: 'addLine' },
        });
      },

      updateLine: (lineId, updates) => {
        set((state) => ({
          lines: state.lines.map((line) =>
            line.id === lineId ? { ...line, ...updates } : line
          ),
        }));

        get().addInteraction({
          type: 'drag',
          timestamp: Date.now(),
          elementId: lineId,
          data: { updates },
        });

        // Recalculate ratio if this line is part of current ratio
        const { currentRatio } = get();
        if (
          currentRatio &&
          (currentRatio.line1Id === lineId || currentRatio.line2Id === lineId)
        ) {
          get().calculateCurrentRatio(
            currentRatio.line1Id,
            currentRatio.line2Id
          );
        }
      },

      removeLine: (lineId) => {
        set((state) => ({
          lines: state.lines.filter((line) => line.id !== lineId),
          selectedLineId:
            state.selectedLineId === lineId ? null : state.selectedLineId,
        }));
      },

      selectLine: (lineId) => {
        set({ selectedLineId: lineId });

        if (lineId) {
          get().addInteraction({
            type: 'click',
            timestamp: Date.now(),
            elementId: lineId,
            data: { action: 'selectLine' },
          });
        }
      },

      calculateCurrentRatio: (line1Id, line2Id) => {
        const { lines } = get();
        const line1 = lines.find((l) => l.id === line1Id);
        const line2 = lines.find((l) => l.id === line2Id);

        if (line1 && line2) {
          const ratio = calculateRatio(line1, line2);
          set({ currentRatio: ratio });

          get().addInteraction({
            type: 'calculate',
            timestamp: Date.now(),
            elementId: 'ratio-calculator',
            data: { ratio },
          });
        }
      },

      addInteraction: (interaction) => {
        set((state) => ({
          interactions: [...state.interactions, interaction],
        }));
      },

      startProblem: () => {
        set({
          startTime: Date.now(),
          interactions: [],
          currentRatio: null,
          selectedLineId: null,
        });
      },

      submitAnswer: () => {
        // This will be called when student submits their answer
        // The actual API call will be handled by the component
        get().addInteraction({
          type: 'click',
          timestamp: Date.now(),
          elementId: 'submit-button',
          data: { action: 'submitAnswer' },
        });
      },

      resetProblem: () => {
        const { currentProblem } = get();
        if (currentProblem) {
          set({
            lines: currentProblem.lines,
            shapes: currentProblem.shapes,
            selectedLineId: null,
            currentRatio: null,
            interactions: [],
            startTime: null,
            error: null,
          });
        }
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },

      toggleHints: () => {
        set((state) => ({ showHints: !state.showHints }));
      },

      updateCanvasConfig: (config) => {
        set((state) => ({
          canvasConfig: { ...state.canvasConfig, ...config },
        }));
      },
    }),
    { name: 'LengthAssistStore' }
  )
);
