/**
 * Rule Door - API Client
 */

class RuleDoorAPI {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    /**
     * Make API request
     */
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseURL}/${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            Logger.log(`API ${method} ${endpoint}`, data);
            const response = await fetch(url, options);
            const result = await response.json();

            if (!result.success) {
                Logger.error(`API Error: ${result.message}`, result);
                throw new Error(result.message);
            }

            Logger.log(`API Response:`, result.data);
            return result.data;
        } catch (error) {
            Logger.error(`API Request Failed: ${error.message}`, error);
            throw error;
        }
    }

    // Rule endpoints
    async getRules() {
        return await this.request('rules');
    }

    async getRule(ruleId) {
        return await this.request(`rules/${ruleId}`);
    }

    async getRuleByQuizId(quizId) {
        return await this.request(`rules/quiz/${quizId}`);
    }

    async createRule(ruleData) {
        return await this.request('rules', 'POST', ruleData);
    }

    async updateRule(ruleId, ruleData) {
        return await this.request(`rules/${ruleId}`, 'PUT', ruleData);
    }

    async deleteRule(ruleId) {
        return await this.request(`rules/${ruleId}`, 'DELETE');
    }

    async getRuleStatistics(ruleId) {
        return await this.request(`rules/${ruleId}/statistics`);
    }

    // Door state endpoints
    async getDoorState(ruleId, studentId) {
        return await this.request(`door-state/${ruleId}/${studentId}`);
    }

    async evaluateDoorState(ruleId, studentId, answerData) {
        return await this.request('door-state/evaluate', 'POST', {
            rule_id: ruleId,
            student_id: studentId,
            answer_data: answerData
        });
    }

    async updateDoorState(ruleId, studentId, doorStatus, reason = '', metadata = {}) {
        return await this.request('door-state/update', 'POST', {
            rule_id: ruleId,
            student_id: studentId,
            door_status: doorStatus,
            reason: reason,
            metadata: metadata
        });
    }

    async getStudentDoorStates(studentId) {
        return await this.request(`door-state/student/${studentId}`);
    }

    async getDoorStateStatistics(ruleId) {
        return await this.request(`door-state/${ruleId}/statistics`);
    }

    // Attempt endpoints
    async recordAttempt(attemptData) {
        return await this.request('attempts', 'POST', attemptData);
    }

    async getStudentAttempts(studentId, questionId) {
        return await this.request(`attempts/student/${studentId}/question/${questionId}`);
    }

    async checkDuplicate(studentId, questionId, answerData) {
        const params = new URLSearchParams({
            student_id: studentId,
            question_id: questionId,
            answer_data: JSON.stringify(answerData)
        });
        return await this.request(`attempts/check-duplicate?${params}`);
    }

    async getAttemptStatistics(ruleId, studentId = null) {
        const endpoint = studentId
            ? `attempts/statistics/${ruleId}?student_id=${studentId}`
            : `attempts/statistics/${ruleId}`;
        return await this.request(endpoint);
    }

    async getRecentAttempts(limit = 10) {
        return await this.request(`attempts/recent?limit=${limit}`);
    }

    // Moodle integration endpoints
    async getQuizInfo(quizId) {
        return await this.request(`moodle/quiz/${quizId}`);
    }

    async getQuizQuestions(quizId) {
        return await this.request(`moodle/quiz/${quizId}/questions`);
    }

    async getStudentQuizAttempts(quizId, studentId) {
        return await this.request(`moodle/quiz/${quizId}/student/${studentId}/attempts`);
    }

    async getStudentInfo(studentId) {
        return await this.request(`moodle/student/${studentId}`);
    }

    async getCourseInfo(courseId) {
        return await this.request(`moodle/course/${courseId}`);
    }

    async getCourseStudents(courseId) {
        return await this.request(`moodle/course/${courseId}/students`);
    }

    async getQuizSettings(quizId) {
        return await this.request(`moodle/quiz/${quizId}/settings`);
    }

    async verifyMoodleSession(sessionKey) {
        return await this.request('moodle/verify-session', 'POST', {
            session_key: sessionKey
        });
    }

    async hasActiveAttempt(quizId, studentId) {
        return await this.request(`moodle/quiz/${quizId}/student/${studentId}/active-attempt`);
    }

    // Statistics endpoints
    async getOverviewStatistics() {
        return await this.request('statistics/overview');
    }

    async getRuleDetailedStatistics(ruleId) {
        return await this.request(`statistics/rule/${ruleId}`);
    }

    async getStudentStatistics(studentId) {
        return await this.request(`statistics/student/${studentId}`);
    }

    async getTrends(days = 7) {
        return await this.request(`statistics/trends?days=${days}`);
    }
}

// Initialize API client
const api = new RuleDoorAPI(CONFIG.API_BASE_URL);
Logger.log('API client initialized');
