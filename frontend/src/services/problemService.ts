/**
 * Problem Service
 * API integration for fetching LMS problems
 */

import axios from 'axios';
import { Problem } from '../utils/problemCompressor';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Fetch problems for a specific module
 */
export async function fetchProblems(moduleId: string, limit: number = 50): Promise<Problem[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/modules/${moduleId}/problems`, {
      params: { limit }
    });
    return response.data.problems;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch problems');
    }
    throw error;
  }
}

/**
 * Fetch a single problem by ID
 */
export async function fetchProblemById(moduleId: string, problemId: string): Promise<Problem> {
  try {
    const response = await axios.get(`${API_BASE_URL}/modules/${moduleId}/problems/${problemId}`);
    return response.data.problem;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch problem');
    }
    throw error;
  }
}

/**
 * Submit an answer to a problem
 */
export async function submitAnswer(
  moduleId: string,
  problemId: string,
  answer: any
): Promise<{ correct: boolean; feedback: string }> {
  try {
    const response = await axios.post(`${API_BASE_URL}/modules/${moduleId}/submit`, {
      problemId,
      answer
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to submit answer');
    }
    throw error;
  }
}
