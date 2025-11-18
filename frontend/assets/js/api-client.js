/**
 * API Client for Deviation Breeze
 * Handles all backend API communications
 */

const API = {
    baseUrl: '/backend/public',

    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    /**
     * POST request
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Test Moodle connection
     */
    async testMoodle() {
        return this.get('/api/v1/test/moodle');
    },

    /**
     * Get all courses
     */
    async getCourses() {
        return this.get('/api/v1/courses');
    },

    /**
     * Get course by ID
     */
    async getCourse(id) {
        return this.get(`/api/v1/courses/${id}`);
    },

    /**
     * Get all quizzes
     */
    async getQuizzes() {
        return this.get('/api/v1/quizzes');
    },

    /**
     * Get quiz by ID
     */
    async getQuiz(id) {
        return this.get(`/api/v1/quizzes/${id}`);
    },

    /**
     * Get quiz attempts
     */
    async getQuizAttempts(quizId) {
        return this.get(`/api/v1/quizzes/${quizId}/attempts`);
    },

    /**
     * Get all students
     */
    async getStudents() {
        return this.get('/api/v1/students');
    },

    /**
     * Get student by ID
     */
    async getStudent(id) {
        return this.get(`/api/v1/students/${id}`);
    },

    /**
     * Get deviation analytics for a quiz
     */
    async getQuizDeviation(quizId) {
        return this.get(`/api/v1/deviation/quiz/${quizId}`);
    },

    /**
     * Get deviation visualization data
     */
    async getDeviationVisualization(quizId) {
        return this.get(`/api/v1/deviation/quiz/${quizId}/visualization`);
    },

    /**
     * Get student deviation history
     */
    async getStudentDeviation(studentId) {
        return this.get(`/api/v1/deviation/student/${studentId}`);
    },

    /**
     * Calculate deviation for a quiz
     */
    async calculateDeviation(quizId) {
        return this.post('/api/v1/deviation/calculate', { quiz_id: quizId });
    },

    /**
     * Sync course from Moodle
     */
    async syncCourse(courseId) {
        return this.post('/api/v1/sync/course', { course_id: courseId });
    }
};

// Export for use in other scripts
window.API = API;
