/**
 * Moodle LMS 연동 모듈
 * Moodle 3.7 + PHP 7.1.9 + MySQL 5.7 환경과 통신
 */

class MoodleConnector {
    constructor() {
        this.apiEndpoint = 'src/php/moodle-api.php';
        this.connectionStatus = 'disconnected';
        this.currentProblem = null;
        this.listeners = {
            statusChange: [],
            problemLoaded: [],
            error: []
        };
    }

    /**
     * 이벤트 리스너 등록
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * 이벤트 트리거
     */
    trigger(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Moodle 연결 초기화
     */
    async initialize() {
        try {
            this.updateStatus('waiting');

            // Moodle 서버 연결 확인
            const response = await fetch(`${this.apiEndpoint}?action=check_connection`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.updateStatus('connected');
                return true;
            } else {
                throw new Error(data.message || 'Moodle 연결 실패');
            }
        } catch (error) {
            console.error('Moodle 초기화 오류:', error);
            this.updateStatus('disconnected');
            this.trigger('error', error);
            return false;
        }
    }

    /**
     * 문제 정보 가져오기
     */
    async fetchProblem(problemId) {
        try {
            const response = await fetch(`${this.apiEndpoint}?action=get_problem&id=${problemId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.currentProblem = data.problem;
                this.trigger('problemLoaded', this.currentProblem);
                return this.currentProblem;
            } else {
                throw new Error(data.message || '문제를 불러올 수 없습니다');
            }
        } catch (error) {
            console.error('문제 로딩 오류:', error);
            this.trigger('error', error);
            return null;
        }
    }

    /**
     * 학생 응답 제출
     */
    async submitAnswer(problemId, answer) {
        try {
            const response = await fetch(`${this.apiEndpoint}?action=submit_answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    problem_id: problemId,
                    answer: answer,
                    timestamp: new Date().toISOString()
                })
            });

            const data = await response.json();

            if (data.success) {
                return data.result;
            } else {
                throw new Error(data.message || '응답 제출 실패');
            }
        } catch (error) {
            console.error('응답 제출 오류:', error);
            this.trigger('error', error);
            return null;
        }
    }

    /**
     * 연결 상태 업데이트
     */
    updateStatus(status) {
        this.connectionStatus = status;
        this.trigger('statusChange', status);
    }

    /**
     * 현재 연결 상태 반환
     */
    getStatus() {
        return this.connectionStatus;
    }

    /**
     * 데모 모드: 로컬에서 테스트할 때 사용
     */
    async loadDemoData() {
        // 데모 문제 데이터
        const demoProblems = [
            {
                id: 1,
                title: '정육면체의 부피 계산',
                description: '한 변의 길이가 5cm인 정육면체의 부피를 계산하세요.',
                shape: {
                    type: 'cube',
                    dimensions: { size: 5 },
                    color: 0x4CAF50
                },
                answer_type: 'numeric'
            },
            {
                id: 2,
                title: '원기둥의 내부 구조',
                description: '반지름 3cm, 높이 8cm인 원기둥의 내부 구조를 관찰하세요.',
                shape: {
                    type: 'cylinder',
                    dimensions: { radius: 3, height: 8 },
                    color: 0x2196F3
                },
                answer_type: 'observation'
            },
            {
                id: 3,
                title: '구의 표면적 이해',
                description: '반지름 4cm인 구의 표면적을 이해하고 계산하세요.',
                shape: {
                    type: 'sphere',
                    dimensions: { radius: 4 },
                    color: 0xFF9800
                },
                answer_type: 'numeric'
            },
            {
                id: 4,
                title: '삼각뿔의 꼭짓점 개수',
                description: '사각뿔의 꼭짓점, 모서리, 면의 개수를 세어보세요.',
                shape: {
                    type: 'pyramid',
                    dimensions: { baseSize: 4, height: 6 },
                    color: 0xE91E63
                },
                answer_type: 'multiple_choice'
            }
        ];

        // 랜덤하게 문제 선택
        const randomProblem = demoProblems[Math.floor(Math.random() * demoProblems.length)];

        this.currentProblem = randomProblem;
        this.updateStatus('connected');

        // 약간의 지연 후 문제 로드 (실제 API 호출 시뮬레이션)
        setTimeout(() => {
            this.trigger('problemLoaded', this.currentProblem);
        }, 500);

        return this.currentProblem;
    }
}

// 전역 인스턴스 생성
const moodleConnector = new MoodleConnector();
