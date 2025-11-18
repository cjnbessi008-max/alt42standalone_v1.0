/**
 * API Client for Blossom Sequence
 * Handles all backend communication
 */

const API_BASE_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:3000/api'
    : '/api';

class APIClient {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication
    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (data.token) {
            this.token = data.token;
            localStorage.setItem('authToken', data.token);
        }

        return data;
    }

    async register(username, password, email) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, email })
        });
    }

    async logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // User Stats
    async getUserStats() {
        return this.request('/user/stats');
    }

    async updateUserStats(stats) {
        return this.request('/user/stats', {
            method: 'PUT',
            body: JSON.stringify(stats)
        });
    }

    // Problem/Sequence Management
    async getRecommendedProblem() {
        return this.request('/problems/recommend');
    }

    async getProblem(sequenceType, difficulty, petalCount) {
        return this.request('/problems/generate', {
            method: 'POST',
            body: JSON.stringify({ sequenceType, difficulty, petalCount })
        });
    }

    // Attempt Management
    async submitAttempt(attemptData) {
        return this.request('/attempts/submit', {
            method: 'POST',
            body: JSON.stringify(attemptData)
        });
    }

    async getAttemptHistory(limit = 10) {
        return this.request(`/attempts/history?limit=${limit}`);
    }

    // Recommendations
    async getPersonalizedRecommendation() {
        return this.request('/recommendations/personalized');
    }

    async updateLearningProfile(performance) {
        return this.request('/recommendations/update-profile', {
            method: 'POST',
            body: JSON.stringify(performance)
        });
    }

    // Analytics
    async getPerformanceAnalytics(timeRange = '7d') {
        return this.request(`/analytics/performance?range=${timeRange}`);
    }
}

// Export singleton instance
const api = new APIClient();
