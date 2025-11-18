import { useState, useCallback } from 'react';
import type { Concept } from '@types/index';

/**
 * Vector Space Map 상호작용 Hook
 */
export function useInteraction() {
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [hoveredConcept, setHoveredConcept] = useState<Concept | null>(null);
  const [highlightedConcepts, setHighlightedConcepts] = useState<Set<string>>(new Set());

  const handleNodeClick = useCallback((concept: Concept) => {
    setSelectedConcept(concept);
  }, []);

  const handleNodeHover = useCallback((concept: Concept | null) => {
    setHoveredConcept(concept);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedConcept(null);
  }, []);

  const highlightRelatedConcepts = useCallback((conceptIds: string[]) => {
    setHighlightedConcepts(new Set(conceptIds));
  }, []);

  const clearHighlights = useCallback(() => {
    setHighlightedConcepts(new Set());
  }, []);

  return {
    selectedConcept,
    hoveredConcept,
    highlightedConcepts,
    handleNodeClick,
    handleNodeHover,
    clearSelection,
    highlightRelatedConcepts,
    clearHighlights,
  };
}

export default useInteraction;
