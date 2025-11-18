/**
 * Main Application
 * Root Wave 앱의 메인 컨트롤러
 */

class RootWaveApp {
    constructor() {
        // DOM 요소
        this.equationText = document.getElementById('equationText');
        this.rootCount = document.getElementById('rootCount');
        this.rootValues = document.getElementById('rootValues');
        this.logContent = document.getElementById('logContent');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.currentTime = document.getElementById('currentTime');

        // 상태
        this.currentProblem = null;
        this.isInitialized = false;

        this.init();
    }

    /**
     * 앱 초기화
     */
    async init() {
        console.log('Root Wave App 초기화 중...');

        // 컴포넌트 초기화 대기
        await this.waitForComponents();

        // Wave 컨트롤러 설정
        if (window.waveController) {
            console.log('Wave Controller 준비됨');
        }

        // Root Detector 설정
        if (window.rootDetector) {
            window.rootDetector.onRootChange((oldCount, newCount, roots) => {
                this.handleRootChange(oldCount, newCount, roots);
            });
            console.log('Root Detector 준비됨');
        }

        // Moodle Connector 설정
        if (window.moodleConnector) {
            window.moodleConnector.onData((problem) => {
                this.handleNewProblem(problem);
            });

            window.moodleConnector.onConnectionChange((status) => {
                this.updateConnectionUI(status);
            });

            // 데모 모드 활성화 (실제 Moodle 연결 전 테스트용)
            window.moodleConnector.enableDemoMode();
            console.log('Moodle Connector 준비됨 (데모 모드)');
        }

        // 시계 업데이트
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        this.isInitialized = true;
        this.addLog('시스템 초기화 완료', 'highlight');
        console.log('Root Wave App 준비 완료');
    }

    /**
     * 컴포넌트 로드 대기
     */
    async waitForComponents() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.waveController && window.rootDetector && window.moodleConnector) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            // 5초 타임아웃
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });
    }

    /**
     * 새로운 문제 처리
     */
    handleNewProblem(problem) {
        console.log('새로운 문제 수신:', problem);

        this.currentProblem = problem;

        // UI 업데이트
        this.updateEquationUI(problem.equation);

        // 근 분석
        if (window.rootDetector) {
            const result = window.rootDetector.analyzeEquation(problem.equation);
            this.updateRootUI(result);

            // 로그 추가
            this.addLog(`새 방정식: ${problem.equation}`, 'highlight');
            this.addLog(`근의 개수: ${result.rootCount}개`);
        }
    }

    /**
     * 근의 개수 변화 처리
     */
    handleRootChange(oldCount, newCount, roots) {
        console.log(`근의 개수 변화: ${oldCount} → ${newCount}`);

        // Wave 애니메이션 트리거
        if (window.waveController) {
            window.waveController.triggerWave(oldCount, newCount);
        }

        // UI 애니메이션
        const changeType = newCount > oldCount ? 'increase' : 'decrease';
        this.rootCount.classList.add(changeType);

        setTimeout(() => {
            this.rootCount.classList.remove(changeType);
        }, 600);

        // 로그 추가
        const changeText = newCount > oldCount
            ? `근 ${newCount - oldCount}개 증가`
            : `근 ${oldCount - newCount}개 감소`;
        this.addLog(changeText, 'highlight');
    }

    /**
     * 방정식 UI 업데이트
     */
    updateEquationUI(equation) {
        this.equationText.textContent = equation;
        this.equationText.classList.add('changed');

        setTimeout(() => {
            this.equationText.classList.remove('changed');
        }, 800);
    }

    /**
     * 근 정보 UI 업데이트
     */
    updateRootUI(result) {
        // 근의 개수
        this.rootCount.textContent = result.rootCount;

        // 근의 값들
        if (result.roots.length > 0) {
            const formatted = window.rootDetector.formatRoots(result.roots);
            this.rootValues.innerHTML = `<strong>근:</strong> ${formatted}`;
        } else {
            this.rootValues.innerHTML = '<em>실근이 존재하지 않습니다</em>';
        }
    }

    /**
     * 연결 상태 UI 업데이트
     */
    updateConnectionUI(status) {
        const statusText = {
            connected: '연결됨',
            connecting: '연결 중...',
            disconnected: '연결 끊김'
        };

        this.connectionStatus.className = `connection-status ${status}`;
        this.connectionStatus.querySelector('span:last-child').textContent = statusText[status] || '알 수 없음';

        if (status === 'connected') {
            this.addLog('Moodle 연결 성공', 'highlight');
        } else if (status === 'disconnected') {
            this.addLog('Moodle 연결 끊김');
        }
    }

    /**
     * 시계 업데이트
     */
    updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        this.currentTime.textContent = `${hours}:${minutes}`;
    }

    /**
     * 로그 추가
     */
    addLog(message, className = '') {
        const entry = document.createElement('div');
        entry.className = `log-entry new ${className}`;

        const timestamp = new Date().toLocaleTimeString('ko-KR');
        entry.textContent = `[${timestamp}] ${message}`;

        // 최신 로그를 위에 추가
        this.logContent.insertBefore(entry, this.logContent.firstChild);

        // 애니메이션 클래스 제거
        setTimeout(() => {
            entry.classList.remove('new');
        }, 500);

        // 최대 20개까지만 유지
        while (this.logContent.children.length > 20) {
            this.logContent.removeChild(this.logContent.lastChild);
        }
    }

    /**
     * 수동 방정식 입력 (테스트용)
     */
    testEquation(equation) {
        this.handleNewProblem({
            id: 'test',
            equation: equation,
            type: 'test',
            timestamp: Date.now()
        });
    }
}

// 앱 인스턴스 생성
let app = null;

document.addEventListener('DOMContentLoaded', () => {
    // 약간의 지연 후 앱 시작 (다른 스크립트 로드 대기)
    setTimeout(() => {
        app = new RootWaveApp();

        // 전역에서 접근 가능하도록
        window.rootWaveApp = app;

        // 콘솔에서 테스트할 수 있도록
        console.log('='.repeat(50));
        console.log('Root Wave App 시작됨');
        console.log('테스트 명령어: app.testEquation("x^2 - 4 = 0")');
        console.log('='.repeat(50));
    }, 500);
});
