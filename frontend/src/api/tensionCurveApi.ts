/**
 * Tension Curve API Client
 *
 * TypeScript client for accessing tension curve REST API endpoints
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

// Types
export interface TensionCalculationParams {
  accuracy_rate: number;
  difficulty_level: number;
  consecutive_incorrect?: number;
  average_time_ratio?: number;
  accuracy_weight?: number;
  difficulty_weight?: number;
  consistency_weight?: number;
  time_weight?: number;
}

export interface TensionCurveRequest {
  student_id: string;
  module_id: string;
  time_range_days?: number;
  include_predictions?: boolean;
  include_recommendations?: boolean;
}

export interface StudentAttempt {
  student_id: string;
  problem_id: string;
  module_id: string;
  answer: Record<string, any>;
  is_correct: boolean;
  time_spent_seconds?: number;
  hints_used?: number;
  attempt_number?: number;
}

export interface TensionCurveData {
  student_id: string;
  module_id: string;
  student_name?: string;
  module_name?: string;
  current_metrics: any;
  snapshots: any[];
  average_tension: number;
  max_tension: number;
  min_tension: number;
  tension_volatility: number;
  time_range_days: number;
  total_study_time_hours: number;
}

export interface TensionCurveResponse {
  success: boolean;
  data?: TensionCurveData;
  error?: string;
  message?: string;
}

export interface ClassAnalytics {
  module_id: string;
  teacher_id: string;
  total_students: number;
  active_students: number;
  average_accuracy: number;
  average_tension_score: number;
  accuracy_distribution: Record<string, number>;
  tension_distribution: Record<string, number>;
  difficulty_distribution: Record<string, number>;
  hardest_problems: string[];
  easiest_problems: string[];
  most_time_consuming_problems: string[];
  snapshot_date: string;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor (for adding auth tokens, etc.)
apiClient.interceptors.request.use(
  (config) => {
    // Add authentication token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor (for error handling)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle common errors
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Tension Curve API Client
 */
class TensionCurveAPI {
  /**
   * Get tension curve data for a student in a module
   */
  async getStudentTensionCurve(
    studentId: string,
    moduleId: string,
    timeRangeDays: number = 30,
    includePredictions: boolean = false,
    includeRecommendations: boolean = true
  ): Promise<TensionCurveResponse> {
    const response = await apiClient.get<TensionCurveResponse>(
      `/api/tension-curve/student/${studentId}/module/${moduleId}`,
      {
        params: {
          time_range_days: timeRangeDays,
          include_predictions: includePredictions,
          include_recommendations: includeRecommendations
        }
      }
    );
    return response.data;
  }

  /**
   * Get tension curves for all modules a student is enrolled in
   */
  async getStudentAllModulesTension(
    studentId: string,
    activeOnly: boolean = true
  ): Promise<any> {
    const response = await apiClient.get(
      `/api/tension-curve/student/${studentId}/modules`,
      {
        params: { active_only: activeOnly }
      }
    );
    return response.data;
  }

  /**
   * Calculate tension score for given parameters
   */
  async calculateTensionScore(
    params: TensionCalculationParams
  ): Promise<any> {
    const response = await apiClient.post(
      '/api/tension-curve/calculate',
      params
    );
    return response.data;
  }

  /**
   * Get class-wide tension analytics for a module
   */
  async getClassTensionAnalytics(
    moduleId: string,
    snapshotDate?: string
  ): Promise<ClassAnalytics> {
    const response = await apiClient.get<ClassAnalytics>(
      `/api/tension-curve/module/${moduleId}/class-analytics`,
      {
        params: snapshotDate ? { snapshot_date: snapshotDate } : {}
      }
    );
    return response.data;
  }

  /**
   * Get tension score distribution for class
   */
  async getClassTensionDistribution(moduleId: string): Promise<any> {
    const response = await apiClient.get(
      `/api/tension-curve/module/${moduleId}/tension-distribution`
    );
    return response.data;
  }

  /**
   * Get personalized learning recommendations
   */
  async getLearningRecommendations(
    studentId: string,
    moduleId: string
  ): Promise<any> {
    const response = await apiClient.get(
      `/api/tension-curve/student/${studentId}/module/${moduleId}/recommendations`
    );
    return response.data;
  }

  /**
   * Analyze learning performance patterns
   */
  async analyzePerformancePattern(
    studentId: string,
    moduleId: string
  ): Promise<any> {
    const response = await apiClient.get(
      `/api/tension-curve/student/${studentId}/module/${moduleId}/performance-pattern`
    );
    return response.data;
  }

  /**
   * Record a student attempt and update tension metrics
   */
  async recordStudentAttempt(attempt: StudentAttempt): Promise<any> {
    const response = await apiClient.post(
      '/api/tension-curve/record-attempt',
      attempt
    );
    return response.data;
  }

  /**
   * Manually create a tension curve snapshot
   */
  async createTensionSnapshot(
    studentId: string,
    moduleId: string
  ): Promise<any> {
    const response = await apiClient.post(
      '/api/tension-curve/snapshot/create',
      null,
      {
        params: { student_id: studentId, module_id: moduleId }
      }
    );
    return response.data;
  }

  /**
   * Export class tension data as CSV
   */
  async exportTensionDataCSV(moduleId: string): Promise<Blob> {
    const response = await apiClient.get(
      `/api/tension-curve/export/module/${moduleId}/csv`,
      {
        responseType: 'blob'
      }
    );
    return response.data;
  }

  /**
   * Export student tension history as JSON
   */
  async exportStudentDataJSON(
    studentId: string,
    moduleId?: string
  ): Promise<any> {
    const response = await apiClient.get(
      `/api/tension-curve/export/student/${studentId}/json`,
      {
        params: moduleId ? { module_id: moduleId } : {}
      }
    );
    return response.data;
  }
}

// Export singleton instance
export const tensionCurveAPI = new TensionCurveAPI();

// Export class for custom instances
export default TensionCurveAPI;

/**
 * React Hook for using Tension Curve API
 */
import { useState, useEffect, useCallback } from 'react';

export interface UseTensionCurveOptions {
  studentId: string;
  moduleId: string;
  timeRangeDays?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

export interface UseTensionCurveResult {
  data: TensionCurveData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useTensionCurve = ({
  studentId,
  moduleId,
  timeRangeDays = 30,
  autoRefresh = false,
  refreshInterval = 60000 // 1 minute
}: UseTensionCurveOptions): UseTensionCurveResult => {
  const [data, setData] = useState<TensionCurveData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await tensionCurveAPI.getStudentTensionCurve(
        studentId,
        moduleId,
        timeRangeDays
      );

      if (response.success && response.data) {
        setData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch tension curve');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tension curve:', err);
    } finally {
      setLoading(false);
    }
  }, [studentId, moduleId, timeRangeDays]);

  useEffect(() => {
    fetchData();

    // Setup auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  return {
    data,
    loading,
    error,
    refresh: fetchData
  };
};
