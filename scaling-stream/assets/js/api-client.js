/**
 * API Client for Moodle Integration
 * Handles all communication with the backend
 */

class APIClient {
    constructor(baseUrl = 'api/endpoints.php') {
        this.baseUrl = baseUrl;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Make API request
     */
    async request(action, params = {}) {
        try {
            const queryParams = new URLSearchParams({
                action,
                ...params
            });

            const cacheKey = `${action}_${queryParams.toString()}`;

            // Check cache
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheExpiry) {
                    console.log(`[Cache Hit] ${action}`);
                    return cached.data;
                }
            }

            const url = `${this.baseUrl}?${queryParams}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Cache successful responses
            if (data.success) {
                this.cache.set(cacheKey, {
                    data,
                    timestamp: Date.now()
                });
            }

            return data;
        } catch (error) {
            console.error(`API Request Error (${action}):`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get questions from Moodle
     */
    async getQuestions(limit = 20, categoryId = null) {
        const params = { limit };
        if (categoryId) {
            params.category_id = categoryId;
        }
        return await this.request('get_questions', params);
    }

    /**
     * Get question details
     */
    async getQuestionDetails(questionId) {
        return await this.request('get_question_details', { id: questionId });
    }

    /**
     * Get courses
     */
    async getCourses(limit = 20) {
        return await this.request('get_courses', { limit });
    }

    /**
     * Get quiz attempts
     */
    async getQuizAttempts(quizId, limit = 50) {
        return await this.request('get_quiz_attempts', {
            quiz_id: quizId,
            limit
        });
    }

    /**
     * Calculate similarity between questions
     */
    async calculateSimilarity(question1, question2) {
        return await this.request('calculate_similarity', {
            question1,
            question2
        });
    }

    /**
     * Get random question
     */
    async getRandomQuestion() {
        // Don't cache random questions
        const action = 'get_random_question';
        const url = `${this.baseUrl}?action=${action}&_t=${Date.now()}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Get Random Question Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        return await this.request('health_check');
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[Cache] Cleared');
    }
}

// Create global API client instance
const api = new APIClient();
