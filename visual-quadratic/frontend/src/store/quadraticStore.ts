import { create } from 'zustand';
import { QuadraticCoefficients, Root, Problem, StudentProgress } from '../types';

interface QuadraticState {
  // Current equation coefficients
  coefficients: QuadraticCoefficients;

  // Calculated roots
  roots: Root[];

  // Current problem
  currentProblem: Problem | null;

  // Student progress
  progress: StudentProgress | null;

  // Actions
  setCoefficients: (coefficients: QuadraticCoefficients) => void;
  setA: (a: number) => void;
  setB: (b: number) => void;
  setC: (c: number) => void;
  calculateRoots: () => void;
  loadProblem: (problem: Problem) => void;
  updateProgress: (attempts: number, timeSpent: number) => void;
}

const calculateQuadraticRoots = (a: number, b: number, c: number): Root[] => {
  if (a === 0) {
    // Linear equation: bx + c = 0
    if (b === 0) return [];
    return [{ x: -c / b, type: 'real' }];
  }

  const discriminant = b * b - 4 * a * c;

  if (discriminant > 0) {
    // Two real roots
    const sqrtD = Math.sqrt(discriminant);
    return [
      { x: (-b + sqrtD) / (2 * a), type: 'real' },
      { x: (-b - sqrtD) / (2 * a), type: 'real' },
    ];
  } else if (discriminant === 0) {
    // One real root (repeated)
    return [{ x: -b / (2 * a), type: 'real' }];
  } else {
    // Complex roots
    return [
      { x: -b / (2 * a), type: 'complex' },
      { x: -b / (2 * a), type: 'complex' },
    ];
  }
};

export const useQuadraticStore = create<QuadraticState>((set, get) => ({
  coefficients: { a: 1, b: 0, c: 0 },
  roots: [{ x: 0, type: 'real' }],
  currentProblem: null,
  progress: null,

  setCoefficients: (coefficients) => {
    set({ coefficients });
    get().calculateRoots();
  },

  setA: (a) => {
    set((state) => ({
      coefficients: { ...state.coefficients, a },
    }));
    get().calculateRoots();
  },

  setB: (b) => {
    set((state) => ({
      coefficients: { ...state.coefficients, b },
    }));
    get().calculateRoots();
  },

  setC: (c) => {
    set((state) => ({
      coefficients: { ...state.coefficients, c },
    }));
    get().calculateRoots();
  },

  calculateRoots: () => {
    const { a, b, c } = get().coefficients;
    const roots = calculateQuadraticRoots(a, b, c);
    set({ roots });
  },

  loadProblem: (problem) => {
    set({
      currentProblem: problem,
      progress: {
        problemId: problem.id,
        attempts: 0,
        completed: false,
        timeSpent: 0,
      },
    });
  },

  updateProgress: (attempts, timeSpent) => {
    set((state) => ({
      progress: state.progress
        ? { ...state.progress, attempts, timeSpent, lastAttempt: new Date() }
        : null,
    }));
  },
}));
