import axios, { AxiosInstance } from 'axios';

/**
 * Problem data structure from Moodle LMS
 */
export interface MoodleProblem {
  id: number;
  questionId: number;
  title: string;
  description: string;
  dataArray: number[];
  expectedAnswer?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Student attempt/submission data
 */
export interface StudentAttempt {
  attemptId: number;
  studentId: number;
  problemId: number;
  answer: number;
  isCorrect: boolean;
  submittedAt: string;
}

/**
 * Moodle LMS Integration Service
 *
 * Connects to Moodle 3.7 backend via REST API to fetch problem data
 * and submit student responses.
 *
 * Compatible with:
 * - MySQL 5.7
 * - PHP 7.1.9
 * - Moodle 3.7
 */
class MoodleService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor for authentication
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error('Unauthorized access - redirecting to login');
          // Handle authentication error
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('moodle_token');
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    localStorage.setItem('moodle_token', token);
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(): void {
    localStorage.removeItem('moodle_token');
    window.location.href = '/login';
  }

  /**
   * Fetch problem data by ID from Moodle database
   *
   * @param problemId - The problem ID from mdl_question table
   * @returns Promise with problem data including array for partial sum calculation
   */
  async getProblemById(problemId: number): Promise<MoodleProblem> {
    try {
      const response = await this.api.get<MoodleProblem>(`/problems/${problemId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching problem:', error);
      throw new Error('Failed to fetch problem data from Moodle');
    }
  }

  /**
   * Fetch all available problems for current user
   *
   * @returns Promise with array of problems
   */
  async getAllProblems(): Promise<MoodleProblem[]> {
    try {
      const response = await this.api.get<MoodleProblem[]>('/problems');
      return response.data;
    } catch (error) {
      console.error('Error fetching problems:', error);
      throw new Error('Failed to fetch problems from Moodle');
    }
  }

  /**
   * Submit student answer to Moodle
   *
   * @param problemId - The problem ID
   * @param answer - Student's calculated answer
   * @returns Promise with submission result
   */
  async submitAnswer(problemId: number, answer: number): Promise<StudentAttempt> {
    try {
      const response = await this.api.post<StudentAttempt>('/attempts', {
        problemId,
        answer,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw new Error('Failed to submit answer to Moodle');
    }
  }

  /**
   * Get student's attempt history for a problem
   *
   * @param problemId - The problem ID
   * @returns Promise with array of attempts
   */
  async getAttemptHistory(problemId: number): Promise<StudentAttempt[]> {
    try {
      const response = await this.api.get<StudentAttempt[]>(`/attempts/${problemId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching attempt history:', error);
      throw new Error('Failed to fetch attempt history');
    }
  }

  /**
   * Authenticate user with Moodle credentials
   *
   * @param username - Moodle username
   * @param password - Moodle password
   * @returns Promise with authentication token
   */
  async login(username: string, password: string): Promise<string> {
    try {
      const response = await this.api.post<{ token: string }>('/auth/login', {
        username,
        password
      });
      this.setAuthToken(response.data.token);
      return response.data.token;
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
      localStorage.removeItem('moodle_token');
    } catch (error) {
      console.error('Logout failed:', error);
      localStorage.removeItem('moodle_token');
    }
  }
}

// Singleton instance
export const moodleService = new MoodleService();

export default MoodleService;
