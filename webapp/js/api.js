// API Communication Module for Dot Collector

class DotCollectorAPI {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.token = this.getTokenFromURL();
    }

    getBaseURL() {
        // Get Moodle base URL from current location
        const urlParams = new URLSearchParams(window.location.search);
        const currentHost = window.location.hostname;

        // Check if we're in development or production
        if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            return 'http://localhost/moodle/mod/dotcollector/api.php';
        }

        // Production: construct URL from current path
        const pathParts = window.location.pathname.split('/');
        const moodleIndex = pathParts.indexOf('mod');
        if (moodleIndex > 0) {
            const basePath = pathParts.slice(0, moodleIndex).join('/');
            return `${window.location.origin}${basePath}/mod/dotcollector/api.php`;
        }

        // Fallback
        return '/mod/dotcollector/api.php';
    }

    getTokenFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('token') || '';
    }

    async request(action, data = {}) {
        try {
            const url = `${this.baseURL}?action=${action}&token=${this.token}`;
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            };

            const response = await fetch(url, options);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'API request failed');
            }

            return result.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // API Methods
    async ping() {
        return await this.request('ping');
    }

    async getQuestions() {
        return await this.request('get_questions');
    }

    async getQuestion(questionId) {
        return await this.request('get_question', { question_id: questionId });
    }

    async submitAnswer(questionId, answer, timeSpent) {
        return await this.request('submit_answer', {
            question_id: questionId,
            answer: answer,
            time_spent: timeSpent
        });
    }

    async saveDots(questionId, attemptId, accumulatedArea, dotCount, dotPositions, visualizationData) {
        return await this.request('save_dots', {
            question_id: questionId,
            attempt_id: attemptId,
            accumulated_area: accumulatedArea,
            dot_count: dotCount,
            dot_positions: dotPositions,
            visualization_data: visualizationData
        });
    }

    async getProgress() {
        return await this.request('get_progress');
    }
}

// Export API instance
const api = new DotCollectorAPI();
