/**
 * Moodle API Service
 * Handles all communication with Moodle backend
 */
export class MoodleAPI {
    constructor(apiEndpoint, courseId) {
        this.apiEndpoint = apiEndpoint;
        this.courseId = courseId;
    }

    /**
     * Make API request to Moodle
     * @param {string} action - API action
     * @param {object} params - Additional parameters
     * @returns {Promise<object>}
     */
    async request(action, params = {}) {
        const url = new URL(this.apiEndpoint);
        url.searchParams.append('action', action);
        url.searchParams.append('courseid', this.courseId);

        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;
        } catch (error) {
            console.error('Moodle API Error:', error);
            throw error;
        }
    }

    /**
     * Get all problems for the course
     * @returns {Promise<Array>}
     */
    async getProblems() {
        return this.request('get_problems');
    }

    /**
     * Get a specific problem
     * @param {number} problemId
     * @returns {Promise<object>}
     */
    async getProblem(problemId) {
        return this.request('get_problem', { problemid: problemId });
    }

    /**
     * Save a new attempt
     * @param {number} problemId
     * @param {object} attemptData
     * @returns {Promise<object>}
     */
    async saveAttempt(problemId, attemptData) {
        const url = new URL(this.apiEndpoint);
        const formData = new FormData();
        formData.append('action', 'save_attempt');
        formData.append('courseid', this.courseId);
        formData.append('problemid', problemId);
        formData.append('data', JSON.stringify(attemptData.answer));
        formData.append('rotation_count', attemptData.rotationCount || 0);
        formData.append('time_spent', attemptData.timeSpent || 0);

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to save attempt');
        }

        return data;
    }

    /**
     * Update an existing attempt
     * @param {number} attemptId
     * @param {object} attemptData
     * @returns {Promise<object>}
     */
    async updateAttempt(attemptId, attemptData) {
        const url = new URL(this.apiEndpoint);
        const formData = new FormData();
        formData.append('action', 'update_attempt');
        formData.append('courseid', this.courseId);
        formData.append('attemptid', attemptId);
        formData.append('data', JSON.stringify(attemptData.answer));
        formData.append('rotation_count', attemptData.rotationCount || 0);
        formData.append('time_spent', attemptData.timeSpent || 0);
        formData.append('completed', attemptData.completed ? 1 : 0);

        if (attemptData.score !== undefined) {
            formData.append('score', attemptData.score);
        }

        const response = await fetch(url, {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to update attempt');
        }

        return data;
    }

    /**
     * Get configuration for the course
     * @returns {Promise<object>}
     */
    async getConfig() {
        return this.request('get_config');
    }
}
