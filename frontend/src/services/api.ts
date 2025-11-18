/**
 * API Service for Daily Mission LMS
 */
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Mission endpoints
  async getMissions(studentId: string) {
    const response = await this.client.get(`/api/missions/student/${studentId}`);
    return response.data;
  }

  async getMission(missionId: string) {
    const response = await this.client.get(`/api/missions/${missionId}`);
    return response.data;
  }

  async createMission(teacherId: string, missionData: any) {
    const response = await this.client.post(`/api/missions`, {
      ...missionData,
      teacher_id: teacherId,
    });
    return response.data;
  }

  async getDailyProblem(missionId: string, targetDate?: string) {
    const params = targetDate ? { target_date: targetDate } : {};
    const response = await this.client.get(`/api/missions/${missionId}/daily-problem`, {
      params,
    });
    return response.data;
  }

  async submitAnswer(missionId: string, studentId: string, submission: {
    problem_id: string;
    answer: any;
    time_spent_seconds?: number;
  }) {
    const response = await this.client.post(
      `/api/missions/${missionId}/submit`,
      submission,
      {
        params: { student_id: studentId },
      }
    );
    return response.data;
  }

  async getStudentDashboard(missionId: string, studentId: string) {
    const response = await this.client.get(
      `/api/missions/${missionId}/student/${studentId}/dashboard`
    );
    return response.data;
  }

  async getStudentProgress(missionId: string, studentId: string, targetDate?: string) {
    const params = targetDate ? { target_date: targetDate } : {};
    const response = await this.client.get(
      `/api/missions/${missionId}/progress/${studentId}`,
      { params }
    );
    return response.data;
  }

  async getStudentStreak(missionId: string, studentId: string) {
    const response = await this.client.get(
      `/api/missions/${missionId}/streak/${studentId}`
    );
    return response.data;
  }

  async getMissionAnalytics(missionId: string) {
    const response = await this.client.get(`/api/missions/${missionId}/analytics`);
    return response.data;
  }

  // LMS endpoints
  async getLMSStatus() {
    const response = await this.client.get('/api/lms/status');
    return response.data;
  }

  async syncUserFromLMS(lmsUserId: string) {
    const response = await this.client.get(`/api/lms/user/${lmsUserId}`);
    return response.data;
  }

  async getCourseStudents(lmsCourseId: string) {
    const response = await this.client.get(`/api/lms/course/${lmsCourseId}/students`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
