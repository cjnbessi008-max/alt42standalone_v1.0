import axios, { AxiosInstance } from 'axios';

/**
 * Problem data structure
 */
export interface Problem {
  id: number;
  title: string;
  description: string;
  dataArray: number[];
  expectedAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
  updatedAt?: string;
}

/**
 * Student attempt/submission data
 */
export interface Attempt {
  attemptId: number;
  studentId?: number;
  problemId: number;
  answer: number;
  isCorrect: boolean;
  timeSpent?: number;
  submittedAt: string;
}

/**
 * User data
 */
export interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

/**
 * Progress data
 */
export interface Progress {
  studentId: number;
  totalProblemsAttempted: number;
  totalProblemsCorrect: number;
  totalAttempts: number;
  successRate: number;
  lastActivity: string;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
  rank: number;
  studentId: number;
  username: string;
  name: string;
  totalProblemsCorrect: number;
  totalProblemsAttempted: number;
  successRate: number;
}

/**
 * Standalone Service
 *
 * Service layer for standalone web app (no Moodle dependency)
 * Connects to Node.js/Express backend with SQLite database
 */
class StandaloneService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = import.meta.env.VITE_API_URL || '/api') {
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
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error('Authentication error - please log in');
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
    return localStorage.getItem('auth_token');
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  /**
   * Handle authentication errors
   */
  private handleAuthError(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    // Don't auto-redirect, let the component handle it
  }

  /**
   * Register a new user
   */
  async register(
    username: string,
    password: string,
    firstname: string,
    lastname: string,
    email: string
  ): Promise<{ token: string; user: User }> {
    try {
      const response = await this.api.post('/auth/register', {
        username,
        password,
        firstname,
        lastname,
        email
      });

      this.setAuthToken(response.data.token);
      localStorage.setItem('current_user', JSON.stringify(response.data.user));

      return response.data;
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  /**
   * Login user
   */
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const response = await this.api.post('/auth/login', {
        username,
        password
      });

      this.setAuthToken(response.data.token);
      localStorage.setItem('current_user', JSON.stringify(response.data.user));

      return response.data;
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  /**
   * Fetch all problems
   */
  async getAllProblems(difficulty?: string): Promise<Problem[]> {
    try {
      const params = difficulty ? { difficulty } : {};
      const response = await this.api.get<Problem[]>('/problems', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching problems:', error);
      throw new Error('Failed to fetch problems');
    }
  }

  /**
   * Fetch problem by ID
   */
  async getProblemById(problemId: number): Promise<Problem> {
    try {
      const response = await this.api.get<Problem>(`/problems/${problemId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching problem:', error);
      throw new Error('Failed to fetch problem');
    }
  }

  /**
   * Submit student answer
   */
  async submitAnswer(problemId: number, answer: number, timeSpent?: number): Promise<Attempt> {
    try {
      const response = await this.api.post<Attempt>('/attempts', {
        problemId,
        answer,
        timeSpent
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw new Error('Failed to submit answer');
    }
  }

  /**
   * Get attempt history for a problem
   */
  async getAttemptHistory(problemId: number): Promise<Attempt[]> {
    try {
      const response = await this.api.get<Attempt[]>(`/attempts/problem/${problemId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching attempt history:', error);
      throw new Error('Failed to fetch attempt history');
    }
  }

  /**
   * Get attempt statistics
   */
  async getAttemptStats(): Promise<{
    totalProblemsAttempted: number;
    totalCorrectAttempts: number;
    totalAttempts: number;
    avgTimeSpent: number;
  }> {
    try {
      const response = await this.api.get('/attempts/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw new Error('Failed to fetch statistics');
    }
  }

  /**
   * Get student progress
   */
  async getProgress(): Promise<Progress> {
    try {
      const response = await this.api.get<Progress>('/progress');
      return response.data;
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw new Error('Failed to fetch progress');
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const response = await this.api.get<LeaderboardEntry[]>('/progress/leaderboard', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw new Error('Failed to fetch leaderboard');
    }
  }

  /**
   * Create a new problem (teacher/admin only)
   */
  async createProblem(problem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>): Promise<Problem> {
    try {
      const response = await this.api.post<{ problem: Problem }>('/problems', problem);
      return response.data.problem;
    } catch (error: any) {
      console.error('Error creating problem:', error);
      throw new Error(error.response?.data?.error || 'Failed to create problem');
    }
  }
}

// Singleton instance
export const standaloneService = new StandaloneService();

export default StandaloneService;
