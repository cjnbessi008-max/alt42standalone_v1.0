import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class APIService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response.data,
      error => {
        console.error('API Error:', error);
        throw error;
      }
    );
  }

  /**
   * Get expansion mode configuration
   */
  async getExpansionConfig() {
    const response = await this.client.get('/expansion/config');
    return response.data;
  }

  /**
   * Calculate current expansion size
   */
  async calculateExpansion(params) {
    const response = await this.client.post('/expansion/calculate', params);
    return response.data;
  }

  /**
   * Get questions from Moodle
   */
  async getQuestions(quizId) {
    const response = await this.client.get(`/moodle/questions/${quizId}`);
    return response.data;
  }

  /**
   * Get specific question details
   */
  async getQuestionDetails(questionId) {
    const response = await this.client.get(`/moodle/question/${questionId}`);
    return response.data;
  }

  /**
   * Submit answer to Moodle
   */
  async submitAnswer(questionId, answer, userId) {
    const response = await this.client.post('/moodle/submit', {
      questionId,
      answer,
      userId
    });
    return response.data;
  }

  /**
   * Get user progress
   */
  async getUserProgress(userId, quizId) {
    const response = await this.client.get(`/moodle/progress/${userId}/${quizId}`);
    return response.data;
  }

  /**
   * Test Moodle connection
   */
  async testMoodleConnection() {
    const response = await this.client.get('/moodle/test');
    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export default new APIService();
