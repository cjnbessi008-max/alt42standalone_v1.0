import { create } from 'zustand';

interface Point {
  x: number;
  y: number;
}

interface Triangle {
  id?: string;
  label: string;
  vertices: [Point, Point, Point];
  sides?: [number, number, number];
  angles?: [number, number, number];
  similarityGroup?: number;
}

interface Problem {
  id: string;
  title: string;
  description?: string;
  problemData: any;
}

interface TriangleStore {
  problem: Problem | null;
  triangles: Triangle[];
  selectedTriangle: Triangle | null;
  highlightedGroups: number[];
  similarityGroups: Map<number, Triangle[]>;

  loadProblem: (problem: Problem) => void;
  setTriangles: (triangles: Triangle[]) => void;
  selectTriangle: (triangle: Triangle | null) => void;
  highlightGroup: (groupId: number) => void;
  clearHighlights: () => void;
  setSimilarityGroups: (groups: Map<number, Triangle[]>) => void;
}

export const useTriangleStore = create<TriangleStore>((set) => ({
  problem: null,
  triangles: [],
  selectedTriangle: null,
  highlightedGroups: [],
  similarityGroups: new Map(),

  loadProblem: (problem: Problem) => {
    set({ problem, triangles: problem.problemData?.triangles || [] });
  },

  setTriangles: (triangles: Triangle[]) => {
    set({ triangles });
  },

  selectTriangle: (triangle: Triangle | null) => {
    set({ selectedTriangle: triangle });

    // If triangle is selected and belongs to a group, highlight that group
    if (triangle && triangle.similarityGroup !== undefined) {
      set({ highlightedGroups: [triangle.similarityGroup] });
    }
  },

  highlightGroup: (groupId: number) => {
    set((state) => {
      const groups = state.highlightedGroups.includes(groupId)
        ? state.highlightedGroups.filter(id => id !== groupId)
        : [...state.highlightedGroups, groupId];
      return { highlightedGroups: groups };
    });
  },

  clearHighlights: () => {
    set({ highlightedGroups: [], selectedTriangle: null });
  },

  setSimilarityGroups: (groups: Map<number, Triangle[]>) => {
    set({ similarityGroups: groups });
  },
}));
