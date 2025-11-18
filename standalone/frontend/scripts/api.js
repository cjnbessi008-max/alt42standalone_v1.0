/**
 * API 통신 모듈
 */

const API_BASE = '../backend/api';

class API {
    static async request(endpoint, options = {}) {
        const url = `${API_BASE}/${endpoint}`;

        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'same-origin'
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!data.success && response.status === 401) {
                // 인증 실패 - 로그인 페이지로
                window.location.reload();
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            return {
                success: false,
                message: '서버와의 통신 중 오류가 발생했습니다.'
            };
        }
    }

    // 인증 API
    static async login(username, password) {
        return this.request('auth_api.php?action=login', {
            method: 'POST',
            body: { username, password }
        });
    }

    static async register(username, email, password, full_name, grade_level) {
        return this.request('auth_api.php?action=register', {
            method: 'POST',
            body: { username, email, password, full_name, grade_level }
        });
    }

    static async logout() {
        return this.request('auth_api.php?action=logout');
    }

    static async getCurrentUser() {
        return this.request('auth_api.php?action=me');
    }

    // 추천 API
    static async getRecommendations(count = 1) {
        return this.request(`recommend_api.php?action=get&count=${count}`);
    }

    static async getWeaknessRecommendations(count = 1) {
        return this.request(`recommend_api.php?action=weakness&count=${count}`);
    }

    static async getLearningPath(goal, sessions = 10) {
        return this.request(`recommend_api.php?action=path&goal=${goal}&sessions=${sessions}`);
    }

    // 문제 API
    static async submitAnswer(problem_id, answer, time_spent, hint_used = false) {
        return this.request('problem_api.php?action=submit', {
            method: 'POST',
            body: { problem_id, answer, time_spent, hint_used }
        });
    }

    static async getStats() {
        return this.request('problem_api.php?action=stats');
    }

    static async getHistory(page = 1, limit = 20) {
        return this.request(`problem_api.php?action=history&page=${page}&limit=${limit}`);
    }
}
