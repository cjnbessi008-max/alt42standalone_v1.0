/**
 * API Service for Hundred Art Backend
 */

import { Artwork, Problem, StudentProgress, ProgressSubmission, ApiResponse, MoodleSyncRequest, MoodleSyncResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/backend/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<T> = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data.data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Artworks
  async getArtworks(): Promise<Artwork[]> {
    return this.request<Artwork[]>('/artworks');
  }

  async getArtwork(number: number): Promise<Artwork> {
    return this.request<Artwork>(`/artworks/${number}`);
  }

  // Problems
  async getProblems(): Promise<Problem[]> {
    return this.request<Problem[]>('/problems');
  }

  async getProblem(id: number): Promise<Problem> {
    return this.request<Problem>(`/problems/${id}`);
  }

  async createProblem(problem: Partial<Problem>): Promise<{ id: number }> {
    return this.request<{ id: number }>('/problems', {
      method: 'POST',
      body: JSON.stringify(problem),
    });
  }

  // Student Progress
  async getStudentProgress(studentId: number): Promise<StudentProgress[]> {
    return this.request<StudentProgress[]>(`/progress/${studentId}`);
  }

  async submitProgress(progress: ProgressSubmission): Promise<{ id: number }> {
    return this.request<{ id: number }>('/progress', {
      method: 'POST',
      body: JSON.stringify(progress),
    });
  }

  // Students
  async getStudents(): Promise<any[]> {
    return this.request<any[]>('/students');
  }

  async getStudent(id: number): Promise<any> {
    return this.request<any>(`/students/${id}`);
  }

  // Moodle Integration
  async syncMoodle(request: MoodleSyncRequest): Promise<MoodleSyncResponse> {
    return this.request<MoodleSyncResponse>('/moodle/sync', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getMoodleStatus(): Promise<any> {
    return this.request<any>('/moodle/status');
  }

  // Health Check
  async healthCheck(): Promise<any> {
    return this.request<any>('/health');
  }
}

export const apiService = new ApiService();
