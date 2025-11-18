/**
 * Moodle LMS Integration - LMS와의 연동
 */

class MoodleIntegration {
    constructor() {
        this.apiEndpoint = 'src/php/api.php';
        this.sessionId = null;
        this.currentProblem = null;
        this.isConnected = false;
    }

    /**
     * LMS 연결 초기화
     */
    async initialize() {
        try {
            const response = await this.apiCall('init', {});

            if (response.success) {
                this.sessionId = response.sessionId;
                this.isConnected = true;
                console.log('LMS 연결 성공:', response);
                return true;
            } else {
                console.error('LMS 연결 실패:', response.error);
                return false;
            }
        } catch (error) {
            console.error('LMS 초기화 오류:', error);
            return false;
        }
    }

    /**
     * API 호출 헬퍼
     */
    async apiCall(action, data = {}) {
        const formData = new FormData();
        formData.append('action', action);
        formData.append('sessionId', this.sessionId);

        // 데이터 추가
        for (const key in data) {
            formData.append(key, JSON.stringify(data[key]));
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API 호출 오류:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 문제 정보 가져오기
     */
    async fetchProblem(problemId = null) {
        const response = await this.apiCall('getProblem', { problemId });

        if (response.success) {
            this.currentProblem = response.problem;
            return response.problem;
        } else {
            console.error('문제 가져오기 실패:', response.error);
            return null;
        }
    }

    /**
     * 문제 목록 가져오기
     */
    async fetchProblemList() {
        const response = await this.apiCall('getProblemList', {});

        if (response.success) {
            return response.problems;
        } else {
            console.error('문제 목록 가져오기 실패:', response.error);
            return [];
        }
    }

    /**
     * 답안 제출
     */
    async submitAnswer(problemId, roots) {
        const answerData = {
            problemId: problemId,
            roots: roots,
            timestamp: new Date().toISOString()
        };

        const response = await this.apiCall('submitAnswer', answerData);

        if (response.success) {
            console.log('답안 제출 성공:', response);
            return {
                success: true,
                score: response.score,
                feedback: response.feedback
            };
        } else {
            console.error('답안 제출 실패:', response.error);
            return {
                success: false,
                error: response.error
            };
        }
    }

    /**
     * 학습 진행 상황 저장
     */
    async saveProgress(data) {
        const response = await this.apiCall('saveProgress', data);

        if (response.success) {
            console.log('진행 상황 저장 성공');
            return true;
        } else {
            console.error('진행 상황 저장 실패:', response.error);
            return false;
        }
    }

    /**
     * 사용자 정보 가져오기
     */
    async getUserInfo() {
        const response = await this.apiCall('getUserInfo', {});

        if (response.success) {
            return response.user;
        } else {
            console.error('사용자 정보 가져오기 실패:', response.error);
            return null;
        }
    }

    /**
     * 모의 데이터 (LMS 없이 테스트용)
     */
    getMockProblem() {
        const problems = [
            {
                id: 'PROB001',
                title: '이차함수의 근 찾기',
                function: 'x^2 - 4',
                description: '이차함수 f(x) = x² - 4의 근을 모두 찾으세요.',
                difficulty: '쉬움',
                expectedRoots: [-2, 2]
            },
            {
                id: 'PROB002',
                title: '삼차함수의 근 찾기',
                function: 'x^3 - 6*x^2 + 11*x - 6',
                description: '삼차함수의 근을 모두 찾으세요.',
                difficulty: '보통',
                expectedRoots: [1, 2, 3]
            },
            {
                id: 'PROB003',
                title: '삼각함수의 근',
                function: 'sin(x)',
                description: '구간 [-10, 10]에서 sin(x)의 근을 찾으세요.',
                difficulty: '보통',
                expectedRoots: [-Math.PI * 3, -Math.PI * 2, -Math.PI, 0, Math.PI, Math.PI * 2, Math.PI * 3]
            },
            {
                id: 'PROB004',
                title: '지수함수와 다항식',
                function: 'x^2 - 2*x - 3',
                description: '이차함수 f(x) = x² - 2x - 3의 근을 찾으세요.',
                difficulty: '쉬움',
                expectedRoots: [-1, 3]
            }
        ];

        // 랜덤 문제 선택
        const randomIndex = Math.floor(Math.random() * problems.length);
        return problems[randomIndex];
    }

    /**
     * 연결 상태 확인
     */
    isReady() {
        return this.isConnected;
    }

    /**
     * 현재 문제 가져오기
     */
    getCurrentProblem() {
        return this.currentProblem;
    }

    /**
     * 연결 해제
     */
    async disconnect() {
        const response = await this.apiCall('disconnect', {});
        this.isConnected = false;
        this.sessionId = null;
        return response.success;
    }
}

// 전역 객체로 노출
window.MoodleIntegration = MoodleIntegration;
