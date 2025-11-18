/**
 * API Client for Log Gear App
 * Handles communication with backend PHP API
 */

class LogGearAPI {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        this.sessionId = this.getOrCreateSessionId();
    }

    /**
     * Get or create session ID
     */
    getOrCreateSessionId() {
        let sessionId = localStorage.getItem('log_gear_session_id');

        if (!sessionId) {
            sessionId = this.generateSessionId();
            localStorage.setItem('log_gear_session_id', sessionId);
        }

        return sessionId;
    }

    /**
     * Generate random session ID
     */
    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
    }

    /**
     * Make HTTP request
     */
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Get all problems
     */
    async getProblems(difficulty = null) {
        const params = new URLSearchParams();
        if (difficulty) {
            params.append('difficulty', difficulty);
        }

        const url = `${this.baseUrl}/problems.php?${params.toString()}`;
        return this.request(url);
    }

    /**
     * Get specific problem by ID
     */
    async getProblem(id) {
        const url = `${this.baseUrl}/problems.php?id=${id}`;
        return this.request(url);
    }

    /**
     * Get random problem
     */
    async getRandomProblem(difficulty = null) {
        const params = new URLSearchParams({ random: '1' });
        if (difficulty) {
            params.append('difficulty', difficulty);
        }

        const url = `${this.baseUrl}/problems.php?${params.toString()}`;
        return this.request(url);
    }

    /**
     * Create new problem
     */
    async createProblem(problemData) {
        const url = `${this.baseUrl}/problems.php`;
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(problemData)
        });
    }

    /**
     * Create new session
     */
    async createSession(studentId = null, moodleUserId = null) {
        const url = `${this.baseUrl}/sessions.php`;
        const response = await this.request(url, {
            method: 'POST',
            body: JSON.stringify({
                student_id: studentId,
                moodle_user_id: moodleUserId
            })
        });

        if (response.success && response.data.session_id) {
            this.sessionId = response.data.session_id;
            localStorage.setItem('log_gear_session_id', this.sessionId);
        }

        return response;
    }

    /**
     * Submit problem attempt
     */
    async submitAttempt(problemId, studentAnswer, timeSpent, gearAnimationCompleted = false) {
        const url = `${this.baseUrl}/sessions.php`;
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify({
                session_id: this.sessionId,
                problem_id: problemId,
                student_answer: studentAnswer,
                time_spent: timeSpent,
                gear_animation_completed: gearAnimationCompleted
            })
        });
    }

    /**
     * Get session statistics
     */
    async getSessionStats() {
        const url = `${this.baseUrl}/sessions.php?session_id=${this.sessionId}`;
        return this.request(url);
    }

    /**
     * Sync questions from Moodle
     */
    async syncMoodleQuestions(quizId) {
        const url = `${this.baseUrl}/moodle.php?action=sync_questions&quiz_id=${quizId}`;
        return this.request(url);
    }

    /**
     * Validate Moodle user
     */
    async validateMoodleUser(token) {
        const url = `${this.baseUrl}/moodle.php?action=validate_user`;
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    }

    /**
     * Send grade to Moodle
     */
    async sendGradeToMoodle(userId, quizId, grade, courseId = null) {
        const url = `${this.baseUrl}/moodle.php?action=send_grade`;
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                quiz_id: quizId,
                grade: grade,
                course_id: courseId
            })
        });
    }
}

// Create global API instance
const api = new LogGearAPI();
