import axios, { AxiosInstance } from 'axios';
import type {
  Problem,
  ProblemWithTree,
  SessionProgress,
  Analytics,
  LaunchResponse,
  TreeNode,
  StudentPath
} from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // =============================================
  // Health Check
  // =============================================
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // =============================================
  // Moodle Integration
  // =============================================
  async moodleLaunch(data: {
    moodle_problem_id: string;
    moodle_course_id?: number;
    moodle_user_id: number;
    question_text: string;
    problem_type?: string;
    difficulty_level?: number;
  }): Promise<LaunchResponse> {
    const response = await this.client.post('/moodle/launch', data);
    return response.data;
  }

  async getMoodleProblem(moodleProblemId: string): Promise<Problem> {
    const response = await this.client.get(`/moodle/problem/${moodleProblemId}`);
    return response.data;
  }

  // =============================================
  // Problems
  // =============================================
  async getProblems(): Promise<Problem[]> {
    const response = await this.client.get('/problems');
    return response.data;
  }

  async getProblem(problemId: string): Promise<ProblemWithTree> {
    const response = await this.client.get(`/problems/${problemId}`);
    return response.data;
  }

  async createProblem(problem: Partial<Problem>): Promise<{ success: boolean; problem_id: string }> {
    const response = await this.client.post('/problems', problem);
    return response.data;
  }

  // =============================================
  // Tree Nodes
  // =============================================
  async getTree(problemId: string): Promise<{ problem_id: string; tree: TreeNode[]; nodes: TreeNode[] }> {
    const response = await this.client.get(`/tree/${problemId}`);
    return response.data;
  }

  async addTreeNode(node: {
    problem_id: string;
    parent_id?: string | null;
    node_type: string;
    label: string;
    description?: string;
    position_x?: number;
    position_y?: number;
    is_correct?: boolean;
    metadata?: any;
  }): Promise<{ success: boolean; node_id: string }> {
    const response = await this.client.post('/tree/node', node);
    return response.data;
  }

  // =============================================
  // Student Sessions
  // =============================================
  async recordPath(path: {
    session_id: string;
    node_id: string;
    sequence_order: number;
    time_spent?: number;
    student_input?: any;
    feedback_given?: string;
  }): Promise<{ success: boolean; path_id: string }> {
    const response = await this.client.post('/session/path', path);
    return response.data;
  }

  async getSessionProgress(sessionId: string): Promise<SessionProgress> {
    const response = await this.client.get(`/session/${sessionId}/progress`);
    return response.data;
  }

  async completeSession(sessionId: string, finalScore: number): Promise<{ success: boolean; message: string }> {
    const response = await this.client.put(`/session/${sessionId}/complete`, {
      final_score: finalScore
    });
    return response.data;
  }

  // =============================================
  // Analytics
  // =============================================
  async getAnalytics(problemId: string): Promise<Analytics> {
    const response = await this.client.get(`/analytics/${problemId}`);
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
