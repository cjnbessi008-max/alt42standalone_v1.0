// Moodle 3.7 API Integration Service
// Compatible with PHP 7.1.9
const axios = require('axios');
require('dotenv').config();

const MOODLE_URL = process.env.MOODLE_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

class MoodleService {
    constructor() {
        this.baseURL = `${MOODLE_URL}/webservice/rest/server.php`;
        this.token = MOODLE_TOKEN;
        this.format = 'json';
    }

    /**
     * Generic Moodle API call
     * @param {string} wsfunction - Moodle web service function name
     * @param {object} params - Additional parameters
     * @returns {Promise} API response
     */
    async callMoodleAPI(wsfunction, params = {}) {
        try {
            const response = await axios.get(this.baseURL, {
                params: {
                    wstoken: this.token,
                    wsfunction: wsfunction,
                    moodlewsrestformat: this.format,
                    ...params
                },
                timeout: 10000
            });

            if (response.data.exception) {
                throw new Error(response.data.message || 'Moodle API error');
            }

            return response.data;
        } catch (error) {
            console.error('Moodle API call failed:', error.message);
            throw error;
        }
    }

    /**
     * Get quiz information by ID
     * @param {number} quizId - Moodle quiz ID
     * @returns {Promise} Quiz data
     */
    async getQuizById(quizId) {
        return await this.callMoodleAPI('mod_quiz_get_quizzes_by_courses', {
            courseids: []  // Empty array returns all accessible quizzes
        });
    }

    /**
     * Get question details
     * @param {number} questionId - Question ID
     * @returns {Promise} Question data
     */
    async getQuestion(questionId) {
        // Note: Moodle 3.7 might need custom web service for question details
        // This is a placeholder implementation
        return await this.callMoodleAPI('core_question_get_question', {
            questionid: questionId
        });
    }

    /**
     * Get course contents
     * @param {number} courseId - Course ID
     * @returns {Promise} Course contents
     */
    async getCourseContents(courseId) {
        return await this.callMoodleAPI('core_course_get_contents', {
            courseid: courseId
        });
    }

    /**
     * Get user's enrolled courses
     * @param {number} userId - User ID
     * @returns {Promise} List of courses
     */
    async getUserCourses(userId) {
        return await this.callMoodleAPI('core_enrol_get_users_courses', {
            userid: userId
        });
    }

    /**
     * Get quiz attempts
     * @param {number} quizId - Quiz ID
     * @param {number} userId - User ID
     * @returns {Promise} Quiz attempts
     */
    async getQuizAttempts(quizId, userId) {
        return await this.callMoodleAPI('mod_quiz_get_user_attempts', {
            quizid: quizId,
            userid: userId
        });
    }

    /**
     * Mock function to extract numbers from problem text
     * In production, this would use NLP or regex
     * @param {string} problemText - The problem statement
     * @returns {array} Array of numbers found in the text
     */
    extractNumbersFromProblem(problemText) {
        // Simple regex to find all numbers
        const numbers = problemText.match(/\d+/g);
        return numbers ? numbers.map(Number) : [];
    }

    /**
     * Test Moodle connection
     * @returns {Promise<boolean>} True if connection successful
     */
    async testConnection() {
        try {
            const result = await this.callMoodleAPI('core_webservice_get_site_info');
            console.log('✓ Moodle connection successful:', result.sitename);
            return true;
        } catch (error) {
            console.error('✗ Moodle connection failed:', error.message);
            return false;
        }
    }
}

module.exports = new MoodleService();
