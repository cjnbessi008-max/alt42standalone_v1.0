/**
 * API Service
 * Handles all communication with backend
 */

class APIService {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
    }

    /**
     * Make API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            debug('API Request:', url, finalOptions);

            const response = await fetch(url, finalOptions);
            const data = await response.json();

            debug('API Response:', data);

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Get shape data
     */
    async getShape(shapeId) {
        return this.request(`shapes/${shapeId}`);
    }

    /**
     * Get all shapes
     */
    async getAllShapes(category = null) {
        const query = category ? `?category=${category}` : '';
        return this.request(`shapes/list${query}`);
    }

    /**
     * Get question from Moodle
     */
    async getQuestion(moodleQuestionId) {
        return this.request(`moodle/question/${moodleQuestionId}`);
    }

    /**
     * Get or create question
     */
    async getOrCreateQuestion(questionData) {
        return this.request('questions/create', {
            method: 'POST',
            body: JSON.stringify(questionData)
        });
    }

    /**
     * Start progress tracking
     */
    async startProgress(userId, questionId) {
        return this.request('progress/start', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                question_id: questionId
            })
        });
    }

    /**
     * Update progress
     */
    async updateProgress(progressId, data) {
        return this.request(`progress/update/${progressId}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Complete progress
     */
    async completeProgress(progressId, score, timeSpent) {
        return this.request(`progress/complete/${progressId}`, {
            method: 'POST',
            body: JSON.stringify({
                score: score,
                time_spent: timeSpent
            })
        });
    }

    /**
     * Track interaction
     */
    async trackInteraction(progressId) {
        return this.request(`progress/interaction/${progressId}`, {
            method: 'POST'
        });
    }

    /**
     * Submit grade to Moodle
     */
    async submitGrade(userId, itemId, grade) {
        return this.request('moodle/grade', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                item_id: itemId,
                grade: grade
            })
        });
    }

    /**
     * Health check
     */
    async healthCheck() {
        return this.request('health');
    }
}

// Create global API instance
const API = new APIService();
