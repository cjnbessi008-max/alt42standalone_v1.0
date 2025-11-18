/**
 * Moodle LMS Connector
 * Moodle와의 연동 및 문제 정보 수신
 */

class MoodleConnector {
    constructor(config = {}) {
        this.apiEndpoint = config.apiEndpoint || '/src/php/moodle-api.php';
        this.pollInterval = config.pollInterval || 5000; // 5초마다 폴링
        this.isConnected = false;
        this.pollTimer = null;
        this.onDataCallback = null;
        this.onConnectionChangeCallback = null;

        // 세션 정보
        this.sessionId = this.generateSessionId();
        this.userId = config.userId || null;
        this.courseId = config.courseId || null;
    }

    /**
     * 연결 시작
     */
    connect() {
        console.log('Moodle 연결 시작...');
        this.updateConnectionStatus('connecting');

        // 초기 연결 테스트
        this.testConnection()
            .then(() => {
                this.isConnected = true;
                this.updateConnectionStatus('connected');
                console.log('Moodle 연결 성공');

                // 폴링 시작
                this.startPolling();
            })
            .catch((error) => {
                console.error('Moodle 연결 실패:', error);
                this.isConnected = false;
                this.updateConnectionStatus('disconnected');

                // 10초 후 재시도
                setTimeout(() => this.connect(), 10000);
            });
    }

    /**
     * 연결 테스트
     */
    async testConnection() {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'ping',
                    sessionId: this.sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data.status === 'ok';
        } catch (error) {
            throw new Error('연결 테스트 실패: ' + error.message);
        }
    }

    /**
     * 폴링 시작
     */
    startPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
        }

        // 즉시 한 번 실행
        this.fetchProblemData();

        // 주기적으로 실행
        this.pollTimer = setInterval(() => {
            this.fetchProblemData();
        }, this.pollInterval);
    }

    /**
     * 폴링 중지
     */
    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }

    /**
     * 문제 데이터 가져오기
     */
    async fetchProblemData() {
        if (!this.isConnected) return;

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'get_problem',
                    sessionId: this.sessionId,
                    userId: this.userId,
                    courseId: this.courseId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.problem) {
                this.handleProblemData(data.problem);
            }
        } catch (error) {
            console.error('문제 데이터 가져오기 실패:', error);
            this.handleConnectionError(error);
        }
    }

    /**
     * 문제 데이터 처리
     */
    handleProblemData(problem) {
        if (this.onDataCallback) {
            this.onDataCallback(problem);
        }
    }

    /**
     * 연결 오류 처리
     */
    handleConnectionError(error) {
        console.error('연결 오류:', error);
        this.isConnected = false;
        this.updateConnectionStatus('disconnected');
        this.stopPolling();

        // 10초 후 재연결 시도
        setTimeout(() => this.connect(), 10000);
    }

    /**
     * 연결 상태 업데이트
     */
    updateConnectionStatus(status) {
        if (this.onConnectionChangeCallback) {
            this.onConnectionChangeCallback(status);
        }
    }

    /**
     * 데이터 수신 콜백 등록
     */
    onData(callback) {
        this.onDataCallback = callback;
    }

    /**
     * 연결 상태 변화 콜백 등록
     */
    onConnectionChange(callback) {
        this.onConnectionChangeCallback = callback;
    }

    /**
     * 세션 ID 생성
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 학생 응답 전송
     */
    async submitAnswer(answer) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'submit_answer',
                    sessionId: this.sessionId,
                    userId: this.userId,
                    answer: answer,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('응답 전송 실패:', error);
            throw error;
        }
    }

    /**
     * 연결 해제
     */
    disconnect() {
        this.stopPolling();
        this.isConnected = false;
        this.updateConnectionStatus('disconnected');
        console.log('Moodle 연결 해제');
    }

    /**
     * 데모 모드 (Moodle 없이 테스트)
     */
    enableDemoMode() {
        console.log('데모 모드 활성화');
        this.isConnected = true;
        this.updateConnectionStatus('connected');

        // 샘플 방정식들
        const sampleEquations = [
            'x^2 - 4 = 0',           // 2개 근: x = ±2
            'x^2 + 1 = 0',           // 0개 실근 (복소근)
            'x^2 - 2x + 1 = 0',      // 1개 근: x = 1 (중근)
            'x^3 - 6x^2 + 11x - 6 = 0', // 3개 근
            '2x - 4 = 0',            // 1개 근: x = 2
            'x^2 - 5x + 6 = 0',      // 2개 근: x = 2, 3
            'x^2 + 4x + 4 = 0',      // 1개 근: x = -2 (중근)
        ];

        let index = 0;

        // 10초마다 새로운 방정식 제공
        this.pollTimer = setInterval(() => {
            const equation = sampleEquations[index % sampleEquations.length];
            index++;

            this.handleProblemData({
                id: index,
                equation: equation,
                type: 'polynomial',
                difficulty: 'medium',
                timestamp: Date.now()
            });
        }, 10000);

        // 즉시 첫 번째 방정식 제공
        this.handleProblemData({
            id: 1,
            equation: sampleEquations[0],
            type: 'polynomial',
            difficulty: 'medium',
            timestamp: Date.now()
        });
    }
}

// 전역 인스턴스
let moodleConnector = null;

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        moodleConnector = new MoodleConnector();
    });
}
