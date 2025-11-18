/**
 * API 통신 모듈
 */

const API = {
    baseUrl: '/src/backend/api/api.php',

    /**
     * HTTP 요청 헬퍼
     */
    async request(endpoint, method = 'GET', data = null) {
        const url = `${this.baseUrl}/${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            showLoading(true);
            const response = await fetch(url, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'API request failed');
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            showToast(error.message, 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    },

    /**
     * 개념 API
     */
    concepts: {
        getAll(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            return API.request(`concepts${params ? '?' + params : ''}`);
        },

        getById(id) {
            return API.request(`concepts/${id}`);
        },

        getProblems(id, includeRelated = false) {
            return API.request(`concepts/${id}/problems?include_related=${includeRelated}`);
        }
    },

    /**
     * 문제 API
     */
    problems: {
        getAll(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            return API.request(`problems${params ? '?' + params : ''}`);
        },

        getConcepts(id) {
            return API.request(`problems/${id}/concepts`);
        }
    },

    /**
     * 그래프 데이터 API
     */
    graph: {
        getData(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            return API.request(`graph${params ? '?' + params : ''}`);
        }
    },

    /**
     * 학생 진도 API
     */
    progress: {
        get(studentId, conceptId = null) {
            const params = conceptId ? `?concept_id=${conceptId}` : '';
            return API.request(`progress/${studentId}${params}`);
        }
    },

    /**
     * Moodle 동기화 API
     */
    sync: {
        concepts() {
            return API.request('sync/concepts', 'POST');
        },

        problems() {
            return API.request('sync/problems', 'POST');
        },

        progress(studentId) {
            return API.request('sync/progress', 'POST', { student_id: studentId });
        },

        all() {
            return API.request('sync/all', 'POST');
        }
    },

    /**
     * 추천 API
     */
    recommendations: {
        get(studentId, limit = 10) {
            return API.request(`recommendations/${studentId}?limit=${limit}`);
        }
    }
};

/**
 * UI 헬퍼 함수
 */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast ${type} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}
