/**
 * Vector Blend LMS - LMS API Service
 * Handles communication with LMS systems (with mock mode for development)
 */

import type {
  LMSContext,
  LMSGradeSubmission,
  LMSApiResponse,
  LMSConfig,
} from '../types/lms';
import type { ProblemSet } from '../types/problem';

class LMSApi {
  private config: LMSConfig;
  private context: LMSContext | null = null;

  constructor(config: LMSConfig) {
    this.config = config;
  }

  /**
   * Initialize LMS context from URL parameters or launch data
   */
  async initialize(): Promise<LMSContext> {
    if (this.config.mockMode) {
      // Mock mode for development
      this.context = this.getMockContext();
      return this.context;
    }

    // Parse LTI launch parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    this.context = {
      userId: urlParams.get('user_id') || undefined,
      courseId: urlParams.get('context_id') || undefined,
      resourceLinkId: urlParams.get('resource_link_id') || undefined,
      contextId: urlParams.get('context_id') || undefined,
      studentName: urlParams.get('lis_person_name_full') || undefined,
      studentEmail: urlParams.get('lis_person_contact_email_primary') || undefined,
      assignmentId: urlParams.get('resource_link_id') || undefined,
      assignmentTitle: urlParams.get('resource_link_title') || undefined,
      returnUrl: urlParams.get('launch_presentation_return_url') || undefined,
      outcomeServiceUrl: urlParams.get('lis_outcome_service_url') || undefined,
    };

    return this.context;
  }

  /**
   * Get current LMS context
   */
  getContext(): LMSContext | null {
    return this.context;
  }

  /**
   * Load problem set from LMS or local file
   */
  async loadProblemSet(problemSetId: string): Promise<LMSApiResponse<ProblemSet>> {
    try {
      if (this.config.mockMode) {
        // Load from public folder
        const response = await fetch(`/problems/${problemSetId}.json`);
        if (!response.ok) {
          throw new Error('Problem set not found');
        }
        const data = await response.json();
        return {
          success: true,
          data,
        };
      }

      // Load from LMS API
      const response = await fetch(
        `${this.config.apiEndpoint}/problem-sets/${problemSetId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.getAuthToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load problem set');
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LOAD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Submit grade to LMS
   */
  async submitGrade(submission: LMSGradeSubmission): Promise<LMSApiResponse<void>> {
    try {
      if (this.config.mockMode) {
        // Mock submission - just log it
        console.log('Mock grade submission:', submission);
        return { success: true };
      }

      // Submit to LMS via LTI Outcomes Service
      const response = await fetch(`${this.config.apiEndpoint}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(submission),
      });

      if (!response.ok) {
        throw new Error('Failed to submit grade');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SUBMIT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Save student progress
   */
  async saveProgress(
    userId: string,
    problemSetId: string,
    progress: any
  ): Promise<LMSApiResponse<void>> {
    try {
      if (this.config.mockMode) {
        // Save to localStorage for mock mode
        const key = `progress_${userId}_${problemSetId}`;
        localStorage.setItem(key, JSON.stringify(progress));
        return { success: true };
      }

      // Save to LMS API
      const response = await fetch(`${this.config.apiEndpoint}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({ userId, problemSetId, progress }),
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAVE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Load student progress
   */
  async loadProgress(
    userId: string,
    problemSetId: string
  ): Promise<LMSApiResponse<any>> {
    try {
      if (this.config.mockMode) {
        // Load from localStorage for mock mode
        const key = `progress_${userId}_${problemSetId}`;
        const data = localStorage.getItem(key);
        return {
          success: true,
          data: data ? JSON.parse(data) : null,
        };
      }

      // Load from LMS API
      const response = await fetch(
        `${this.config.apiEndpoint}/progress/${userId}/${problemSetId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.getAuthToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load progress');
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LOAD_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string {
    // In real implementation, this would use OAuth or LTI signatures
    return this.config.consumerKey || '';
  }

  /**
   * Get mock context for development
   */
  private getMockContext(): LMSContext {
    return {
      userId: 'mock-student-001',
      courseId: 'mock-course-vector-math',
      resourceLinkId: 'mock-resource-001',
      contextId: 'mock-context-001',
      studentName: '김학생 (Kim Student)',
      studentEmail: 'student@kaist.ac.kr',
      assignmentId: 'mock-assignment-001',
      assignmentTitle: 'Vector Blend Learning Activity',
      customParams: {
        problemSetId: 'beginner-set',
      },
    };
  }
}

// Create singleton instance
const lmsConfig: LMSConfig = {
  apiEndpoint: import.meta.env.VITE_LMS_API_ENDPOINT || '/api',
  mockMode: import.meta.env.VITE_MOCK_MODE !== 'false', // Default to mock mode
};

export const lmsApi = new LMSApi(lmsConfig);
export default lmsApi;
