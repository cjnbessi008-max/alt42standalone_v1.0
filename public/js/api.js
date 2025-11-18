/**
 * API Client
 * Handles all API requests
 */

const API = {
    /**
     * Generic request method
     */
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const config = { ...defaultOptions, ...options };

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
    },

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        return this.request(url, {
            method: 'GET'
        });
    },

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // ========== Problem Endpoints ==========

    /**
     * Get all problems
     */
    async getProblems(filters = {}) {
        return this.get('/problems', filters);
    },

    /**
     * Get problem by ID
     */
    async getProblem(id) {
        return this.get(`/problems/${id}`);
    },

    /**
     * Get random problem
     */
    async getRandomProblem(filters = {}) {
        return this.get('/problems/random', filters);
    },

    /**
     * Get comparison pair for problem
     */
    async getComparison(problemId) {
        return this.get(`/problems/${problemId}/comparison`);
    },

    /**
     * Get problem statistics
     */
    async getProblemStats(problemId) {
        return this.get(`/problems/${problemId}/stats`);
    },

    /**
     * Create problem
     */
    async createProblem(data) {
        return this.post('/problems', data);
    },

    /**
     * Create problem with AI-generated solutions
     */
    async createProblemWithSolutions(data) {
        return this.post('/problems/with-solutions', data);
    },

    // ========== Attempt Endpoints ==========

    /**
     * Submit student attempt
     */
    async submitAttempt(data) {
        return this.post('/attempts', data);
    },

    /**
     * Get student attempt history
     */
    async getAttemptHistory(studentId, params = {}) {
        return this.get(`/attempts/${studentId}`, params);
    },

    /**
     * Get student statistics
     */
    async getStudentStats(studentId) {
        return this.get(`/attempts/${studentId}/stats`);
    },

    /**
     * Get leaderboard
     */
    async getLeaderboard(limit = 10) {
        return this.get('/attempts/leaderboard', { limit });
    },

    // ========== Health Check ==========

    /**
     * Check API health
     */
    async checkHealth() {
        return this.get('/health');
    }
};
