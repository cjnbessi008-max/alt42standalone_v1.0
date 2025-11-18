/**
 * API Client for Probability Grid
 * Handles all communication with the backend API
 */

class APIClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || '/src/api/api.php';
        this.sessionId = null;
    }

    /**
     * Set session ID for authenticated requests
     */
    setSession(sessionId) {
        this.sessionId = sessionId;
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}?action=${endpoint}`;

        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, finalOptions);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Request failed');
            }

            return await response.json();

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Get problem data
     */
    async getProblem(problemId, sessionId = null) {
        const sid = sessionId || this.sessionId;
        const params = new URLSearchParams();

        if (problemId) {
            params.append('id', problemId);
        }
        if (sid) {
            params.append('session', sid);
        }

        const url = `${this.baseUrl}?action=get-problem&${params.toString()}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to get problem');
            }

            return data.problem;

        } catch (error) {
            console.error('Failed to get problem:', error);
            throw error;
        }
    }

    /**
     * Submit student answer
     */
    async submitAnswer(problemId, answer, interactionData = null, timeSpent = 0) {
        const data = {
            problem_id: problemId,
            user_id: this.userId || 1,
            answer: answer,
            interaction_data: interactionData,
            time_spent: timeSpent
        };

        try {
            const response = await fetch(`${this.baseUrl}?action=submit-answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to submit answer');
            }

            return result;

        } catch (error) {
            console.error('Failed to submit answer:', error);
            throw error;
        }
    }

    /**
     * Get session information
     */
    async getSession(sessionId = null) {
        const sid = sessionId || this.sessionId;

        if (!sid) {
            throw new Error('Session ID not provided');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}?action=get-session&session_id=${encodeURIComponent(sid)}`
            );

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to get session');
            }

            return data.session;

        } catch (error) {
            console.error('Failed to get session:', error);
            throw error;
        }
    }

    /**
     * Save student progress
     */
    async saveProgress(progressData) {
        if (!this.sessionId) {
            throw new Error('Session ID not set');
        }

        const data = {
            session_id: this.sessionId,
            progress: progressData
        };

        try {
            const response = await fetch(`${this.baseUrl}?action=save-progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to save progress');
            }

            return result;

        } catch (error) {
            console.error('Failed to save progress:', error);
            throw error;
        }
    }

    /**
     * Get list of problems
     */
    async getProblems(courseId = null) {
        const params = new URLSearchParams({ action: 'get-problems' });

        if (courseId) {
            params.append('course_id', courseId);
        }

        try {
            const response = await fetch(`${this.baseUrl}?${params.toString()}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to get problems');
            }

            return data.problems;

        } catch (error) {
            console.error('Failed to get problems:', error);
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}
