/**
 * Moodle LMS 연동 모듈
 * Moodle 3.7 Web Services API를 사용하여 문제 데이터를 가져옵니다
 */

class MoodleConnector {
    constructor(config) {
        this.config = config;
        this.isConnected = false;
        this.currentProblem = null;
    }

    /**
     * Moodle 연결 상태 확인
     */
    async checkConnection() {
        debugLog('Moodle 연결 확인 중...');

        try {
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'check_connection',
                    wstoken: this.config.wsToken
                })
            });

            const data = await response.json();

            if (data.success) {
                this.isConnected = true;
                debugLog('Moodle 연결 성공');
                this.updateConnectionStatus(true);
                return true;
            } else {
                this.isConnected = false;
                debugLog('Moodle 연결 실패:', data.error);
                this.updateConnectionStatus(false);
                return false;
            }
        } catch (error) {
            errorLog('Moodle 연결 오류:', error);
            this.isConnected = false;
            this.updateConnectionStatus(false);
            return false;
        }
    }

    /**
     * Moodle에서 문제 데이터 가져오기
     */
    async loadProblem(problemId = null) {
        debugLog('문제 로딩 시도:', problemId);

        // Moodle 연결이 안 되어 있으면 샘플 데이터 사용
        if (!this.isConnected) {
            debugLog('Moodle 미연결 - 샘플 데이터 사용');
            return this.loadSampleProblem();
        }

        try {
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_problem',
                    wstoken: this.config.wsToken,
                    problemId: problemId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentProblem = data.problem;
                debugLog('문제 로딩 성공:', this.currentProblem);
                return this.currentProblem;
            } else {
                errorLog('문제 로딩 실패:', data.error);
                // 실패 시 샘플 데이터 사용
                return this.loadSampleProblem();
            }
        } catch (error) {
            errorLog('문제 로딩 오류:', error);
            // 오류 시 샘플 데이터 사용
            return this.loadSampleProblem();
        }
    }

    /**
     * 샘플 문제 데이터 로드 (테스트용)
     */
    loadSampleProblem() {
        const randomIndex = Math.floor(Math.random() * SAMPLE_PROBLEMS.length);
        this.currentProblem = SAMPLE_PROBLEMS[randomIndex];
        debugLog('샘플 문제 로딩:', this.currentProblem);
        return this.currentProblem;
    }

    /**
     * 학생 답안 제출
     */
    async submitAnswer(answer) {
        debugLog('답안 제출:', answer);

        if (!this.isConnected) {
            debugLog('Moodle 미연결 - 로컬에서 답안 검증');
            return this.validateAnswerLocally(answer);
        }

        try {
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'submit_answer',
                    wstoken: this.config.wsToken,
                    problemId: this.currentProblem.id,
                    answer: answer
                })
            });

            const data = await response.json();
            debugLog('답안 제출 결과:', data);
            return data;
        } catch (error) {
            errorLog('답안 제출 오류:', error);
            return this.validateAnswerLocally(answer);
        }
    }

    /**
     * 로컬에서 답안 검증 (오프라인 모드)
     */
    validateAnswerLocally(answer) {
        const isCorrect = answer === this.currentProblem.answer;
        return {
            success: true,
            correct: isCorrect,
            answer: answer,
            correctAnswer: this.currentProblem.answer,
            message: isCorrect ? '정답입니다!' : '오답입니다. 다시 시도해보세요.'
        };
    }

    /**
     * 연결 상태 UI 업데이트
     */
    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('moodle-status');
        if (statusElement) {
            if (isConnected) {
                statusElement.textContent = 'Moodle 연결됨';
                statusElement.className = 'status-badge connected';
            } else {
                statusElement.textContent = 'Moodle 미연결 (샘플 모드)';
                statusElement.className = 'status-badge disconnected';
            }
        }
    }

    /**
     * 문제를 수식으로 파싱
     */
    parseExpression(expression) {
        // 간단한 수식 파싱 (실제로는 더 복잡한 파서 필요)
        const tokens = expression.match(/\d+|[+\-×÷()]/g);
        return tokens;
    }

    /**
     * 계산 단계 생성 (자동)
     */
    generateSteps(expression) {
        // 이 함수는 수식을 분석하여 계산 단계를 자동으로 생성합니다
        // 실제 구현은 수식 파서와 평가기가 필요합니다
        // 여기서는 샘플 데이터의 steps를 사용합니다
        if (this.currentProblem && this.currentProblem.steps) {
            return this.currentProblem.steps;
        }
        return [];
    }
}

// 전역 Moodle 커넥터 인스턴스
let moodleConnector = null;

/**
 * Moodle 커넥터 초기화
 */
function initMoodleConnector() {
    moodleConnector = new MoodleConnector(CONFIG.moodle);
    debugLog('Moodle 커넥터 초기화 완료');

    // 초기 연결 시도
    moodleConnector.checkConnection();

    return moodleConnector;
}
