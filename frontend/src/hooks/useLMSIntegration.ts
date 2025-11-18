/**
 * Custom Hook for LMS Integration
 * Handles communication with Moodle/LMS backend
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import type { Problem, LMSIntegration } from '../types';

interface UseLMSIntegrationReturn {
  problems: Problem[];
  currentProblem: Problem | null;
  loading: boolean;
  error: string | null;
  fetchProblems: () => Promise<void>;
  fetchProblemById: (id: number) => Promise<void>;
  submitAnswer: (problemId: number, answer: string) => Promise<boolean>;
}

export const useLMSIntegration = (
  config: LMSIntegration
): UseLMSIntegrationReturn => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Configure axios instance with LMS credentials
   */
  const api = axios.create({
    baseURL: config.endpoint,
    headers: config.apiKey
      ? {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      : { 'Content-Type': 'application/json' }
  });

  /**
   * Fetch all problems from LMS
   */
  const fetchProblems = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {};
      if (config.courseId) params.courseId = config.courseId;

      const response = await api.get('/api/problems', { params });
      setProblems(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch problems';
      setError(errorMessage);
      console.error('Error fetching problems:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch a specific problem by ID
   */
  const fetchProblemById = async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/problems/${id}`);
      setCurrentProblem(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch problem';
      setError(errorMessage);
      console.error('Error fetching problem:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submit an answer to the LMS
   */
  const submitAnswer = async (problemId: number, answer: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post(`/api/problems/${problemId}/submit`, {
        answer
      });

      return response.data.correct === true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit answer';
      setError(errorMessage);
      console.error('Error submitting answer:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch problems on mount if courseId or problemId is provided
   */
  useEffect(() => {
    if (config.problemId) {
      fetchProblemById(parseInt(config.problemId));
    } else if (config.courseId) {
      fetchProblems();
    }
  }, [config.courseId, config.problemId]);

  return {
    problems,
    currentProblem,
    loading,
    error,
    fetchProblems,
    fetchProblemById,
    submitAnswer
  };
};
