import axios from 'axios';
import { HintLevel, HintRequest, HintResponse } from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class HintService {
  /**
   * Request a hint for a problem
   */
  static async requestHint(
    studentId: string,
    problemId: string,
    level: HintLevel,
    context?: {
      currentAttempt?: string;
      previousHints?: string[];
      timeSpent?: number;
    }
  ): Promise<HintResponse> {
    const request: HintRequest = {
      studentId,
      problemId,
      level,
      context,
    };

    const response = await api.post<HintResponse>('/api/hints/generate', request);
    return response.data;
  }

  /**
   * Get hint history for a student and problem
   */
  static async getHintHistory(
    studentId: string,
    problemId: string
  ): Promise<HintResponse[]> {
    const response = await api.get<{ hints: HintResponse[]; total_count: number }>(
      `/api/hints/history/${studentId}/${problemId}`
    );
    return response.data.hints;
  }

  /**
   * Get a specific hint by ID
   */
  static async getHint(hintId: string): Promise<HintResponse> {
    const response = await api.get<HintResponse>(`/api/hints/${hintId}`);
    return response.data;
  }
}
