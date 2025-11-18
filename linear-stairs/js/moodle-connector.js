/**
 * Moodle 연동 모듈
 * Moodle LMS와 통신하여 문제 정보를 받아오고 결과를 전송
 */

class MoodleConnector {
    constructor() {
        this.moodleUrl = null;
        this.sessionToken = null;
        this.questionId = null;
        this.userId = null;
        this.connected = false;

        this.init();
    }

    /**
     * 초기화
     */
    init() {
        // URL 파라미터에서 Moodle 정보 추출
        this.parseUrlParameters();

        // postMessage 이벤트 리스너 등록 (iframe 통신용)
        window.addEventListener('message', (event) => this.handleMessage(event));

        // 부모 창에 준비 완료 신호 전송
        if (window.parent !== window) {
            this.sendToParent({
                type: 'ready',
                message: 'Linear Stairs app is ready'
            });
        }
    }

    /**
     * URL 파라미터 파싱
     */
    parseUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);

        this.moodleUrl = urlParams.get('moodle_url');
        this.sessionToken = urlParams.get('token');
        this.questionId = urlParams.get('question_id');
        this.userId = urlParams.get('user_id');

        if (this.moodleUrl && this.sessionToken) {
            this.connected = true;
            this.updateStatus('연결됨', 'connected');
        }
    }

    /**
     * postMessage 핸들러
     */
    handleMessage(event) {
        // 보안: 신뢰할 수 있는 출처 확인
        // 실제 환경에서는 Moodle 도메인을 명시해야 함
        // if (event.origin !== 'https://your-moodle-domain.com') return;

        const data = event.data;

        if (data.type === 'problem_data') {
            // Moodle에서 문제 데이터 수신
            this.handleProblemData(data);
        } else if (data.type === 'submit_request') {
            // 답안 제출 요청
            this.handleSubmitRequest();
        }
    }

    /**
     * 문제 데이터 처리
     */
    handleProblemData(data) {
        if (data.firstTerm !== undefined) {
            document.getElementById('input-first-term').value = data.firstTerm;
        }
        if (data.commonDiff !== undefined) {
            document.getElementById('input-common-diff').value = data.commonDiff;
        }
        if (data.termCount !== undefined) {
            document.getElementById('input-term-count').value = data.termCount;
        }

        // 시각화 업데이트
        if (window.linearStairsApp) {
            window.linearStairsApp.updateVisualization();
        }

        this.updateStatus('문제 로드됨', 'connected');
    }

    /**
     * 답안 제출 요청 처리
     */
    handleSubmitRequest() {
        const answer = this.collectAnswer();
        this.sendToParent({
            type: 'answer_submit',
            questionId: this.questionId,
            userId: this.userId,
            answer: answer
        });
    }

    /**
     * 현재 상태 수집 (답안)
     */
    collectAnswer() {
        return {
            firstTerm: parseInt(document.getElementById('input-first-term').value),
            commonDiff: parseInt(document.getElementById('input-common-diff').value),
            termCount: parseInt(document.getElementById('input-term-count').value),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 부모 창으로 메시지 전송
     */
    sendToParent(message) {
        if (window.parent !== window) {
            window.parent.postMessage(message, '*');
            // 실제 환경에서는 특정 도메인 지정:
            // window.parent.postMessage(message, 'https://your-moodle-domain.com');
        }
    }

    /**
     * Moodle API 호출 (REST API 방식)
     */
    async callMoodleAPI(endpoint, params = {}) {
        if (!this.moodleUrl || !this.sessionToken) {
            console.error('Moodle connection not configured');
            return null;
        }

        try {
            const url = new URL(endpoint, this.moodleUrl);
            url.searchParams.append('wstoken', this.sessionToken);
            url.searchParams.append('moodlewsrestformat', 'json');

            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key]);
            });

            const response = await fetch(url.toString());
            const data = await response.json();

            if (data.exception) {
                throw new Error(data.message);
            }

            return data;
        } catch (error) {
            console.error('Moodle API Error:', error);
            this.updateStatus('연결 오류', 'error');
            return null;
        }
    }

    /**
     * 문제 데이터 가져오기
     */
    async fetchProblemData() {
        if (!this.questionId) {
            console.warn('No question ID specified');
            return;
        }

        const data = await this.callMoodleAPI('/webservice/rest/server.php', {
            wsfunction: 'mod_quiz_get_question_data',
            questionid: this.questionId
        });

        if (data) {
            this.handleProblemData(data);
        }
    }

    /**
     * 답안 제출
     */
    async submitAnswer(answer) {
        if (!this.questionId || !this.userId) {
            console.warn('Missing question ID or user ID');
            return;
        }

        const result = await this.callMoodleAPI('/webservice/rest/server.php', {
            wsfunction: 'mod_quiz_process_attempt',
            questionid: this.questionId,
            userid: this.userId,
            answer: JSON.stringify(answer)
        });

        if (result && result.success) {
            this.updateStatus('제출 완료', 'connected');
            return true;
        } else {
            this.updateStatus('제출 실패', 'error');
            return false;
        }
    }

    /**
     * 상태 표시 업데이트
     */
    updateStatus(message, className = '') {
        const statusElement = document.getElementById('moodle-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = className;
        }
    }

    /**
     * 연결 테스트
     */
    async testConnection() {
        this.updateStatus('연결 테스트 중...', '');

        const result = await this.callMoodleAPI('/webservice/rest/server.php', {
            wsfunction: 'core_webservice_get_site_info'
        });

        if (result) {
            this.updateStatus('연결 성공', 'connected');
            console.log('Moodle Site Info:', result);
            return true;
        } else {
            this.updateStatus('연결 실패', 'error');
            return false;
        }
    }
}

// Moodle 커넥터 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.moodleConnector = new MoodleConnector();
});
