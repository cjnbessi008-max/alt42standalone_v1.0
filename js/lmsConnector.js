/**
 * LMS Connector - Moodle 연동
 * Moodle 3.7, MySQL 5.7, PHP 7.1.9 환경과 연동
 */

class LMSConnector {
    constructor() {
        this.apiEndpoint = 'api/moodle_connector.php';
        this.isConnected = false;
        this.problemData = null;
        this.studentData = null;
        this.pollInterval = null;
    }

    // 연결 상태 업데이트
    updateConnectionStatus(status, message) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;

        switch (status) {
            case 'connected':
                statusElement.innerHTML = '🟢 연결됨';
                statusElement.style.color = '#2ecc71';
                this.isConnected = true;
                break;
            case 'disconnected':
                statusElement.innerHTML = '🔴 연결 끊김';
                statusElement.style.color = '#e74c3c';
                this.isConnected = false;
                break;
            case 'loading':
                statusElement.innerHTML = '🟡 연결 중...';
                statusElement.style.color = '#f39c12';
                break;
            default:
                statusElement.innerHTML = '⚪ 대기중';
                statusElement.style.color = '#95a5a6';
        }

        if (message) {
            console.log(`LMS 상태: ${message}`);
        }
    }

    // Moodle에서 문제 정보 가져오기
    async fetchProblemData(problemId) {
        try {
            this.updateConnectionStatus('loading', '문제 정보 로딩 중...');

            const response = await fetch(`${this.apiEndpoint}?action=getProblem&id=${problemId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.problemData = data.problem;
                this.updateConnectionStatus('connected', '문제 정보 로드 완료');
                this.displayProblemInfo();
                return data.problem;
            } else {
                throw new Error(data.error || '문제 정보를 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('문제 정보 로드 실패:', error);
            this.updateConnectionStatus('disconnected', error.message);
            return null;
        }
    }

    // 학생 정보 가져오기
    async fetchStudentData(studentId) {
        try {
            const response = await fetch(`${this.apiEndpoint}?action=getStudent&id=${studentId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.studentData = data.student;
                this.displayStudentInfo();
                return data.student;
            } else {
                throw new Error(data.error || '학생 정보를 가져올 수 없습니다.');
            }
        } catch (error) {
            console.error('학생 정보 로드 실패:', error);
            return null;
        }
    }

    // 문제 정보 표시
    displayProblemInfo() {
        const problemIdElement = document.getElementById('problemId');
        if (problemIdElement && this.problemData) {
            problemIdElement.textContent = this.problemData.id || '-';
        }
    }

    // 학생 정보 표시
    displayStudentInfo() {
        const studentIdElement = document.getElementById('studentId');
        if (studentIdElement && this.studentData) {
            studentIdElement.textContent = this.studentData.id || '-';
        }
    }

    // 문제 파라미터 파싱 (적분 구간 등)
    parseProblemParameters() {
        if (!this.problemData) {
            return {
                lowerBound: 0,
                upperBound: 2,
                functionType: 'sine'
            };
        }

        try {
            const params = JSON.parse(this.problemData.parameters || '{}');
            return {
                lowerBound: parseFloat(params.lowerBound) || 0,
                upperBound: parseFloat(params.upperBound) || 2,
                functionType: params.functionType || 'sine'
            };
        } catch (error) {
            console.error('파라미터 파싱 실패:', error);
            return {
                lowerBound: 0,
                upperBound: 2,
                functionType: 'sine'
            };
        }
    }

    // 학생 답안 제출
    async submitAnswer(answer) {
        if (!this.problemData || !this.studentData) {
            console.warn('문제 또는 학생 정보가 없습니다.');
            return false;
        }

        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'submitAnswer',
                    problemId: this.problemData.id,
                    studentId: this.studentData.id,
                    answer: answer,
                    timestamp: new Date().toISOString()
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('답안 제출 성공:', data);
                return true;
            } else {
                console.error('답안 제출 실패:', data.error);
                return false;
            }
        } catch (error) {
            console.error('답안 제출 중 오류:', error);
            return false;
        }
    }

    // URL에서 파라미터 가져오기
    getURLParameters() {
        const params = new URLSearchParams(window.location.search);
        return {
            problemId: params.get('problem_id') || params.get('pid'),
            studentId: params.get('student_id') || params.get('sid'),
            courseId: params.get('course_id') || params.get('cid')
        };
    }

    // 자동 연결 초기화
    async autoConnect() {
        const params = this.getURLParameters();

        if (params.problemId) {
            await this.fetchProblemData(params.problemId);
        }

        if (params.studentId) {
            await this.fetchStudentData(params.studentId);
        }

        // URL 파라미터가 없으면 데모 모드
        if (!params.problemId && !params.studentId) {
            this.loadDemoData();
        }
    }

    // 데모 데이터 로드 (개발/테스트용)
    loadDemoData() {
        this.problemData = {
            id: 'DEMO_001',
            title: '적분 시각화 데모',
            parameters: JSON.stringify({
                lowerBound: 0,
                upperBound: 2,
                functionType: 'sine'
            })
        };

        this.studentData = {
            id: 'DEMO_STUDENT',
            name: '테스트 학생'
        };

        this.displayProblemInfo();
        this.displayStudentInfo();
        this.updateConnectionStatus('connected', '데모 모드로 실행 중');
    }

    // 주기적으로 서버와 동기화
    startPolling(interval = 5000) {
        this.stopPolling();

        this.pollInterval = setInterval(async () => {
            if (this.problemData && this.problemData.id !== 'DEMO_001') {
                await this.fetchProblemData(this.problemData.id);
            }
        }, interval);
    }

    // 폴링 중지
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    // 연결 해제
    disconnect() {
        this.stopPolling();
        this.isConnected = false;
        this.problemData = null;
        this.studentData = null;
        this.updateConnectionStatus('disconnected', '연결 해제됨');
    }
}
