/**
 * MoodleIntegration - Moodle LMS와의 연동을 처리하는 클래스
 */

class MoodleIntegration {
    constructor(apiUrl = './api/moodle_connector.php') {
        this.apiUrl = apiUrl;
        this.isConnected = false;
        this.sessionToken = null;
        this.currentProblem = null;
        this.moodleUrl = null;
        this.wsToken = null;
    }

    /**
     * Moodle 연결 설정
     * @param {string} moodleUrl - Moodle 서버 URL
     * @param {string} wsToken - Moodle Web Service Token
     * @returns {Promise<Object>} 연결 결과
     */
    async connect(moodleUrl, wsToken) {
        try {
            this.moodleUrl = moodleUrl;
            this.wsToken = wsToken;

            const response = await this.apiRequest('connect', {
                moodle_url: moodleUrl,
                ws_token: wsToken
            });

            if (response.success) {
                this.isConnected = true;
                this.sessionToken = response.session_token;
                this.logMessage('Moodle 연결 성공', 'success');
                return { success: true, message: '연결 성공' };
            } else {
                throw new Error(response.error || 'Connection failed');
            }
        } catch (error) {
            this.logMessage(`연결 실패: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * 문제 정보 가져오기
     * @param {string} problemId - 문제 ID
     * @returns {Promise<Object>} 문제 정보
     */
    async getProblem(problemId) {
        if (!this.isConnected) {
            return { success: false, error: 'Moodle에 연결되지 않았습니다.' };
        }

        try {
            const response = await this.apiRequest('get_problem', {
                problem_id: problemId,
                session_token: this.sessionToken
            });

            if (response.success) {
                this.currentProblem = response.problem;
                this.logMessage(`문제 로드: ${problemId}`, 'info');
                return { success: true, problem: response.problem };
            } else {
                throw new Error(response.error || 'Failed to get problem');
            }
        } catch (error) {
            this.logMessage(`문제 로드 실패: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * 학생 답안 제출
     * @param {string} problemId - 문제 ID
     * @param {number} answer - 학생 답안
     * @param {Array} steps - 계산 단계
     * @returns {Promise<Object>} 제출 결과
     */
    async submitAnswer(problemId, answer, steps) {
        if (!this.isConnected) {
            return { success: false, error: 'Moodle에 연결되지 않았습니다.' };
        }

        try {
            const response = await this.apiRequest('submit_answer', {
                problem_id: problemId,
                answer: answer,
                steps: JSON.stringify(steps),
                session_token: this.sessionToken
            });

            if (response.success) {
                this.logMessage(`답안 제출 성공: ${answer}`, 'success');
                return {
                    success: true,
                    correct: response.correct,
                    feedback: response.feedback,
                    grade: response.grade
                };
            } else {
                throw new Error(response.error || 'Failed to submit answer');
            }
        } catch (error) {
            this.logMessage(`답안 제출 실패: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * 학습 진행상황 저장
     * @param {string} problemId - 문제 ID
     * @param {Object} progressData - 진행상황 데이터
     * @returns {Promise<Object>} 저장 결과
     */
    async saveProgress(problemId, progressData) {
        if (!this.isConnected) {
            return { success: false, error: 'Moodle에 연결되지 않았습니다.' };
        }

        try {
            const response = await this.apiRequest('save_progress', {
                problem_id: problemId,
                progress_data: JSON.stringify(progressData),
                session_token: this.sessionToken
            });

            if (response.success) {
                this.logMessage('진행상황 저장 완료', 'info');
                return { success: true };
            } else {
                throw new Error(response.error || 'Failed to save progress');
            }
        } catch (error) {
            this.logMessage(`진행상황 저장 실패: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * 로그 계산 문제 목록 가져오기
     * @returns {Promise<Object>} 문제 목록
     */
    async getLogProblems() {
        if (!this.isConnected) {
            return { success: false, error: 'Moodle에 연결되지 않았습니다.' };
        }

        try {
            const response = await this.apiRequest('get_log_problems', {
                session_token: this.sessionToken
            });

            if (response.success) {
                this.logMessage(`${response.problems.length}개의 문제 발견`, 'info');
                return { success: true, problems: response.problems };
            } else {
                throw new Error(response.error || 'Failed to get problems');
            }
        } catch (error) {
            this.logMessage(`문제 목록 로드 실패: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    /**
     * API 요청 헬퍼 함수
     * @param {string} action - API 액션
     * @param {Object} data - 요청 데이터
     * @returns {Promise<Object>} 응답 데이터
     */
    async apiRequest(action, data = {}) {
        const formData = new FormData();
        formData.append('action', action);

        for (let key in data) {
            formData.append(key, data[key]);
        }

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    /**
     * 로그 메시지 출력
     * @param {string} message - 로그 메시지
     * @param {string} type - 메시지 타입 (info, success, error, warning)
     */
    logMessage(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('ko-KR');
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);

        // 커스텀 이벤트 발생
        const event = new CustomEvent('moodle-log', {
            detail: { message, type, timestamp }
        });
        document.dispatchEvent(event);
    }

    /**
     * 연결 상태 확인
     * @returns {boolean} 연결 상태
     */
    isConnectedToMoodle() {
        return this.isConnected;
    }

    /**
     * 연결 해제
     */
    disconnect() {
        this.isConnected = false;
        this.sessionToken = null;
        this.currentProblem = null;
        this.logMessage('Moodle 연결 해제', 'info');
    }

    /**
     * 데모 모드 (Moodle 없이 테스트용)
     * @returns {Object} 데모 데이터
     */
    getDemoData() {
        return {
            problem: {
                id: 'demo_log_001',
                title: '로그 계산 연습',
                description: 'log₂(8)의 값을 구하세요',
                base: 2,
                value: 8,
                correctAnswer: 3,
                difficulty: 'easy',
                category: 'logarithm'
            },
            problems: [
                { id: 'log_101', title: 'log₂(8)', base: 2, value: 8 },
                { id: 'log_102', title: 'log₃(27)', base: 3, value: 27 },
                { id: 'log_103', title: 'log₅(125)', base: 5, value: 125 },
                { id: 'log_104', title: 'log₁₀(100)', base: 10, value: 100 },
                { id: 'log_105', title: 'log₂(16)', base: 2, value: 16 }
            ]
        };
    }

    /**
     * 데모 모드 활성화
     */
    enableDemoMode() {
        this.isConnected = true;
        this.sessionToken = 'demo-token-12345';
        const demoData = this.getDemoData();
        this.currentProblem = demoData.problem;
        this.logMessage('데모 모드 활성화 (Moodle 연결 없음)', 'warning');
        return demoData;
    }

    /**
     * URL 파라미터에서 Moodle 정보 추출
     * @returns {Object|null} URL 파라미터 정보
     */
    extractUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const moodleUrl = urlParams.get('moodle_url');
        const wsToken = urlParams.get('ws_token');
        const problemId = urlParams.get('problem_id');

        if (moodleUrl && wsToken) {
            return { moodleUrl, wsToken, problemId };
        }

        return null;
    }

    /**
     * 자동 연결 시도 (URL 파라미터 기반)
     * @returns {Promise<Object>} 연결 결과
     */
    async autoConnect() {
        const params = this.extractUrlParameters();

        if (params) {
            this.logMessage('URL 파라미터에서 Moodle 정보 감지', 'info');
            const result = await this.connect(params.moodleUrl, params.wsToken);

            if (result.success && params.problemId) {
                await this.getProblem(params.problemId);
            }

            return result;
        } else {
            this.logMessage('Moodle 연결 정보 없음, 데모 모드 사용 가능', 'warning');
            return { success: false, error: 'No Moodle connection parameters found' };
        }
    }
}

// 전역에서 사용 가능하도록 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MoodleIntegration;
}
