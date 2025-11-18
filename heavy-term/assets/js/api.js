/**
 * Heavy Term API Client
 * Handles communication with backend API
 */

class HeavyTermAPI {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }

    /**
     * Make API request
     * @param {string} endpoint API endpoint
     * @param {string} method HTTP method
     * @param {Object} data Request data
     * @returns {Promise<Object>} Response data
     */
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}/${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'API request failed');
            }

            return responseData;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Get problem by ID with terms
     * @param {number} problemId Problem ID
     * @returns {Promise<Object>} Problem data
     */
    async getProblem(problemId) {
        return await this.request(`problems/${problemId}`);
    }

    /**
     * Get all problems
     * @param {Object} filters Filter parameters
     * @returns {Promise<Object>} Problems data
     */
    async getProblems(filters = {}) {
        const params = new URLSearchParams(filters);
        return await this.request(`problems?${params}`);
    }

    /**
     * Create new problem
     * @param {Object} problemData Problem data
     * @returns {Promise<Object>} Created problem
     */
    async createProblem(problemData) {
        return await this.request('problems', 'POST', problemData);
    }

    /**
     * Create user session
     * @param {number} userId Moodle user ID
     * @param {number} problemId Problem ID
     * @param {string} deviceType Device type
     * @returns {Promise<Object>} Session data
     */
    async createSession(userId, problemId, deviceType = 'smartphone') {
        return await this.request('sessions', 'POST', {
            moodle_user_id: userId,
            problem_id: problemId,
            device_type: deviceType
        });
    }

    /**
     * Get session details
     * @param {number} sessionId Session ID
     * @returns {Promise<Object>} Session data
     */
    async getSession(sessionId) {
        return await this.request(`sessions/${sessionId}`);
    }

    /**
     * Close session
     * @param {number} sessionId Session ID
     * @returns {Promise<Object>} Response
     */
    async closeSession(sessionId) {
        return await this.request(`sessions/${sessionId}`, 'PUT', {});
    }

    /**
     * Log interaction
     * @param {Object} interactionData Interaction data
     * @returns {Promise<Object>} Response
     */
    async logInteraction(interactionData) {
        return await this.request('interactions', 'POST', interactionData);
    }

    /**
     * Get physics settings
     * @returns {Promise<Object>} Settings data
     */
    async getSettings() {
        return await this.request('settings');
    }

    /**
     * Sync Moodle question
     * @param {number} questionId Moodle question ID
     * @param {number} courseId Moodle course ID
     * @param {number} quizId Moodle quiz ID (optional)
     * @returns {Promise<Object>} Response
     */
    async syncQuestion(questionId, courseId, quizId = null) {
        return await this.request('sync', 'POST', {
            question_id: questionId,
            course_id: courseId,
            quiz_id: quizId
        });
    }
}

/**
 * Toast notification utility
 */
class Toast {
    static show(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    static success(message, duration) {
        this.show(message, 'success', duration);
    }

    static error(message, duration) {
        this.show(message, 'error', duration);
    }

    static warning(message, duration) {
        this.show(message, 'warning', duration);
    }
}
