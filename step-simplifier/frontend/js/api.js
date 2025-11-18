/**
 * API Client
 * Handles all API communication
 */

class API {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    /**
     * Make HTTP request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;

        try {
            logger.log('API Request:', url, options);

            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            const data = await response.json();

            logger.log('API Response:', data);

            if (!data.success) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;
        } catch (error) {
            logger.error('API Error:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ===== Problem APIs =====

    /**
     * Get all problems
     */
    async getProblems(limit = 50, offset = 0) {
        return this.get(`problems?limit=${limit}&offset=${offset}`);
    }

    /**
     * Get problem by ID
     */
    async getProblem(problemId) {
        return this.get(`problems/${problemId}`);
    }

    /**
     * Get problem steps
     */
    async getProblemSteps(problemId) {
        return this.get(`problems/${problemId}/steps`);
    }

    /**
     * Get specific step
     */
    async getStep(problemId, stepNumber) {
        return this.get(`problems/${problemId}/steps/${stepNumber}`);
    }

    /**
     * Create new problem
     */
    async createProblem(moodleQuestionId, equationText, difficulty = 'medium') {
        return this.post('problems', {
            moodle_question_id: moodleQuestionId,
            equation_text: equationText,
            difficulty: difficulty
        });
    }

    // ===== Progress APIs =====

    /**
     * Start problem
     */
    async startProblem(userId, problemId) {
        return this.post('progress/start', {
            user_id: userId,
            problem_id: problemId
        });
    }

    /**
     * Submit step answer
     */
    async submitAnswer(userId, problemId, stepNumber, userAnswer, timeSpent = 0) {
        return this.post('progress/submit', {
            user_id: userId,
            problem_id: problemId,
            step_number: stepNumber,
            user_answer: userAnswer,
            time_spent: timeSpent
        });
    }

    /**
     * Get user progress
     */
    async getProgress(userId, problemId) {
        return this.get(`progress/${userId}/${problemId}`);
    }

    /**
     * Create or get user
     */
    async createUser(moodleUserId, username, email) {
        return this.post('progress/user', {
            moodle_user_id: moodleUserId,
            username: username,
            email: email
        });
    }

    // ===== Moodle APIs =====

    /**
     * Sync question from Moodle
     */
    async syncMoodleQuestion(questionId) {
        return this.post('moodle/sync', {
            question_id: questionId
        });
    }

    /**
     * Update grade in Moodle
     */
    async updateMoodleGrade(userId, itemId, grade) {
        return this.post('moodle/grade', {
            user_id: userId,
            item_id: itemId,
            grade: grade
        });
    }

    /**
     * Get user from Moodle
     */
    async getMoodleUser(userId) {
        return this.get(`moodle/user/${userId}`);
    }
}

// Create global API instance
const api = new API(CONFIG.API_BASE_URL);
