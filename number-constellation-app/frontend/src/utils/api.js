/**
 * API utilities for Number Constellation
 * Handles communication with backend
 */

const API = {
    baseURL: window.location.protocol + '//' + window.location.hostname + ':8080/api',
    apiKey: 'your-secret-api-key-here',

    /**
     * Get problem data
     * @param {string} problemId
     * @returns {Promise<object>}
     */
    async getProblem(problemId) {
        try {
            const response = await fetch(`${this.baseURL}/get_problem.php?problem_id=${problemId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching problem:', error);
            throw error;
        }
    },

    /**
     * Save student progress
     * @param {object} progressData
     * @returns {Promise<object>}
     */
    async saveProgress(progressData) {
        try {
            const response = await fetch(`${this.baseURL}/progress.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify(progressData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error saving progress:', error);
            throw error;
        }
    },

    /**
     * Get student progress
     * @param {string} problemId
     * @param {number} userId
     * @returns {Promise<object>}
     */
    async getProgress(problemId, userId) {
        try {
            const response = await fetch(`${this.baseURL}/progress.php?problem_id=${problemId}&user_id=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching progress:', error);
            throw error;
        }
    },

    /**
     * Get URL parameter
     * @param {string} name
     * @returns {string|null}
     */
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
