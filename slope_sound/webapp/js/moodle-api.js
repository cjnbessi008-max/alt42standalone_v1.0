/**
 * Slope Sound - Moodle API Integration
 * Handles communication with Moodle backend
 */

class MoodleAPI {
    constructor(baseUrl = '/local/slopesound/api.php') {
        this.baseUrl = baseUrl;
        this.currentAttemptId = null;
    }

    /**
     * Make API request
     * @param {string} action - API action
     * @param {Object} params - Additional parameters
     * @returns {Promise} - Response data
     */
    async request(action, params = {}) {
        const url = new URL(this.baseUrl, window.location.origin);
        url.searchParams.append('action', action);

        // Add all parameters to URL
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                credentials: 'same-origin', // Include Moodle session cookie
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }

            return data.data || data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Get single problem by ID
     */
    async getProblem(problemId) {
        return await this.request('get_problem', { id: problemId });
    }

    /**
     * Get all problems or filter by quiz
     */
    async getProblems(quizId = null) {
        const params = {};
        if (quizId) {
            params.quiz_id = quizId;
        }
        return await this.request('get_problems', params);
    }

    /**
     * Start a new attempt
     */
    async startAttempt(problemId) {
        const response = await this.request('start_attempt', {
            problem_id: problemId
        });
        this.currentAttemptId = response.attempt_id;
        return this.currentAttemptId;
    }

    /**
     * Log audio playback event
     */
    async logAudioEvent(xValue, slopeValue, frequencyHz) {
        if (!this.currentAttemptId) {
            console.warn('No active attempt');
            return;
        }

        return await this.request('log_audio_event', {
            attempt_id: this.currentAttemptId,
            x_value: xValue,
            slope_value: slopeValue,
            frequency_hz: frequencyHz
        });
    }

    /**
     * Update attempt progress
     */
    async updateAttempt(pointsExplored, timeSpent, completed = false, score = null) {
        if (!this.currentAttemptId) {
            console.warn('No active attempt');
            return;
        }

        const params = {
            attempt_id: this.currentAttemptId,
            points_explored: JSON.stringify(pointsExplored),
            time_spent: timeSpent,
            completed: completed ? 1 : 0
        };

        if (score !== null) {
            params.score = score;
        }

        return await this.request('update_attempt', params);
    }

    /**
     * Get user progress
     */
    async getUserProgress(problemId = null) {
        const params = {};
        if (problemId) {
            params.problem_id = problemId;
        }
        return await this.request('get_user_progress', params);
    }

    /**
     * Mock data for standalone testing (when Moodle not available)
     */
    getMockProblems() {
        return [
            {
                id: 1,
                title: 'Basic Quadratic',
                function_expression: 'x^2',
                x_min: -5,
                x_max: 5,
                difficulty_level: 1,
                sound_mapping_type: 'pitch'
            },
            {
                id: 2,
                title: 'Cubic Function',
                function_expression: 'x^3 - 3*x',
                x_min: -3,
                x_max: 3,
                difficulty_level: 2,
                sound_mapping_type: 'pitch'
            },
            {
                id: 3,
                title: 'Sine Wave',
                function_expression: 'sin(x)',
                x_min: -6.28,
                x_max: 6.28,
                difficulty_level: 1,
                sound_mapping_type: 'pitch'
            },
            {
                id: 4,
                title: 'Exponential',
                function_expression: 'exp(x/2)',
                x_min: -4,
                x_max: 4,
                difficulty_level: 3,
                sound_mapping_type: 'pitch'
            },
            {
                id: 5,
                title: 'Polynomial',
                function_expression: '0.1*x^3 - 0.5*x^2 + 2*x',
                x_min: -5,
                x_max: 10,
                difficulty_level: 2,
                sound_mapping_type: 'pitch'
            }
        ];
    }
}

// Export for use in other modules
window.MoodleAPI = MoodleAPI;
