/**
 * API Communication Module
 * Handles all backend API calls
 */

const API = {
    baseUrl: '',

    /**
     * Initialize API with configuration
     */
    init(config) {
        this.baseUrl = config.apiUrl;
        this.sessionToken = config.sessionToken;
    },

    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.sessionToken) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.sessionToken}`;
        }

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(url, finalOptions);

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
    },

    /**
     * Get problem details
     */
    async getProblem(problemId) {
        return this.request(`get_problem?problem_id=${problemId}`, {
            method: 'GET'
        });
    },

    /**
     * Get solution steps for a problem
     */
    async getSolution(problemId) {
        return this.request(`get_solution?problem_id=${problemId}`, {
            method: 'GET'
        });
    },

    /**
     * Start a new attempt
     */
    async startAttempt(userId, problemId) {
        return this.request('start_attempt', {
            method: 'POST',
            body: JSON.stringify({
                moodle_user_id: userId,
                problem_id: problemId
            })
        });
    },

    /**
     * Update attempt progress
     */
    async updateAttempt(attemptId, currentStep, timeSpent, completed = false) {
        return this.request('update_attempt', {
            method: 'POST',
            body: JSON.stringify({
                attempt_id: attemptId,
                current_step: currentStep,
                time_spent: timeSpent,
                completed: completed
            })
        });
    },

    /**
     * Create a new problem (for testing)
     */
    async createProblem(expression, courseId, quizId, questionId, difficulty = 'basic') {
        return this.request('create_problem', {
            method: 'POST',
            body: JSON.stringify({
                expression: expression,
                moodle_course_id: courseId,
                moodle_quiz_id: quizId,
                moodle_question_id: questionId,
                difficulty_level: difficulty
            })
        });
    },

    /**
     * Sync problem from Moodle
     */
    async syncFromMoodle(questionId, courseId, quizId, difficulty = 'basic') {
        return this.request('sync_from_moodle', {
            method: 'POST',
            body: JSON.stringify({
                question_id: questionId,
                course_id: courseId,
                quiz_id: quizId,
                difficulty_level: difficulty
            })
        });
    }
};

// Export for use in other modules
window.API = API;
