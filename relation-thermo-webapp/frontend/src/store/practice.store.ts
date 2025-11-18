import { create } from 'zustand';
import { Problem, RelationType } from '../types';

interface PracticeState {
  problems: Problem[];
  currentIndex: number;
  selectedRelation: RelationType | null;
  confidenceLevel: number;
  startTime: number | null;
  responses: Array<{
    problemId: number;
    isCorrect: boolean;
    selectedRelation: RelationType;
    correctAnswer: RelationType;
  }>;

  setProblems: (problems: Problem[]) => void;
  selectRelation: (relation: RelationType) => void;
  setConfidenceLevel: (level: number) => void;
  startProblem: () => void;
  nextProblem: () => void;
  addResponse: (response: {
    problemId: number;
    isCorrect: boolean;
    selectedRelation: RelationType;
    correctAnswer: RelationType;
  }) => void;
  reset: () => void;
  getTimeSpent: () => number;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  problems: [],
  currentIndex: 0,
  selectedRelation: null,
  confidenceLevel: 50,
  startTime: null,
  responses: [],

  setProblems: (problems) => set({ problems, currentIndex: 0, responses: [] }),

  selectRelation: (relation) => set({ selectedRelation: relation }),

  setConfidenceLevel: (level) => set({ confidenceLevel: level }),

  startProblem: () => set({ startTime: Date.now(), selectedRelation: null }),

  nextProblem: () =>
    set((state) => ({
      currentIndex: state.currentIndex + 1,
      selectedRelation: null,
      confidenceLevel: 50,
      startTime: Date.now(),
    })),

  addResponse: (response) =>
    set((state) => ({
      responses: [...state.responses, response],
    })),

  reset: () =>
    set({
      problems: [],
      currentIndex: 0,
      selectedRelation: null,
      confidenceLevel: 50,
      startTime: null,
      responses: [],
    }),

  getTimeSpent: () => {
    const { startTime } = get();
    if (!startTime) return 0;
    return Math.floor((Date.now() - startTime) / 1000);
  },
}));
