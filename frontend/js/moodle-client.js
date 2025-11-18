/**
 * Moodle API Client
 * Frontend interface for Moodle LMS integration
 */

class MoodleClient {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl || '/backend/api';
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30 seconds
    }

    /**
     * Fetch graph data from backend
     */
    async getGraphData(quizId, userId = null) {
        const cacheKey = `graph_${quizId}_${userId || 'all'}`;

        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const params = new URLSearchParams({ quiz_id: quizId });
            if (userId) {
                params.append('user_id', userId);
            }

            const response = await fetch(`${this.apiBaseUrl}/graph_data.php?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }

            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            console.error('Error fetching graph data:', error);
            throw error;
        }
    }

    /**
     * Get available quizzes
     */
    async getQuizList() {
        // Mock implementation - replace with actual API call
        return [
            { id: 1, name: '수학 기초 퀴즈' },
            { id: 2, name: '분수 연습 문제' },
            { id: 3, name: '기하학 테스트' }
        ];
    }

    /**
     * Get available users/students
     */
    async getUserList() {
        // Mock implementation - replace with actual API call
        return [
            { id: null, name: '전체 통계' },
            { id: 1, name: '김철수' },
            { id: 2, name: '이영희' },
            { id: 3, name: '박민수' }
        ];
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Generate mock data for testing
     */
    generateMockData(pointCount = 10) {
        const data = [];
        const now = Date.now() / 1000;

        for (let i = 0; i < pointCount; i++) {
            data.push({
                timestamp: now - (pointCount - i) * 3600,
                score: 50 + Math.random() * 50
            });
        }

        return {
            success: true,
            timestamp: now,
            quiz_id: 1,
            statistics: {
                total_attempts: pointCount,
                average_score: data.reduce((sum, d) => sum + d.score, 0) / pointCount,
                completion_rate: 75 + Math.random() * 20
            },
            time_series: data,
            user_progress: null,
            animation_config: {
                breath_duration: 3000,
                pulse_intensity: 0.15,
                update_interval: 5000
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodleClient;
}
