/**
 * API Client
 * 백엔드 API와 통신
 */

class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL || CONFIG.API_BASE_URL;
    }

    /**
     * HTTP 요청 래퍼
     */
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const mergedOptions = { ...defaultOptions, ...options };

        try {
            logger.log('API Request:', url, mergedOptions);

            const response = await fetch(url, mergedOptions);
            const data = await response.json();

            logger.log('API Response:', data);

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            logger.error('API Error:', error);
            throw error;
        }
    }

    /**
     * 문제 정보 조회
     */
    async getProblem(problemId) {
        const url = `${this.baseURL}/problems.php/${problemId}`;
        return await this.request(url);
    }

    /**
     * 답안 제출
     */
    async submitAnswer(problemId, userId, answer, sessionData = {}) {
        const url = `${this.baseURL}/submit.php/problems/${problemId}/submit`;

        return await this.request(url, {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                answer: answer,
                time_spent: sessionData.timeSpent || 0,
                hint_used: sessionData.hintUsed || false,
                session_data: {
                    interactions: sessionData.interactions || 0,
                    replays: sessionData.replays || 0,
                    hints_viewed: sessionData.hintsViewed || [],
                    input_history: sessionData.inputHistory || []
                }
            })
        });
    }

    /**
     * 진도 조회
     */
    async getProgress(userId) {
        const url = `${this.baseURL}/progress.php/${userId}`;
        return await this.request(url);
    }

    /**
     * 적분 계산 (검증용)
     */
    async calculateIntegral(functionExpr, lowerBound, upperBound) {
        const url = `${this.baseURL}/calculate.php`;

        return await this.request(url, {
            method: 'POST',
            body: JSON.stringify({
                function: functionExpr,
                lower_bound: lowerBound,
                upper_bound: upperBound,
                method: 'simpson'
            })
        });
    }
}
