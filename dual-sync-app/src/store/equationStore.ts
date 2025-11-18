import { create } from 'zustand';
import { EquationParams, GraphData, Problem } from '../types/equation.types';

interface EquationStore {
  equation: EquationParams;
  graphData: GraphData;
  equationString: string;
  isDragging: boolean;
  currentProblem: Problem | null;

  setEquation: (equation: EquationParams) => void;
  setGraphData: (graphData: GraphData) => void;
  setEquationString: (str: string) => void;
  setIsDragging: (dragging: boolean) => void;
  setCurrentProblem: (problem: Problem | null) => void;
  updateParameter: (param: keyof EquationParams, value: number) => void;
}

export const useEquationStore = create<EquationStore>((set) => ({
  equation: {
    type: 'linear',
    a: 1,
    b: 0,
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
  },
  graphData: {
    points: [],
    equation: {
      type: 'linear',
      a: 1,
      b: 0,
    },
  },
  equationString: 'y = x',
  isDragging: false,
  currentProblem: null,

  setEquation: (equation) => set({ equation }),

  setGraphData: (graphData) => set({ graphData }),

  setEquationString: (str) => set({ equationString: str }),

  setIsDragging: (dragging) => set({ isDragging: dragging }),

  setCurrentProblem: (problem) => set({ currentProblem: problem }),

  updateParameter: (param, value) =>
    set((state) => ({
      equation: {
        ...state.equation,
        [param]: value,
      },
    })),
}));
