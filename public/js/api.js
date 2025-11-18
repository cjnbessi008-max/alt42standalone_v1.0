// API Communication Layer
class API {
    constructor() {
        this.baseURL = window.location.origin + '/api';
    }

    /**
     * Generic API call wrapper
     * @param {string} endpoint - API endpoint
     * @param {object} options - Fetch options
     * @returns {Promise} Response data
     */
    async call(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Get concept tree for a number
     * @param {number} number - The number
     * @param {number} depth - Tree depth
     * @returns {Promise} Concept tree data
     */
    async getConceptTree(number, depth = 3) {
        return await this.call(`/concepts/${number}?depth=${depth}`);
    }

    /**
     * Get all concepts
     * @returns {Promise} All concepts
     */
    async getAllConcepts() {
        return await this.call('/concepts');
    }

    /**
     * Track user interaction
     * @param {object} interaction - Interaction data
     * @returns {Promise} Tracking result
     */
    async trackInteraction(interaction) {
        return await this.call('/concepts/track', {
            method: 'POST',
            body: JSON.stringify(interaction)
        });
    }

    /**
     * Get problem from Moodle
     * @param {number} problemId - Problem ID
     * @returns {Promise} Problem data
     */
    async getProblem(problemId) {
        return await this.call(`/problems/${problemId}`);
    }

    /**
     * Test Moodle connection
     * @returns {Promise} Connection status
     */
    async testMoodleConnection() {
        return await this.call('/moodle/test');
    }

    /**
     * Get user courses from Moodle
     * @param {number} userId - User ID
     * @returns {Promise} User courses
     */
    async getUserCourses(userId) {
        return await this.call(`/moodle/courses/${userId}`);
    }

    /**
     * Get course contents from Moodle
     * @param {number} courseId - Course ID
     * @returns {Promise} Course contents
     */
    async getCourseContents(courseId) {
        return await this.call(`/moodle/course/${courseId}/contents`);
    }
}

// Create global API instance
const api = new API();
