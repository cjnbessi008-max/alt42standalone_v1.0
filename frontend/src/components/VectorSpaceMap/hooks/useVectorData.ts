import { useState, useEffect } from 'react';
import vectorSpaceApi from '@services/vectorSpaceApi';
import type { VectorSpaceData } from '@types/index';

/**
 * Vector Space 데이터 페칭 Hook
 */
export function useVectorData(moduleId: string) {
  const [data, setData] = useState<VectorSpaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!moduleId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const vectorData = await vectorSpaceApi.getVectorSpace(moduleId);
        setData(vectorData);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch vector space data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [moduleId]);

  const refresh = async () => {
    if (!moduleId) return;

    try {
      setLoading(true);
      const vectorData = await vectorSpaceApi.getVectorSpace(moduleId);
      setData(vectorData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
}

export default useVectorData;
