/**
 * Prime Fireworks - API Client
 * 백엔드 API 통신 모듈
 */

const API = {
    baseURL: '/prime-fireworks/backend/api',

    /**
     * API 요청 헬퍼
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': this.getUserId()
            }
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();

            if (data.status === 'error') {
                throw new Error(data.data.message || 'API Error');
            }

            return data.data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },

    /**
     * GET 요청
     */
    async get(endpoint, params = {}) {
        const query = new URLSearchParams(params).toString();
        const url = query ? `${endpoint}?${query}` : endpoint;

        return this.request(url, {
            method: 'GET'
        });
    },

    /**
     * POST 요청
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * 사용자 ID 가져오기
     */
    getUserId() {
        // 세션에서 가져오거나 테스트용 ID 반환
        const userId = sessionStorage.getItem('user_id');
        if (userId) return userId;

        // 개발 환경: 임의의 사용자 ID
        const testUserId = 123;
        sessionStorage.setItem('user_id', testUserId);
        return testUserId;
    },

    /**
     * 사용자 ID 설정
     */
    setUserId(userId) {
        sessionStorage.setItem('user_id', userId);
    },

    /**
     * 문제 조회
     */
    async getProblem(level = 'medium') {
        return this.get('problem.php', {
            user_id: this.getUserId(),
            level: level
        });
    },

    /**
     * 답안 제출
     */
    async submitAnswer(problemId, answer, timeSpent) {
        return this.post('submit.php', {
            user_id: this.getUserId(),
            problem_id: problemId,
            answer: answer,
            time_spent: timeSpent
        });
    },

    /**
     * 진도 조회
     */
    async getProgress() {
        return this.get('progress.php', {
            user_id: this.getUserId()
        });
    }
};

// 전역 객체로 노출
window.API = API;
