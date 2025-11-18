import { create } from 'zustand';
import type { ConceptGraph, ConceptNode, ConceptRelationship } from '../types/graph';

interface GraphStore {
  graph: ConceptGraph | null;
  isLoading: boolean;
  error: string | null;
  inputText: string;

  // Actions
  setGraph: (graph: ConceptGraph) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setInputText: (text: string) => void;
  addNode: (node: ConceptNode) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<ConceptNode>) => void;
  addRelationship: (relationship: ConceptRelationship) => void;
  removeRelationship: (relationshipId: string) => void;
  clearGraph: () => void;
  saveGraph: () => void;
  loadGraph: (graph: ConceptGraph) => void;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  graph: null,
  isLoading: false,
  error: null,
  inputText: '',

  setGraph: (graph) => set({ graph, error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  setInputText: (inputText) => set({ inputText }),

  addNode: (node) => set((state) => {
    if (!state.graph) {
      return { graph: { nodes: [node], relationships: [] } };
    }
    return {
      graph: {
        ...state.graph,
        nodes: [...state.graph.nodes, node],
      },
    };
  }),

  removeNode: (nodeId) => set((state) => {
    if (!state.graph) return state;
    return {
      graph: {
        nodes: state.graph.nodes.filter((n) => n.id !== nodeId),
        relationships: state.graph.relationships.filter(
          (r) => r.source !== nodeId && r.target !== nodeId
        ),
      },
    };
  }),

  updateNode: (nodeId, updates) => set((state) => {
    if (!state.graph) return state;
    return {
      graph: {
        ...state.graph,
        nodes: state.graph.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates } : n
        ),
      },
    };
  }),

  addRelationship: (relationship) => set((state) => {
    if (!state.graph) return state;
    return {
      graph: {
        ...state.graph,
        relationships: [...state.graph.relationships, relationship],
      },
    };
  }),

  removeRelationship: (relationshipId) => set((state) => {
    if (!state.graph) return state;
    return {
      graph: {
        ...state.graph,
        relationships: state.graph.relationships.filter((r) => r.id !== relationshipId),
      },
    };
  }),

  clearGraph: () => set({ graph: null, error: null, inputText: '' }),

  saveGraph: () => {
    const state = get();
    if (state.graph) {
      localStorage.setItem('savedGraph', JSON.stringify(state.graph));
      localStorage.setItem('savedInputText', state.inputText);
    }
  },

  loadGraph: (graph) => {
    set({ graph, error: null });
  },
}));
