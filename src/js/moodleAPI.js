/**
 * Moodle API Integration
 * PHP 백엔드와 통신하는 API 클라이언트
 */

class MoodleAPI {
    constructor(baseUrl = 'php/api.php') {
        this.baseUrl = baseUrl;
    }

    /**
     * API 호출 헬퍼 함수
     */
    async callAPI(action, params = {}, method = 'GET') {
        try {
            let url = `${this.baseUrl}?action=${action}`;
            let options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (method === 'GET') {
                // GET 요청: 파라미터를 URL에 추가
                Object.keys(params).forEach(key => {
                    url += `&${key}=${encodeURIComponent(params[key])}`;
                });
            } else {
                // POST/PUT 요청: 파라미터를 body에 추가
                options.body = JSON.stringify(params);
            }

            const response = await fetch(url, options);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'API call failed');
            }

            return data.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * 모든 문제 목록 가져오기
     */
    async getProblems() {
        return await this.callAPI('get_problems');
    }

    /**
     * 특정 문제 정보 가져오기
     */
    async getProblem(problemId) {
        return await this.callAPI('get_problem', { id: problemId });
    }

    /**
     * 문제의 단계 정보 가져오기
     */
    async getSteps(problemId) {
        return await this.callAPI('get_steps', { problem_id: problemId });
    }

    /**
     * 새 세션 생성
     */
    async createSession(problemId, userId = null) {
        return await this.callAPI('create_session', {
            problem_id: problemId,
            user_id: userId
        }, 'POST');
    }

    /**
     * 세션 업데이트
     */
    async updateSession(sessionId, updates) {
        return await this.callAPI('update_session', {
            session_id: sessionId,
            ...updates
        }, 'POST');
    }

    /**
     * 세션 정보 가져오기
     */
    async getSession(sessionId) {
        return await this.callAPI('get_session', { session_id: sessionId });
    }

    /**
     * 애니메이션 설정 가져오기
     */
    async getAnimationConfig(problemId) {
        return await this.callAPI('get_animation_config', { problem_id: problemId });
    }
}

// 전역 API 인스턴스 생성
const api = new MoodleAPI();
