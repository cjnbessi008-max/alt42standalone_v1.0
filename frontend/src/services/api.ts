/**
 * API service for backend communication
 */
import axios, { AxiosInstance } from 'axios';
import { AnalysisRequest, AnalysisResult, Student, Submission } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class APIService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Analyze PHP code
   */
  async analyzeCode(request: AnalysisRequest): Promise<AnalysisResult> {
    const response = await this.client.post<AnalysisResult>('/api/analysis/analyze', request);
    return response.data;
  }

  /**
   * Get analysis result by submission ID
   */
  async getAnalysis(submissionId: string): Promise<AnalysisResult> {
    const response = await this.client.get<AnalysisResult>(`/api/analysis/submission/${submissionId}`);
    return response.data;
  }

  /**
   * Get student submissions
   */
  async getStudentSubmissions(studentId: string): Promise<{ submissions: Submission[] }> {
    const response = await this.client.get(`/api/analysis/student/${studentId}/submissions`);
    return response.data;
  }

  /**
   * Get student information
   */
  async getStudent(studentId: string): Promise<Student> {
    const response = await this.client.get<Student>(`/api/students/${studentId}`);
    return response.data;
  }

  /**
   * Get student statistics
   */
  async getStudentStats(studentId: string): Promise<any> {
    const response = await this.client.get(`/api/students/${studentId}/stats`);
    return response.data;
  }

  /**
   * Create a new student
   */
  async createStudent(student: Partial<Student>): Promise<Student> {
    const response = await this.client.post<Student>('/api/students/', student);
    return response.data;
  }

  /**
   * Sync user from Moodle
   */
  async syncMoodleUser(moodleUserId: number): Promise<any> {
    const response = await this.client.post(`/api/moodle/sync-user/${moodleUserId}`);
    return response.data;
  }
}

export const apiService = new APIService();
export default apiService;
