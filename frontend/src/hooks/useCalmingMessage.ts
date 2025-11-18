/**
 * Custom Hook: useCalmingMessage
 * Manages calming message configuration and triggering logic
 */

import { useState, useEffect } from 'react';
import { CalmingMessageConfig, ProblemMetadata } from '../types/calmingMessage';

const API_URL = process.env.REACT_APP_API_URL || '/api';

interface UseCalmingMessageProps {
  moduleId: string;
  problemId?: string;
}

interface UseCalmingMessageReturn {
  config: CalmingMessageConfig | null;
  problemMetadata: ProblemMetadata | null;
  loading: boolean;
  error: Error | null;
  shouldShowCalmingMessage: boolean;
  refreshConfig: () => Promise<void>;
}

export const useCalmingMessage = ({
  moduleId,
  problemId
}: UseCalmingMessageProps): UseCalmingMessageReturn => {
  const [config, setConfig] = useState<CalmingMessageConfig | null>(null);
  const [problemMetadata, setProblemMetadata] = useState<ProblemMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch calming message configuration
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/modules/${moduleId}/calming-config`);

      if (!response.ok) {
        throw new Error('Failed to fetch calming message config');
      }

      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching calming message config:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch problem difficulty metadata
  const fetchProblemMetadata = async () => {
    if (!problemId) {
      setProblemMetadata(null);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/modules/${moduleId}/problems/${problemId}/difficulty`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch problem metadata');
      }

      const data = await response.json();
      setProblemMetadata({
        problem_id: problemId,
        module_id: moduleId,
        difficulty_level: data.difficulty_level,
        requires_calming_support: data.requires_calming_support
      });
    } catch (err) {
      console.error('Error fetching problem metadata:', err);
      // Don't set error state here, as problem metadata is optional
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchConfig();
  }, [moduleId]);

  // Fetch problem metadata when problemId changes
  useEffect(() => {
    if (problemId) {
      fetchProblemMetadata();
    }
  }, [problemId, moduleId]);

  // Determine if calming message should be shown
  const shouldShowCalmingMessage =
    config !== null &&
    problemMetadata !== null &&
    config.is_enabled &&
    problemMetadata.difficulty_level >= config.difficulty_threshold;

  return {
    config,
    problemMetadata,
    loading,
    error,
    shouldShowCalmingMessage,
    refreshConfig: fetchConfig
  };
};
