/**
 * Number Memory Pulse - Moodle API Client
 * Handles all communication with the Moodle backend
 */

class MoodleAPI {
    constructor(baseUrl = NMP_CONFIG.API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.requestCache = new Map();
        this.cacheTimeout = 5000; // 5 seconds
    }

    /**
     * Make API request
     */
    async request(action, method = 'GET', data = null) {
        const url = new URL(this.baseUrl, window.location.origin);
        url.searchParams.append('action', action);

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'same-origin'
        };

        if (method === 'POST' && data) {
            options.body = JSON.stringify(data);
        } else if (method === 'GET' && data) {
            Object.keys(data).forEach(key =>
                url.searchParams.append(key, data[key])
            );
        }

        try {
            const response = await fetch(url.toString(), options);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Request failed');
            }

            return result.data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * Get a problem from the server
     */
    async getProblem(difficulty = null) {
        const params = difficulty ? { difficulty } : {};
        return await this.request('get_problem', 'GET', params);
    }

    /**
     * Get the pattern for a problem
     */
    async getPattern(problemId) {
        const cacheKey = `pattern_${problemId}`;

        // Check cache
        if (this.requestCache.has(cacheKey)) {
            const cached = this.requestCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        // Fetch from server
        const data = await this.request('get_pattern', 'GET', { problem_id: problemId });

        // Cache the result
        this.requestCache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });

        return data;
    }

    /**
     * Submit an answer
     */
    async submitAnswer(problemId, userAnswer, timeSpent) {
        const data = {
            problem_id: problemId,
            user_answer: userAnswer,
            time_spent: timeSpent
        };

        return await this.request('submit_answer', 'POST', data);
    }

    /**
     * Get user progress
     */
    async getProgress() {
        return await this.request('get_progress', 'GET');
    }

    /**
     * Get leaderboard
     */
    async getLeaderboard(limit = 10) {
        return await this.request('get_leaderboard', 'GET', { limit });
    }

    /**
     * Get detailed statistics
     */
    async getStats() {
        return await this.request('get_stats', 'GET');
    }

    /**
     * Update settings (admin only)
     */
    async updateSettings(settings) {
        return await this.request('update_settings', 'POST', settings);
    }

    /**
     * Clear request cache
     */
    clearCache() {
        this.requestCache.clear();
    }

    /**
     * Batch requests (execute multiple requests in parallel)
     */
    async batchRequest(requests) {
        const promises = requests.map(req =>
            this.request(req.action, req.method || 'GET', req.data || null)
                .catch(error => ({ error: error.message }))
        );

        return await Promise.all(promises);
    }
}

// Create singleton instance
const api = new MoodleAPI();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodleAPI;
}
