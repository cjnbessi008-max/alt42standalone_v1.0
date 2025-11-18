/**
 * API client for session management
 */

import axios from 'axios';
import type { SessionState, DraftAnswer, ResumeInfo, SessionStartResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Session API
export const sessionApi = {
  /**
   * Start or resume a session
   */
  async startSession(
    moduleId: string,
    studentId: string,
    forceNew: boolean = false
  ): Promise<SessionStartResponse> {
    const response = await api.post(`/api/v1/modules/${moduleId}/sessions/start`, {
      student_id: studentId,
      module_id: moduleId,
      force_new: forceNew,
    });
    return response.data;
  },

  /**
   * Update session state
   */
  async updateSession(
    moduleId: string,
    sessionId: string,
    data: {
      current_problem_id?: string;
      problem_index?: number;
      session_data?: Record<string, any>;
      device_info?: Record<string, any>;
    }
  ): Promise<{ success: boolean; session: any }> {
    const response = await api.put(
      `/api/v1/modules/${moduleId}/sessions/${sessionId}`,
      data
    );
    return response.data;
  },

  /**
   * Complete session
   */
  async completeSession(
    moduleId: string,
    sessionId: string,
    finalScore?: number,
    totalTime?: number
  ): Promise<{ success: boolean; session: any }> {
    const response = await api.post(
      `/api/v1/modules/${moduleId}/sessions/${sessionId}/complete`,
      {
        final_score: finalScore,
        total_time_seconds: totalTime,
      }
    );
    return response.data;
  },

  /**
   * Get resume info
   */
  async getResumeInfo(
    moduleId: string,
    studentId: string
  ): Promise<ResumeInfo> {
    const response = await api.get(
      `/api/v1/modules/${moduleId}/sessions/resume/${studentId}`
    );
    return response.data;
  },
};

// Draft API
export const draftApi = {
  /**
   * Save draft answer
   */
  async saveDraft(
    moduleId: string,
    problemId: string,
    studentId: string,
    draftAnswer: Record<string, any>,
    timeSpent: number = 0,
    hintsViewed: number = 0
  ): Promise<{ success: boolean; draft: any }> {
    const response = await api.post(
      `/api/v1/modules/${moduleId}/problems/${problemId}/draft`,
      {
        student_id: studentId,
        draft_answer: draftAnswer,
        time_spent_seconds: timeSpent,
        hints_viewed: hintsViewed,
      }
    );
    return response.data;
  },

  /**
   * Get draft answer
   */
  async getDraft(
    moduleId: string,
    problemId: string,
    studentId: string
  ): Promise<{ has_draft: boolean; draft?: DraftAnswer }> {
    const response = await api.get(
      `/api/v1/modules/${moduleId}/problems/${problemId}/draft/${studentId}`
    );
    return response.data;
  },

  /**
   * Delete draft answer
   */
  async deleteDraft(
    moduleId: string,
    problemId: string,
    studentId: string
  ): Promise<void> {
    await api.delete(
      `/api/v1/modules/${moduleId}/problems/${problemId}/draft/${studentId}`
    );
  },
};

export default api;
