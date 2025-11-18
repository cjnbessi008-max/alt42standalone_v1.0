/**
 * API Client for Moodle Integration
 * Handles communication with backend PHP API
 */

class APIClient {
    constructor(baseURL = '../backend/moodle_integration.php') {
        this.baseURL = baseURL;
        this.studentId = this.getStudentIdFromURL() || 1; // Default for testing
        this.sessionToken = this.getSessionToken();
    }

    /**
     * Extract student ID from URL parameters
     */
    getStudentIdFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('student_id') || params.get('user_id');
    }

    /**
     * Get Moodle session token
     */
    getSessionToken() {
        const params = new URLSearchParams(window.location.search);
        return params.get('token') || 'dev_token';
    }

    /**
     * Fetch problem by Moodle question ID
     */
    async getProblem(moodleQuestionId) {
        try {
            const response = await fetch(
                `${this.baseURL}?action=get_problem&moodle_id=${moodleQuestionId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.error || 'Failed to fetch problem');
            }
        } catch (error) {
            console.error('Error fetching problem:', error);
            throw error;
        }
    }

    /**
     * Fetch problems by difficulty level
     */
    async getProblemsByDifficulty(difficulty = 'medium') {
        try {
            const response = await fetch(
                `${this.baseURL}?action=get_problems_by_difficulty&difficulty=${difficulty}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.error || 'Failed to fetch problems');
            }
        } catch (error) {
            console.error('Error fetching problems:', error);
            throw error;
        }
    }

    /**
     * Submit student attempt
     */
    async submitAttempt(problemId, attemptedInverse, isCorrect, interactionData = {}) {
        try {
            const response = await fetch(
                `${this.baseURL}?action=submit_attempt`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        student_id: this.studentId,
                        problem_id: problemId,
                        attempted_inverse: attemptedInverse,
                        is_correct: isCorrect,
                        interaction_data: interactionData
                    })
                }
            );

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error submitting attempt:', error);
            throw error;
        }
    }

    /**
     * Get student progress
     */
    async getProgress(problemId = null) {
        try {
            let url = `${this.baseURL}?action=get_progress&student_id=${this.studentId}`;
            if (problemId) {
                url += `&problem_id=${problemId}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.error || 'Failed to fetch progress');
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
            throw error;
        }
    }

    /**
     * Log interaction event
     */
    logInteraction(eventType, eventData) {
        // Store interactions in memory for later submission
        if (!window.interactionLog) {
            window.interactionLog = [];
        }

        window.interactionLog.push({
            type: eventType,
            data: eventData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get accumulated interaction log
     */
    getInteractionLog() {
        return window.interactionLog || [];
    }

    /**
     * Clear interaction log
     */
    clearInteractionLog() {
        window.interactionLog = [];
    }
}

// Create global API client instance
const apiClient = new APIClient();
