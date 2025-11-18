/**
 * API Client
 * Handles communication with PHP backend
 */

class ApiClient {
    constructor(baseUrl = '/backend/public') {
        this.baseUrl = baseUrl;
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        const config = {
            method: options.method || 'GET',
            headers: { ...this.headers, ...options.headers },
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;

        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ===== Trail API Methods =====

    /**
     * Create new trail
     */
    async createTrail(trailData) {
        return this.post('/api/trails', trailData);
    }

    /**
     * Get trail by ID
     */
    async getTrail(trailId) {
        return this.get(`/api/trails/${trailId}`);
    }

    /**
     * Get trails for problem and student
     */
    async getTrailsByProblemAndStudent(problemId, studentId) {
        return this.get('/api/trails/student', {
            problem_id: problemId,
            student_id: studentId
        });
    }

    /**
     * Record trail interaction
     */
    async recordInteraction(trailId, interactionData) {
        return this.post(`/api/trails/${trailId}/interactions`, interactionData);
    }

    /**
     * Submit trail
     */
    async submitTrail(trailId, submissionData) {
        return this.post(`/api/trails/${trailId}/submit`, submissionData);
    }

    /**
     * Validate trail against problem target
     */
    async validateTrail(trailId, problemId, tolerance = 5.0) {
        return this.post(`/api/trails/${trailId}/validate`, {
            problem_id: problemId,
            tolerance: tolerance
        });
    }

    /**
     * Delete trail
     */
    async deleteTrail(trailId) {
        return this.delete(`/api/trails/${trailId}`);
    }

    // ===== Problem API Methods =====

    /**
     * Get problem by ID
     */
    async getProblem(problemId) {
        return this.get(`/api/problems/${problemId}`);
    }

    /**
     * Get problems for course
     */
    async getProblemsByCourse(courseId) {
        return this.get('/api/problems', { course_id: courseId });
    }

    // ===== Student API Methods =====

    /**
     * Get student statistics
     */
    async getStudentStatistics(studentId) {
        return this.get(`/api/students/${studentId}/statistics`);
    }

    /**
     * Get student profile
     */
    async getStudentProfile(studentId) {
        return this.get(`/api/students/${studentId}`);
    }

    // ===== Session API Methods =====

    /**
     * Start new session
     */
    async startSession(sessionData) {
        return this.post('/api/sessions', sessionData);
    }

    /**
     * Update session activity
     */
    async updateSession(sessionId) {
        return this.put(`/api/sessions/${sessionId}`, {
            last_activity_at: new Date().toISOString()
        });
    }

    /**
     * End session
     */
    async endSession(sessionId) {
        return this.put(`/api/sessions/${sessionId}`, {
            ended_at: new Date().toISOString()
        });
    }

    // ===== Moodle Integration Methods =====

    /**
     * Sync user from Moodle
     */
    async syncMoodleUser(moodleUserId, userData) {
        return this.post('/api/moodle/users/sync', {
            moodle_user_id: moodleUserId,
            ...userData
        });
    }

    /**
     * Sync problem from Moodle
     */
    async syncMoodleProblem(moodleProblemId, problemData) {
        return this.post('/api/moodle/problems/sync', {
            moodle_problem_id: moodleProblemId,
            ...problemData
        });
    }

    /**
     * Send submission to Moodle
     */
    async syncSubmissionToMoodle(submissionId) {
        return this.post(`/api/moodle/submissions/${submissionId}/sync`);
    }
}

// Create global instance
const api = new ApiClient();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}
