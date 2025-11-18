/**
 * API Service
 * Centralized API calls for the frontend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Heatmap API calls
  async getHeatmapData(moduleId: string, studentIds?: string[]) {
    const params = studentIds ? `?studentIds=${studentIds.join(',')}` : '';
    return this.request(`/heatmap/${moduleId}${params}`);
  }

  async getModuleConcepts(moduleId: string) {
    return this.request(`/heatmap/${moduleId}/concepts`);
  }

  async getStudentUnderstanding(moduleId: string, studentId: string) {
    return this.request(`/heatmap/${moduleId}/student/${studentId}`);
  }

  async recordInteraction(moduleId: string, data: {
    studentId: string;
    conceptId: string;
    interactionType: 'problem_attempt' | 'video_watch' | 'quiz' | 'practice';
    isCorrect?: boolean;
    score?: number;
    timeSpentSeconds?: number;
    metadata?: Record<string, any>;
  }) {
    return this.request(`/heatmap/${moduleId}/interaction`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConceptAnalysis(moduleId: string) {
    return this.request(`/heatmap/${moduleId}/analysis`);
  }

  // LMS Integration API calls
  async createLMSIntegration(data: {
    institutionName: string;
    lmsType: 'canvas' | 'moodle' | 'blackboard' | 'custom';
    lmsUrl: string;
    consumerKey: string;
    consumerSecret: string;
    config?: Record<string, any>;
  }) {
    return this.request('/lms/integration', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLMSIntegrations() {
    return this.request('/lms/integration');
  }

  async getLMSIntegration(id: string) {
    return this.request(`/lms/integration/${id}`);
  }

  async updateLMSIntegration(id: string, updates: any) {
    return this.request(`/lms/integration/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteLMSIntegration(id: string) {
    return this.request(`/lms/integration/${id}`, {
      method: 'DELETE',
    });
  }

  async triggerLMSSync(integrationId: string, data: {
    syncType: 'students' | 'grades' | 'concepts' | 'full';
    moduleId?: string;
  }) {
    return this.request(`/lms/sync/${integrationId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLMSSyncStatus(integrationId: string, limit: number = 10) {
    return this.request(`/lms/sync/${integrationId}/status?limit=${limit}`);
  }

  async syncGradesToLMS(data: {
    integrationId: string;
    moduleId: string;
    studentGrades: Array<{ studentId: string; score: number; maxScore: number }>;
  }) {
    return this.request('/lms/grades/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
