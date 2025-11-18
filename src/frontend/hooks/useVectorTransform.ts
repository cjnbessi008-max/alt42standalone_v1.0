/**
 * useVectorTransform Hook
 * Custom React hook for vector transformation operations
 */

import { useState, useCallback } from 'react';
import { Vector2D, VectorComponent } from '../types/vector.types';
import {
  addVectors,
  subtractVectors,
  scaleVector,
  rotateVector,
  magnitude,
  normalize,
} from '../utils/vectorMath';

export function useVectorTransform(initialVectors: VectorComponent[]) {
  const [vectors, setVectors] = useState<VectorComponent[]>(initialVectors);

  /**
   * Update a specific vector's value
   */
  const updateVector = useCallback((id: string, newValue: Vector2D) => {
    setVectors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, value: newValue } : v))
    );
  }, []);

  /**
   * Add a new vector
   */
  const addVector = useCallback((vector: VectorComponent) => {
    setVectors((prev) => [...prev, vector]);
  }, []);

  /**
   * Remove a vector by id
   */
  const removeVector = useCallback((id: string) => {
    setVectors((prev) => prev.filter((v) => v.id !== id));
  }, []);

  /**
   * Scale a vector
   */
  const scaleVectorById = useCallback((id: string, scale: number) => {
    setVectors((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, value: scaleVector(v.value, scale) } : v
      )
    );
  }, []);

  /**
   * Rotate a vector
   */
  const rotateVectorById = useCallback((id: string, angle: number) => {
    setVectors((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, value: rotateVector(v.value, angle) } : v
      )
    );
  }, []);

  /**
   * Calculate the resultant (sum) of all vectors
   */
  const getResultant = useCallback((): Vector2D => {
    return vectors.reduce(
      (sum, vector) => addVectors(sum, vector.value),
      { x: 0, y: 0 }
    );
  }, [vectors]);

  /**
   * Get vector by id
   */
  const getVectorById = useCallback(
    (id: string): VectorComponent | undefined => {
      return vectors.find((v) => v.id === id);
    },
    [vectors]
  );

  /**
   * Calculate magnitude of a vector by id
   */
  const getMagnitude = useCallback(
    (id: string): number => {
      const vector = getVectorById(id);
      return vector ? magnitude(vector.value) : 0;
    },
    [getVectorById]
  );

  /**
   * Normalize a vector by id
   */
  const normalizeVectorById = useCallback((id: string) => {
    setVectors((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, value: normalize(v.value) } : v
      )
    );
  }, []);

  /**
   * Set selected state for a vector
   */
  const setVectorSelected = useCallback((id: string, selected: boolean) => {
    setVectors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, isSelected: selected } : v))
    );
  }, []);

  /**
   * Clear all vectors
   */
  const clearVectors = useCallback(() => {
    setVectors([]);
  }, []);

  /**
   * Reset vectors to initial state
   */
  const resetVectors = useCallback(() => {
    setVectors(initialVectors);
  }, [initialVectors]);

  return {
    vectors,
    updateVector,
    addVector,
    removeVector,
    scaleVectorById,
    rotateVectorById,
    getResultant,
    getVectorById,
    getMagnitude,
    normalizeVectorById,
    setVectorSelected,
    clearVectors,
    resetVectors,
  };
}
