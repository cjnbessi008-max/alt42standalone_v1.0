/**
 * API Client for Chaos Harmony
 * Communicates with PHP backend
 */

class APIClient {
    constructor(baseURL = '/backend/api/quiz_api.php') {
        this.baseURL = baseURL;
    }

    /**
     * Make API request
     */
    async request(action, options = {}) {
        const url = `${this.baseURL}?action=${action}`;
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        if (options.params) {
            const params = new URLSearchParams(options.params);
            url += '&' + params.toString();
        }

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * Sync quiz data from Moodle
     */
    async syncQuiz(quizId) {
        return this.request('sync', {
            method: 'POST',
            body: { quiz_id: quizId }
        });
    }

    /**
     * Get quiz questions
     */
    async getQuestions(quizId) {
        return this.request('questions', {
            params: { quiz_id: quizId }
        });
    }

    /**
     * Get student attempts
     */
    async getAttempts(studentId, quizId = null) {
        const params = { student_id: studentId };
        if (quizId) {
            params.quiz_id = quizId;
        }
        return this.request('attempts', { params });
    }

    /**
     * Get chaos harmony patterns
     */
    async getPatterns(studentId) {
        return this.request('patterns', {
            params: { student_id: studentId }
        });
    }

    /**
     * Get visualization state
     */
    async getVisualization(studentId) {
        return this.request('visualization', {
            params: { student_id: studentId }
        });
    }

    /**
     * Submit a student attempt
     */
    async submitAttempt(attemptData) {
        return this.request('submit_attempt', {
            method: 'POST',
            body: attemptData
        });
    }
}

// Create global API client instance
const api = new APIClient();
