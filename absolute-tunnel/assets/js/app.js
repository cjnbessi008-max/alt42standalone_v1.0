/**
 * Absolute Tunnel App Main Logic
 * Moodle LMS 연동 및 앱 흐름 관리
 */

class AbsoluteTunnelApp {
    constructor() {
        this.engine = null;
        this.currentProblem = null;
        this.currentSession = null;
        this.startTime = null;
        this.attemptCount = 0;
        this.apiBaseUrl = '../api';

        this.init();
    }

    /**
     * 앱 초기화
     */
    async init() {
        console.log('Absolute Tunnel App initializing...');

        // URL 파라미터에서 세션 정보 가져오기
        const params = this.getUrlParams();
        const sessionToken = params.session || localStorage.getItem('session_token');

        if (sessionToken) {
            await this.validateSession(sessionToken);
        } else {
            // 테스트 모드 - 세션 생성
            await this.createTestSession();
        }

        // 3D 엔진 초기화
        this.initEngine();

        // UI 이벤트 리스너 설정
        this.setupEventListeners();

        // 시계 업데이트
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        // 첫 문제 로드
        await this.loadProblem();
    }

    /**
     * URL 파라미터 파싱
     */
    getUrlParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    }

    /**
     * 세션 검증
     */
    async validateSession(token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/problems.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'validate_session',
                    token: token
                })
            });

            const result = await response.json();

            if (result.success && result.session) {
                this.currentSession = result.session;
                localStorage.setItem('session_token', token);
                console.log('Session validated:', this.currentSession);
            } else {
                throw new Error('Invalid session');
            }
        } catch (error) {
            console.error('Session validation failed:', error);
            await this.createTestSession();
        }
    }

    /**
     * 테스트 세션 생성
     */
    async createTestSession() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/problems.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_session',
                    user_id: 9999, // 테스트 사용자
                    course_id: 1
                })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('session_token', result.token);
                this.currentSession = {
                    moodle_user_id: 9999,
                    session_token: result.token
                };
                console.log('Test session created:', this.currentSession);
            }
        } catch (error) {
            console.error('Failed to create test session:', error);
        }
    }

    /**
     * 3D 엔진 초기화
     */
    initEngine() {
        this.engine = new AbsoluteTunnelEngine('tunnel-container');
        console.log('3D Engine initialized');
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 속도 슬라이더
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');

        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            speedValue.textContent = speed.toFixed(1) + 'x';
            if (this.engine) {
                this.engine.setSpeed(speed);
            }
        });

        // 답안 입력 엔터키 처리
        const answerInput = document.getElementById('answer-input');
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        // 설정 변경
        document.getElementById('show-grid').addEventListener('change', (e) => {
            // 격자 표시/숨김 로직
            console.log('Show grid:', e.target.checked);
        });

        document.getElementById('sound-enabled').addEventListener('change', (e) => {
            // 사운드 활성화/비활성화
            console.log('Sound enabled:', e.target.checked);
        });

        document.getElementById('theme-select').addEventListener('change', (e) => {
            // 테마 변경
            this.changeTheme(e.target.value);
        });
    }

    /**
     * 시계 업데이트
     */
    updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('current-time').textContent = `${hours}:${minutes}`;
    }

    /**
     * 문제 로드
     */
    async loadProblem(problemId = null) {
        this.showLoading();

        try {
            let url = `${this.apiBaseUrl}/problems.php`;

            if (problemId) {
                url += `?id=${problemId}`;
            } else {
                // 랜덤 문제 가져오기
                url += `?difficulty=1`;
            }

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                const problems = Array.isArray(result.data) ? result.data : [result.data];
                this.currentProblem = problems[Math.floor(Math.random() * problems.length)];

                this.displayProblem();
                this.startTime = Date.now();
                this.attemptCount = 0;

                this.hideLoading();
                this.showScreen('main-screen');
            } else {
                throw new Error('Failed to load problem');
            }
        } catch (error) {
            console.error('Failed to load problem:', error);
            this.showToast('문제를 불러오는데 실패했습니다.', 'error');
            this.hideLoading();
        }
    }

    /**
     * 문제 표시
     */
    displayProblem() {
        if (!this.currentProblem) return;

        // 방정식 표시
        document.getElementById('equation-display').textContent = this.currentProblem.equation;

        // 3D 터널 생성
        const solutionRange = JSON.parse(this.currentProblem.solution_range);
        this.engine.createTunnel(this.currentProblem.equation, solutionRange);

        // 답안 입력 초기화
        document.getElementById('answer-input').value = '';
    }

    /**
     * 힌트 표시
     */
    showHint() {
        const hints = [
            '절댓값의 정의를 생각해보세요: |x| = x (x≥0), |x| = -x (x<0)',
            '터널의 색칠된 영역이 해의 범위를 나타냅니다.',
            '경계점의 색깔을 확인하세요: 🟢 (포함), 🔴 (미포함)',
            '부등호 기호를 주의깊게 확인하세요: <, ≤, >, ≥'
        ];

        const randomHint = hints[Math.floor(Math.random() * hints.length)];
        this.showToast(randomHint, 'info');
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        const answerInput = document.getElementById('answer-input');
        const userAnswer = answerInput.value.trim();

        if (!userAnswer) {
            this.showToast('답안을 입력해주세요.', 'warning');
            return;
        }

        this.attemptCount++;

        // 답안 검증
        const isCorrect = this.checkAnswer(userAnswer);

        // 진행 상황 기록
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        await this.recordProgress(isCorrect, userAnswer, timeSpent);

        // 결과 표시
        this.showResult(isCorrect, timeSpent);
    }

    /**
     * 답안 검증
     */
    checkAnswer(userAnswer) {
        if (!this.currentProblem) return false;

        const solutionRange = JSON.parse(this.currentProblem.solution_range);

        // 간단한 답안 파싱 (실제로는 더 정교한 파싱 필요)
        // 예: "-1 < x < 5" 또는 "x < -1 또는 x > 5"

        // 여기서는 교육 목적으로 간단히 구현
        // 실제로는 수식 파서를 사용해야 함

        const normalized = userAnswer.toLowerCase().replace(/\s/g, '');

        // 단일 범위 검증
        if (solutionRange.min !== undefined && solutionRange.max !== undefined) {
            const expected = `${solutionRange.min}<x<${solutionRange.max}`;
            const expectedClosed = `${solutionRange.min}≤x≤${solutionRange.max}`;

            if (normalized.includes(expected) || normalized.includes(expectedClosed)) {
                return true;
            }
        }

        // 다중 범위 검증
        if (solutionRange.ranges) {
            // 복잡한 검증 로직
            return true; // 임시
        }

        return false;
    }

    /**
     * 진행 상황 기록
     */
    async recordProgress(isCorrect, answer, timeSpent) {
        if (!this.currentSession || !this.currentProblem) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}/problems.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'record_progress',
                    moodle_user_id: this.currentSession.moodle_user_id,
                    problem_id: this.currentProblem.id,
                    attempt_count: this.attemptCount,
                    is_correct: isCorrect,
                    time_spent_seconds: timeSpent,
                    visualization_interactions: this.engine.getInteractionCount(),
                    student_answer: answer
                })
            });

            const result = await response.json();
            console.log('Progress recorded:', result);
        } catch (error) {
            console.error('Failed to record progress:', error);
        }
    }

    /**
     * 결과 표시
     */
    showResult(isCorrect, timeSpent) {
        const resultIcon = document.getElementById('result-icon');
        const resultTitle = document.getElementById('result-title');
        const resultMessage = document.getElementById('result-message');

        if (isCorrect) {
            resultIcon.textContent = '✓';
            resultTitle.textContent = '정답입니다!';
            resultTitle.style.color = '#10b981';
            resultMessage.textContent = '훌륭합니다! 절댓값 부등식의 해를 정확히 찾았습니다.';
        } else {
            resultIcon.textContent = '✗';
            resultTitle.textContent = '다시 시도해보세요';
            resultTitle.style.color = '#ef4444';
            resultMessage.textContent = '아쉽습니다. 터널을 다시 살펴보고 다시 시도해보세요.';

            // 오답일 경우 메인 화면으로 돌아가기
            setTimeout(() => {
                this.showScreen('main-screen');
            }, 2000);
            return;
        }

        // 통계 업데이트
        document.getElementById('time-spent').textContent = `${timeSpent}초`;
        document.getElementById('attempt-count').textContent = `${this.attemptCount}회`;

        this.showScreen('result-screen');
    }

    /**
     * 해설 표시
     */
    showExplanation() {
        if (!this.currentProblem) return;

        const explanationContent = document.getElementById('explanation-content');

        const solutionRange = JSON.parse(this.currentProblem.solution_range);
        const metadata = JSON.parse(this.currentProblem.metadata || '{}');

        let explanation = `<h3>${this.currentProblem.equation}</h3>`;
        explanation += `<p><strong>문제 유형:</strong> ${this.getProblemTypeKorean(this.currentProblem.problem_type)}</p>`;
        explanation += `<p><strong>난이도:</strong> ${'⭐'.repeat(this.currentProblem.difficulty_level)}</p>`;

        explanation += `<hr style="margin: 15px 0;">`;

        explanation += `<h4>풀이 과정</h4>`;
        explanation += `<ol>`;
        explanation += `<li>절댓값 기호 안의 식을 분석합니다.</li>`;
        explanation += `<li>부등호의 방향과 등호 포함 여부를 확인합니다.</li>`;
        explanation += `<li>절댓값의 정의에 따라 경우를 나누어 풀이합니다.</li>`;
        explanation += `<li>각 경우의 해를 구하고 합칩니다.</li>`;
        explanation += `</ol>`;

        explanation += `<h4>정답</h4>`;
        if (solutionRange.min !== undefined && solutionRange.max !== undefined) {
            explanation += `<p class="math-expression">${solutionRange.min} ${solutionRange.type === 'closed' ? '≤' : '<'} x ${solutionRange.type === 'closed' ? '≤' : '<'} ${solutionRange.max}</p>`;
        }

        explanationContent.innerHTML = explanation;

        this.showScreen('explanation-screen');
    }

    /**
     * 문제 유형 한글 변환
     */
    getProblemTypeKorean(type) {
        const types = {
            'linear': '선형 절댓값 부등식',
            'quadratic': '이차 절댓값 부등식',
            'compound': '복합 부등식'
        };
        return types[type] || type;
    }

    /**
     * 해설 닫기
     */
    closeExplanation() {
        this.showScreen('result-screen');
    }

    /**
     * 다음 문제
     */
    async nextProblem() {
        await this.loadProblem();
    }

    /**
     * 카메라 리셋
     */
    resetCamera() {
        if (this.engine) {
            this.engine.resetCamera();
            this.showToast('카메라가 리셋되었습니다.', 'info');
        }
    }

    /**
     * 뒤로 가기
     */
    goBack() {
        // 이전 화면으로 돌아가기 로직
        this.showScreen('main-screen');
    }

    /**
     * 메뉴 토글
     */
    toggleMenu() {
        const menuOverlay = document.getElementById('menu-overlay');
        menuOverlay.classList.toggle('active');
    }

    /**
     * 테마 변경
     */
    changeTheme(theme) {
        console.log('Theme changed to:', theme);
        // 테마 변경 로직 구현
        // 실제로는 CSS 변수를 변경하거나 클래스를 추가/제거
    }

    /**
     * 화면 전환
     */
    showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));

        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    /**
     * 로딩 표시
     */
    showLoading() {
        this.showScreen('loading-screen');
    }

    /**
     * 로딩 숨김
     */
    hideLoading() {
        // 화면 전환은 loadProblem에서 처리
    }

    /**
     * 토스트 알림
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// 앱 인스턴스 생성
let app;

// DOM 로드 후 앱 시작
document.addEventListener('DOMContentLoaded', () => {
    app = new AbsoluteTunnelApp();
});
