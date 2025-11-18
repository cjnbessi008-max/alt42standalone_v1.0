/**
 * Prime Fireworks - Main Application
 * 메인 애플리케이션 로직
 */

class PrimeFireworksApp {
    constructor() {
        this.currentProblem = null;
        this.startTime = null;
        this.timerInterval = null;
        this.fireworksEngine = null;

        this.init();
    }

    /**
     * 초기화
     */
    init() {
        // DOM 요소 참조
        this.elements = {
            // 화면
            loadingScreen: document.getElementById('loading-screen'),
            problemScreen: document.getElementById('problem-screen'),
            resultScreen: document.getElementById('result-screen'),
            progressScreen: document.getElementById('progress-screen'),

            // 문제 화면 요소
            difficultyBadge: document.getElementById('difficulty-badge'),
            problemTitle: document.getElementById('problem-title'),
            problemHint: document.getElementById('problem-hint'),
            numberDisplay: document.getElementById('number-display'),
            answerInputs: document.getElementById('answer-inputs'),
            timeDisplay: document.getElementById('time-display'),

            // 결과 화면 요소
            resultIcon: document.getElementById('result-icon'),
            resultTitle: document.getElementById('result-title'),
            resultMessage: document.getElementById('result-message'),
            scoreValue: document.getElementById('score-value'),
            timeValue: document.getElementById('time-value'),
            answerValue: document.getElementById('answer-value'),

            // 진도 화면 요소
            totalProblems: document.getElementById('total-problems'),
            completedProblems: document.getElementById('completed-problems'),
            correctRate: document.getElementById('correct-rate'),
            fireworksCount: document.getElementById('fireworks-count'),

            // 버튼
            submitBtn: document.getElementById('submit-btn'),
            resetBtn: document.getElementById('reset-btn'),
            addFactorBtn: document.getElementById('add-factor-btn'),
            nextProblemBtn: document.getElementById('next-problem-btn'),
            startLearningBtn: document.getElementById('start-learning-btn'),
            closeBtn: document.getElementById('close-btn'),

            // 캔버스
            canvas: document.getElementById('fireworks-canvas')
        };

        // 폭죽 엔진 초기화
        this.fireworksEngine = new FireworksEngine(this.elements.canvas);

        // 이벤트 리스너 등록
        this.registerEventListeners();

        // 초기 화면 표시 (진도 화면)
        this.showProgressScreen();

        // 시간 업데이트
        this.updateCurrentTime();
        setInterval(() => this.updateCurrentTime(), 1000);
    }

    /**
     * 이벤트 리스너 등록
     */
    registerEventListeners() {
        // 네비게이션 버튼
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                if (screen === 'problem') {
                    this.showProblemScreen();
                } else if (screen === 'progress') {
                    this.showProgressScreen();
                }
            });
        });

        // 문제 화면 버튼
        this.elements.submitBtn.addEventListener('click', () => this.submitAnswer());
        this.elements.resetBtn.addEventListener('click', () => this.resetAnswer());
        this.elements.addFactorBtn.addEventListener('click', () => this.addFactorInput());

        // 결과 화면 버튼
        this.elements.nextProblemBtn.addEventListener('click', () => this.loadNewProblem());

        // 진도 화면 버튼
        this.elements.startLearningBtn.addEventListener('click', () => this.loadNewProblem());

        // 닫기 버튼
        this.elements.closeBtn.addEventListener('click', () => this.minimizeApp());
    }

    /**
     * 화면 전환
     */
    showScreen(screenElement) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        screenElement.classList.add('active');
    }

    /**
     * 로딩 화면 표시
     */
    showLoadingScreen() {
        this.showScreen(this.elements.loadingScreen);
    }

    /**
     * 문제 화면 표시
     */
    showProblemScreen() {
        if (!this.currentProblem) {
            this.loadNewProblem();
        } else {
            this.showScreen(this.elements.problemScreen);
            this.updateNavigation('problem');
        }
    }

    /**
     * 결과 화면 표시
     */
    showResultScreen() {
        this.showScreen(this.elements.resultScreen);
    }

    /**
     * 진도 화면 표시
     */
    async showProgressScreen() {
        this.showScreen(this.elements.progressScreen);
        this.updateNavigation('progress');
        await this.loadProgress();
    }

    /**
     * 네비게이션 활성화 상태 업데이트
     */
    updateNavigation(activeScreen) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.screen === activeScreen) {
                btn.classList.add('active');
            }
        });
    }

    /**
     * 새 문제 로드
     */
    async loadNewProblem(level = 'medium') {
        this.showLoadingScreen();

        try {
            this.currentProblem = await API.getProblem(level);

            // 문제 화면 업데이트
            this.updateProblemDisplay();

            // 답안 입력 초기화
            this.resetAnswer();

            // 문제 화면 표시
            this.showScreen(this.elements.problemScreen);
            this.updateNavigation('problem');

            // 타이머 시작
            this.startTimer();

        } catch (error) {
            alert('문제를 불러오는데 실패했습니다: ' + error.message);
        }
    }

    /**
     * 문제 화면 업데이트
     */
    updateProblemDisplay() {
        const problem = this.currentProblem;

        // 난이도 배지
        this.elements.difficultyBadge.textContent = this.getDifficultyText(problem.difficulty);
        this.elements.difficultyBadge.className = `difficulty-badge ${problem.difficulty}`;

        // 문제 정보
        this.elements.problemTitle.textContent = problem.instruction;
        this.elements.problemHint.textContent = problem.hint || '';
        this.elements.numberDisplay.textContent = problem.number;

        // 캔버스 초기화
        this.fireworksEngine.clear();
        this.fireworksEngine.drawStars();
    }

    /**
     * 난이도 텍스트 변환
     */
    getDifficultyText(level) {
        const difficultyMap = {
            'easy': '쉬움',
            'medium': '중간',
            'hard': '어려움'
        };
        return difficultyMap[level] || '중간';
    }

    /**
     * 인수 입력 필드 추가
     */
    addFactorInput(value = '') {
        const inputGroup = document.createElement('div');
        inputGroup.className = 'answer-input-group';

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'answer-input';
        input.placeholder = '소수';
        input.value = value;
        input.min = '2';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
            inputGroup.remove();
        });

        inputGroup.appendChild(input);
        inputGroup.appendChild(removeBtn);
        this.elements.answerInputs.appendChild(inputGroup);

        input.focus();
    }

    /**
     * 답안 초기화
     */
    resetAnswer() {
        this.elements.answerInputs.innerHTML = '';
        // 기본 입력 필드 2개 추가
        this.addFactorInput();
        this.addFactorInput();
    }

    /**
     * 답안 가져오기
     */
    getAnswer() {
        const inputs = this.elements.answerInputs.querySelectorAll('.answer-input');
        const answer = [];

        inputs.forEach(input => {
            const value = parseInt(input.value);
            if (!isNaN(value) && value > 0) {
                answer.push(value);
            }
        });

        return answer;
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        const answer = this.getAnswer();

        if (answer.length === 0) {
            alert('답안을 입력해주세요.');
            return;
        }

        this.stopTimer();
        const timeSpent = this.getElapsedTime();

        this.showLoadingScreen();

        try {
            const result = await API.submitAnswer(
                this.currentProblem.problem_id,
                answer,
                timeSpent
            );

            // 결과 화면 업데이트
            this.showResult(result);

            // 정답이면 폭죽 애니메이션 재생
            if (result.is_correct && result.fireworks_data) {
                setTimeout(() => {
                    this.fireworksEngine.playFactorizationAnimation(result.fireworks_data);
                }, 500);
            }

        } catch (error) {
            alert('답안 제출에 실패했습니다: ' + error.message);
            this.showProblemScreen();
        }
    }

    /**
     * 결과 표시
     */
    showResult(result) {
        // 아이콘 및 메시지
        if (result.is_correct) {
            this.elements.resultIcon.textContent = '🎉';
            this.elements.resultTitle.textContent = '정답입니다!';
            this.elements.resultMessage.textContent = result.feedback;
        } else {
            this.elements.resultIcon.textContent = '😅';
            this.elements.resultTitle.textContent = '아쉽네요!';
            this.elements.resultMessage.textContent = result.feedback;
        }

        // 점수
        this.elements.scoreValue.textContent = `${result.score}점`;

        // 소요 시간
        this.elements.timeValue.textContent = this.formatTime(result.time_spent);

        // 정답
        this.elements.answerValue.textContent = result.correct_answer.join(' × ');

        // 결과 화면 표시
        this.showResultScreen();
    }

    /**
     * 타이머 시작
     */
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = this.getElapsedTime();
            this.elements.timeDisplay.textContent = this.formatTime(elapsed);
        }, 1000);
    }

    /**
     * 타이머 정지
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * 경과 시간 가져오기 (초)
     */
    getElapsedTime() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    /**
     * 시간 포맷 (초 → 분:초)
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 진도 로드
     */
    async loadProgress() {
        try {
            const progress = await API.getProgress();

            this.elements.totalProblems.textContent = progress.total_problems;
            this.elements.completedProblems.textContent = progress.completed_problems;
            this.elements.correctRate.textContent = `${progress.correct_rate}%`;
            this.elements.fireworksCount.textContent = progress.fireworks_count;

        } catch (error) {
            console.error('Failed to load progress:', error);
        }
    }

    /**
     * 현재 시간 업데이트
     */
    updateCurrentTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeElement = document.getElementById('current-time');
        if (timeElement) {
            timeElement.textContent = `${hours}:${minutes}`;
        }
    }

    /**
     * 앱 최소화
     */
    minimizeApp() {
        const smartphone = document.getElementById('smartphone-frame');
        smartphone.style.transform = 'translateY(600px)';
        setTimeout(() => {
            smartphone.style.transform = '';
        }, 300);
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    const app = new PrimeFireworksApp();
    window.primeApp = app; // 디버깅용
});
