import { useState, useCallback, useEffect } from 'react';
import { movementAPI, meanCenterAPI } from '../services/api';
import type { Coordinate, MeanCenterStats } from '../types';

export const useMeanCenter = (sessionId: string | null) => {
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [stats, setStats] = useState<MeanCenterStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a single coordinate
  const addCoordinate = useCallback(
    async (x: number, y: number) => {
      if (!sessionId) {
        setError('No active session');
        return;
      }

      try {
        const result = await movementAPI.addCoordinate(sessionId, x, y);

        // Add to coordinates array
        setCoordinates((prev) => [...prev, result.coordinate]);

        // Update stats
        setStats(result.stats);

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add coordinate';
        setError(errorMessage);
        throw err;
      }
    },
    [sessionId]
  );

  // Load existing coordinates
  const loadCoordinates = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await movementAPI.getCoordinates(sessionId);
      setCoordinates(result.coordinates);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load coordinates';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Load mean center stats
  const loadStats = useCallback(async () => {
    if (!sessionId) return;

    try {
      const meanCenterStats = await meanCenterAPI.get(sessionId);
      setStats(meanCenterStats);
    } catch (err) {
      // Stats might not exist yet, that's ok
      setStats(null);
    }
  }, [sessionId]);

  // Clear all data
  const clear = useCallback(() => {
    setCoordinates([]);
    setStats(null);
    setError(null);
  }, []);

  // Load data when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadCoordinates();
      loadStats();
    } else {
      clear();
    }
  }, [sessionId, loadCoordinates, loadStats, clear]);

  return {
    coordinates,
    stats,
    loading,
    error,
    addCoordinate,
    loadCoordinates,
    loadStats,
    clear,
  };
};
