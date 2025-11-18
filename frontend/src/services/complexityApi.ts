/**
 * API Service for Complexity Assessment
 *
 * Communicates with backend complexity assessment API
 */

import { ComplexityAssessment } from '../types/complexity';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export interface AssessComplexityParams {
  condition_count: number;
  nesting_depth: number;
  entity_count: number;
  has_cyclical_dependencies: boolean;
  language?: 'ko' | 'en';
}

export interface LMSProblemMetadata {
  problem_id: string;
  problem_type: string;
  difficulty_level?: number;
  estimated_time_minutes?: number;
  prerequisites?: string[];
}

export class ComplexityApiService {
  /**
   * Assess the complexity of a single problem
   */
  static async assessComplexity(
    params: AssessComplexityParams
  ): Promise<ComplexityAssessment> {
    const response = await fetch(`${API_BASE_URL}/api/v1/assess-complexity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...params,
        language: params.language || 'ko',
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Assess complexity for multiple problems in batch
   */
  static async assessComplexityBatch(
    problems: AssessComplexityParams[]
  ): Promise<{
    assessments: ComplexityAssessment[];
    summary: {
      total: number;
      requires_focus_card: number;
      by_level: Record<string, number>;
    };
  }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/assess-complexity/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problems: problems.map((p) => ({
          ...p,
          language: p.language || 'ko',
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Assess complexity based on LMS problem metadata
   *
   * Useful for integration with existing LMS systems
   */
  static async assessFromLMSMetadata(
    metadata: LMSProblemMetadata,
    language: 'ko' | 'en' = 'ko'
  ): Promise<ComplexityAssessment> {
    const queryParams = new URLSearchParams({ language });
    const response = await fetch(
      `${API_BASE_URL}/api/v1/lms/problem-metadata?${queryParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get complexity statistics and thresholds
   */
  static async getStatistics(): Promise<{
    thresholds: Record<string, any>;
    complexity_levels: Record<string, string>;
    focus_card_triggers: string[];
  }> {
    const response = await fetch(`${API_BASE_URL}/api/v1/statistics`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${API_BASE_URL}/health`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export default ComplexityApiService;
