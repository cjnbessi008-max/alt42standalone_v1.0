/**
 * API service for Motivation Mode
 */

import axios from 'axios';
import {
  ModeTrigger,
  ExitReason,
  Problem,
  FeedbackResponse,
  SessionSummary,
  SessionStats,
  ProblemSubmission,
  SuggestionResponse,
} from '../types/motivationMode.types';

const API_BASE = '/api/modules';

export class MotivationModeApi {
  /**
   * Start a new motivation mode session
   */
  static async startSession(
    moduleId: string,
    trigger: ModeTrigger = ModeTrigger.STUDENT_INITIATED
  ): Promise<{ sessionId: string; firstProblem: Problem; message: string }> {
    const response = await axios.post(
      `${API_BASE}/${moduleId}/motivation-mode/start`,
      { trigger }
    );
    return response.data;
  }

  /**
   * Get next problem for the session
   */
  static async getNextProblem(
    moduleId: string,
    sessionId: string
  ): Promise<{ problem: Problem; currentStreak: number; sessionStats: SessionStats }> {
    const response = await axios.get(
      `${API_BASE}/${moduleId}/motivation-mode/next`,
      { params: { session_id: sessionId } }
    );
    return response.data;
  }

  /**
   * Submit an answer to a problem
   */
  static async submitAnswer(
    moduleId: string,
    sessionId: string,
    submission: ProblemSubmission
  ): Promise<FeedbackResponse> {
    const response = await axios.post(
      `${API_BASE}/${moduleId}/motivation-mode/submit`,
      {
        session_id: sessionId,
        problem_id: submission.problemId,
        answer: submission.answer,
        time_spent_seconds: submission.timeSpentSeconds,
      }
    );
    return response.data;
  }

  /**
   * End the motivation mode session
   */
  static async endSession(
    moduleId: string,
    sessionId: string,
    exitReason: ExitReason = ExitReason.STUDENT_CHOICE
  ): Promise<SessionSummary> {
    const response = await axios.post(
      `${API_BASE}/${moduleId}/motivation-mode/exit`,
      {
        session_id: sessionId,
        exit_reason: exitReason,
      }
    );
    return response.data;
  }

  /**
   * Respond to a motivation mode suggestion
   */
  static async respondToSuggestion(
    suggestionId: string,
    response: SuggestionResponse
  ): Promise<void> {
    await axios.post(`/api/motivation-mode/suggestions/${suggestionId}/respond`, response);
  }

  /**
   * Get motivation mode analytics (for teachers)
   */
  static async getAnalytics(
    moduleId: string,
    studentId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any> {
    const response = await axios.get(
      `${API_BASE}/${moduleId}/motivation-mode/analytics`,
      {
        params: {
          student_id: studentId,
          date_from: dateFrom,
          date_to: dateTo,
        },
      }
    );
    return response.data;
  }

  /**
   * Get motivation mode configuration (for teachers)
   */
  static async getConfig(moduleId: string): Promise<any> {
    const response = await axios.get(
      `${API_BASE}/${moduleId}/motivation-mode/config`
    );
    return response.data;
  }

  /**
   * Update motivation mode configuration (for teachers)
   */
  static async updateConfig(moduleId: string, config: any): Promise<any> {
    const response = await axios.put(
      `${API_BASE}/${moduleId}/motivation-mode/config`,
      config
    );
    return response.data;
  }
}
