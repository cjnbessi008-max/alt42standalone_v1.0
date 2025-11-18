/**
 * LMS API Client
 * Handles communication with LMS backend for grading and student progress
 */

import { GradingResult, ModuleProgress, Student } from '../types/grading';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

interface SubmitAnswerRequest {
  studentId: string;
  moduleId: string;
  problemId: string;
  answer: string;
  timeSpent?: number;
}

interface SubmitAnswerResponse {
  gradingResult: GradingResult;
  moduleProgress: ModuleProgress;
}

class LMSApiClient {
  private async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = localStorage.getItem('authToken');

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response;
  }

  /**
   * Submit student answer for grading
   */
  async submitAnswer(request: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    const response = await this.fetchWithAuth('/grading/submit', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return response.json();
  }

  /**
   * Get student progress for a module
   */
  async getModuleProgress(studentId: string, moduleId: string): Promise<ModuleProgress> {
    const response = await this.fetchWithAuth(
      `/progress/${studentId}/module/${moduleId}`
    );

    return response.json();
  }

  /**
   * Get student information
   */
  async getStudent(studentId: string): Promise<Student> {
    const response = await this.fetchWithAuth(`/students/${studentId}`);
    return response.json();
  }

  /**
   * Get all grading results for a student in a module
   */
  async getGradingResults(
    studentId: string,
    moduleId: string
  ): Promise<GradingResult[]> {
    const response = await this.fetchWithAuth(
      `/grading/${studentId}/module/${moduleId}`
    );

    return response.json();
  }

  /**
   * Sync with external LMS (e.g., Canvas, Moodle)
   */
  async syncWithLMS(studentId: string, moduleId: string): Promise<void> {
    await this.fetchWithAuth('/lms/sync', {
      method: 'POST',
      body: JSON.stringify({ studentId, moduleId }),
    });
  }

  /**
   * Export grades to LMS
   */
  async exportGradesToLMS(moduleId: string): Promise<void> {
    await this.fetchWithAuth(`/lms/export/${moduleId}`, {
      method: 'POST',
    });
  }
}

// Singleton instance
export const lmsApi = new LMSApiClient();
export default lmsApi;
