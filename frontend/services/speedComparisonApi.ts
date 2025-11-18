/**
 * API service for speed comparison endpoints
 */
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Types
export interface StudentAttempt {
  id?: string;
  student_id: string;
  module_id: string;
  problem_id: string;
  answer_data: Record<string, any>;
  is_correct: boolean;
  time_spent_seconds: number;
  hints_used?: number;
  attempts_count?: number;
  interaction_count?: number;
  attempted_at?: string;
}

export interface PerformanceMetrics {
  student_id: string;
  module_id: string;
  total_problems_attempted: number;
  total_problems_correct: number;
  accuracy_percentage: number;
  average_time_per_problem_seconds: number;
  median_time_per_problem_seconds: number;
  fastest_problem_time_seconds: number;
  slowest_problem_time_seconds: number;
  percentile_rank?: number;
  speed_vs_average_ratio?: number;
  total_time_spent_seconds: number;
  last_activity_at?: string;
  last_calculated_at: string;
}

export interface SpeedComparison {
  student_id: string;
  module_id: string;
  cohort_id?: string;
  student_avg_time_seconds: number;
  student_median_time_seconds: number;
  student_accuracy: number;
  student_percentile?: number;
  cohort_avg_time_seconds?: number;
  cohort_median_time_seconds?: number;
  cohort_avg_accuracy?: number;
  speed_vs_average_ratio?: number;
  is_faster_than_average?: boolean;
  rank_in_cohort?: number;
  total_students_in_cohort?: number;
  problems_attempted: number;
  last_activity?: string;
}

export interface SpeedTrend {
  snapshot_date: string;
  avg_speed_seconds: number;
  cohort_avg_speed_seconds?: number;
  percentile_rank?: number;
  problems_attempted: number;
  accuracy_percentage: number;
}

export interface SpeedComparisonResponse {
  comparison: SpeedComparison;
  trends: SpeedTrend[];
  recommendations: string[];
}

export interface CohortStatistics {
  cohort_id: string;
  module_id: string;
  active_student_count: number;
  total_attempts: number;
  avg_time_per_problem_seconds: number;
  median_time_per_problem_seconds: number;
  avg_accuracy_percentage: number;
  fastest_time_seconds: number;
  slowest_time_seconds: number;
  last_calculated_at: string;
}

export interface LeaderboardEntry {
  student_id: string;
  student_name?: string;
  average_time_per_problem_seconds: number;
  accuracy_percentage: number;
  total_problems_attempted: number;
  percentile_rank?: number;
}

export interface LeaderboardResponse {
  cohort_id: string;
  module_id: string;
  sort_by: string;
  leaderboard: LeaderboardEntry[];
}

// API Client Class
class SpeedComparisonApiService {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL: `${baseURL}/api/speed-comparison`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Add request interceptor for auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Redirect to login or refresh token
          console.error('Authentication failed');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Record a student's attempt on a problem
   */
  async recordAttempt(attempt: StudentAttempt): Promise<StudentAttempt> {
    const response = await this.client.post<StudentAttempt>('/attempts', attempt);
    return response.data;
  }

  /**
   * Get comprehensive speed comparison for a student
   */
  async getSpeedComparison(
    studentId: string,
    moduleId: string,
    options?: {
      cohortId?: string;
      includeTrends?: boolean;
      trendDays?: number;
    }
  ): Promise<SpeedComparisonResponse> {
    const params = new URLSearchParams();
    if (options?.cohortId) params.append('cohort_id', options.cohortId);
    if (options?.includeTrends !== undefined) {
      params.append('include_trends', String(options.includeTrends));
    }
    if (options?.trendDays) params.append('trend_days', String(options.trendDays));

    const response = await this.client.get<SpeedComparisonResponse>(
      `/students/${studentId}/modules/${moduleId}/comparison`,
      { params }
    );
    return response.data;
  }

  /**
   * Get detailed performance metrics for a student
   */
  async getStudentMetrics(
    studentId: string,
    moduleId: string,
    refresh: boolean = false
  ): Promise<PerformanceMetrics> {
    const response = await this.client.get<PerformanceMetrics>(
      `/students/${studentId}/modules/${moduleId}/metrics`,
      { params: { refresh } }
    );
    return response.data;
  }

  /**
   * Get cohort statistics
   */
  async getCohortStatistics(
    cohortId: string,
    moduleId: string,
    refresh: boolean = false
  ): Promise<CohortStatistics> {
    const response = await this.client.get<CohortStatistics>(
      `/cohorts/${cohortId}/modules/${moduleId}/statistics`,
      { params: { refresh } }
    );
    return response.data;
  }

  /**
   * Get leaderboard for a cohort
   */
  async getLeaderboard(
    cohortId: string,
    moduleId: string,
    options?: {
      limit?: number;
      sortBy?: 'speed' | 'accuracy' | 'overall';
      anonymize?: boolean;
    }
  ): Promise<LeaderboardResponse> {
    const params = new URLSearchParams();
    params.append('module_id', moduleId);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.sortBy) params.append('sort_by', options.sortBy);
    if (options?.anonymize !== undefined) {
      params.append('anonymize', String(options.anonymize));
    }

    const response = await this.client.get<LeaderboardResponse>(
      `/cohorts/${cohortId}/leaderboard`,
      { params }
    );
    return response.data;
  }

  /**
   * Create a new cohort
   */
  async createCohort(cohort: {
    name: string;
    description?: string;
    module_id: string;
    grade_level?: string;
    academic_year?: string;
    institution?: string;
  }): Promise<{ message: string; cohort_id: string }> {
    const response = await this.client.post('/cohorts', cohort);
    return response.data;
  }

  /**
   * Add a student to a cohort
   */
  async addStudentToCohort(
    cohortId: string,
    studentId: string
  ): Promise<{ message: string }> {
    const response = await this.client.post(
      `/cohorts/${cohortId}/students/${studentId}`
    );
    return response.data;
  }

  /**
   * Sync data with external LMS
   */
  async syncWithLMS(syncRequest: {
    sync_type: 'student_roster' | 'grades' | 'progress';
    lms_provider: string;
    module_id?: string;
    student_ids?: string[];
  }): Promise<any> {
    const response = await this.client.post('/lms/sync', syncRequest);
    return response.data;
  }
}

// Export singleton instance
export const speedComparisonApi = new SpeedComparisonApiService();

// Export class for custom instances
export default SpeedComparisonApiService;
