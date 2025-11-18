/**
 * API Client
 * 서버와의 통신을 담당
 */

const API_BASE_URL = window.location.origin + '/api';

class APIClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(method, endpoint, data = null) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Request failed');
      }

      return result;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Auth
  async register(username, email, password, role = 'student') {
    return this.request('POST', '/auth/register', { username, email, password, role });
  }

  async login(email, password) {
    return this.request('POST', '/auth/login', { email, password });
  }

  async logout() {
    return this.request('POST', '/auth/logout');
  }

  async getCurrentUser() {
    return this.request('GET', '/auth/me');
  }

  // Activity
  async getActivityLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/activity/logs?${query}`);
  }

  async createActivityLog(data) {
    return this.request('POST', '/activity/logs', data);
  }

  async getUserStats(userId) {
    return this.request('GET', `/activity/stats/${userId}`);
  }

  // Problems
  async getProblems(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request('GET', `/problems?${query}`);
  }

  async getProblem(id) {
    return this.request('GET', `/problems/${id}`);
  }

  // Recommendations
  async getRecommendedProblems() {
    return this.request('GET', '/recommendations/problems');
  }

  async getNextLevel() {
    return this.request('GET', '/recommendations/next-level');
  }

  async getWeakAreasRecommendation() {
    return this.request('GET', '/recommendations/weak-areas');
  }
}

// Export
window.api = new APIClient();
