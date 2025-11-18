/**
 * API Module
 * Handles all HTTP requests to the backend
 */

class API {
    constructor() {
        this.baseURL = window.location.origin;
        this.token = localStorage.getItem('token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Remove authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Get authorization headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders()
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async register(username, email, password, fullName) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password, fullName })
        });
    }

    async login(username, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async guestLogin() {
        return this.request('/api/auth/guest', {
            method: 'POST'
        });
    }

    async getCurrentUser() {
        return this.request('/api/auth/me');
    }

    // Problem endpoints
    async getRecommendedProblem() {
        return this.request('/api/problems/recommended');
    }

    async submitAnswer(problemId, answer, timeSpent, hintUsed = false) {
        return this.request(`/api/problems/${problemId}/submit`, {
            method: 'POST',
            body: JSON.stringify({ answer, timeSpent, hintUsed })
        });
    }

    async getStats() {
        return this.request('/api/problems/stats');
    }

    async getAchievements() {
        return this.request('/api/problems/achievements');
    }
}

// Create global API instance
const api = new API();
