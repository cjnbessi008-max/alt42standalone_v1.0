/**
 * Moodle API Client
 * 백엔드 API와 통신
 */

export class MoodleAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    /**
     * HTTP 요청
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const fetchOptions = {
            ...defaultOptions,
            ...options
        };

        try {
            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('API 요청 실패:', error);
            throw error;
        }
    }

    /**
     * GET 요청
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;

        return this.request(url, {
            method: 'GET'
        });
    }

    /**
     * POST 요청
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT 요청
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // ====================================
    // API 메서드
    // ====================================

    /**
     * 문제 목록 가져오기
     */
    async getProblems(params = {}) {
        return this.get('get-problems.php', params);
    }

    /**
     * 특정 문제 가져오기
     */
    async getProblem(problemId) {
        return this.get('get-problems.php', { id: problemId });
    }

    /**
     * Moodle 문제 ID로 가져오기
     */
    async getProblemByMoodleId(moodleId) {
        return this.get('get-problems.php', { moodle_id: moodleId });
    }

    /**
     * 세션 생성
     */
    async createSession(studentId, problemId) {
        return this.post('session-manager.php', {
            student_id: studentId,
            problem_id: problemId
        });
    }

    /**
     * 세션 정보 가져오기
     */
    async getSession(sessionId) {
        return this.get('session-manager.php', { id: sessionId });
    }

    /**
     * 세션 토큰으로 가져오기
     */
    async getSessionByToken(token) {
        return this.get('session-manager.php', { token: token });
    }

    /**
     * 세션 상태 업데이트
     */
    async updateSession(sessionId, status) {
        return this.put('session-manager.php', {
            session_id: sessionId,
            status: status
        });
    }

    /**
     * 답안 제출
     */
    async submitAnswer(sessionId, formula, timeTaken) {
        return this.post('submit-answer.php', {
            session_id: sessionId,
            formula: formula,
            time_taken: timeTaken
        });
    }

    /**
     * 학생 생성/업데이트 (개발용)
     */
    async createStudent(studentData) {
        // TODO: 학생 생성 API 구현
        console.log('학생 생성:', studentData);
        return { success: true };
    }

    /**
     * 학생 진도 가져오기
     */
    async getStudentProgress(studentId) {
        // TODO: 진도 API 구현
        console.log('학생 진도 조회:', studentId);
        return { success: true, data: {} };
    }

    /**
     * Moodle 연결 테스트
     */
    async testConnection() {
        try {
            // 간단한 문제 목록 요청으로 연결 테스트
            const response = await this.getProblems({ limit: 1 });
            return response.success;
        } catch (error) {
            console.error('연결 테스트 실패:', error);
            return false;
        }
    }

    /**
     * 에러 핸들링
     */
    handleError(error) {
        if (error.response) {
            // 서버가 응답했지만 오류 상태 코드
            console.error('서버 오류:', error.response.data);
            return error.response.data.error || '서버 오류가 발생했습니다.';
        } else if (error.request) {
            // 요청이 전송되었지만 응답을 받지 못함
            console.error('네트워크 오류:', error.request);
            return '네트워크 연결을 확인해주세요.';
        } else {
            // 요청 설정 중 오류 발생
            console.error('요청 오류:', error.message);
            return error.message;
        }
    }
}

export default MoodleAPI;
