/**
 * Explosion Count Main Controller
 * 앱의 메인 로직 및 상태 관리
 */

class ExplosionCountApp {
    constructor() {
        this.currentProblem = null;
        this.currentSteps = [];
        this.currentStep = 0;
        this.currentCount = 1;
        this.sessionId = null;
        this.isRunning = false;

        // DOM 요소
        this.elements = {
            problemList: document.getElementById('problem-list'),
            problemTitle: document.getElementById('problem-title'),
            problemDescription: document.getElementById('problem-description'),
            currentCountDisplay: document.getElementById('current-count-display'),
            maxCountDisplay: document.getElementById('max-count-display'),
            currentStepDisplay: document.getElementById('current-step-display'),
            explosionCount: document.getElementById('explosion-count'),
            stepsList: document.getElementById('steps-list'),
            startBtn: document.getElementById('start-btn'),
            nextBtn: document.getElementById('next-btn'),
            resetBtn: document.getElementById('reset-btn'),
            appStatusText: document.getElementById('app-status-text'),
            stepName: document.getElementById('step-name'),
            stepMultiplier: document.getElementById('step-multiplier'),
            progressFill: document.getElementById('progress-fill')
        };

        this.init();
    }

    /**
     * 초기화
     */
    async init() {
        try {
            // 문제 목록 로드
            await this.loadProblems();

            // 이벤트 리스너 등록
            this.setupEventListeners();

            console.log('Explosion Count App initialized');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('앱 초기화 중 오류가 발생했습니다.');
        }
    }

    /**
     * 문제 목록 로드
     */
    async loadProblems() {
        try {
            const data = await api.getProblems();
            this.renderProblems(data.problems);
        } catch (error) {
            console.error('Failed to load problems:', error);
            this.showError('문제 목록을 불러오는데 실패했습니다.');
        }
    }

    /**
     * 문제 목록 렌더링
     */
    renderProblems(problems) {
        this.elements.problemList.innerHTML = '';

        problems.forEach(problem => {
            const card = document.createElement('div');
            card.className = 'problem-card';
            card.dataset.problemId = problem.id;
            card.innerHTML = `
                <h4>${problem.title}</h4>
                <p>${problem.description || ''}</p>
            `;

            card.addEventListener('click', () => this.selectProblem(problem.id));
            this.elements.problemList.appendChild(card);
        });
    }

    /**
     * 문제 선택
     */
    async selectProblem(problemId) {
        try {
            // 문제 정보 가져오기
            const problemData = await api.getProblem(problemId);
            this.currentProblem = problemData.problem;

            // 단계 정보 가져오기
            const stepsData = await api.getSteps(problemId);
            this.currentSteps = stepsData.steps;

            // 애니메이션 설정 가져오기
            const animData = await api.getAnimationConfig(problemId);
            if (explosionAnim && animData.animation) {
                explosionAnim.setConfig({
                    type: animData.animation.animation_type,
                    colorScheme: animData.animation.color_scheme,
                    speed: parseFloat(animData.animation.speed),
                    intensity: parseFloat(animData.animation.intensity)
                });
            }

            // UI 업데이트
            this.updateProblemUI();
            this.renderSteps();

            // 문제 카드 활성화 표시
            document.querySelectorAll('.problem-card').forEach(card => {
                card.classList.remove('active');
            });
            document.querySelector(`[data-problem-id="${problemId}"]`)?.classList.add('active');

            // 버튼 활성화
            this.elements.startBtn.disabled = false;

            // 상태 초기화
            this.reset();

            console.log('Problem selected:', this.currentProblem.title);
        } catch (error) {
            console.error('Failed to select problem:', error);
            this.showError('문제를 선택하는데 실패했습니다.');
        }
    }

    /**
     * 문제 정보 UI 업데이트
     */
    updateProblemUI() {
        this.elements.problemTitle.textContent = this.currentProblem.title;
        this.elements.problemDescription.textContent = this.currentProblem.description || '';
        this.elements.maxCountDisplay.textContent = this.currentProblem.max_count || '?';
    }

    /**
     * 단계 목록 렌더링
     */
    renderSteps() {
        this.elements.stepsList.innerHTML = '';

        this.currentSteps.forEach((step, index) => {
            const stepItem = document.createElement('div');
            stepItem.className = 'step-item';
            stepItem.dataset.stepIndex = index;
            stepItem.innerHTML = `
                <div class="step-item-header">
                    <span class="step-item-name">${step.step_number}. ${step.step_name}</span>
                    <span class="step-item-multiplier">×${step.multiplier}</span>
                </div>
                <div class="step-item-desc">${step.description || ''}</div>
            `;

            this.elements.stepsList.appendChild(stepItem);
        });
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.nextBtn.addEventListener('click', () => this.nextStep());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
    }

    /**
     * 시작
     */
    async start() {
        if (!this.currentProblem) {
            this.showError('먼저 문제를 선택해주세요.');
            return;
        }

        try {
            // 세션 생성
            const sessionData = await api.createSession(this.currentProblem.id);
            this.sessionId = sessionData.session_id;

            this.isRunning = true;
            this.currentStep = 0;
            this.currentCount = this.currentProblem.initial_count || 1;

            // UI 업데이트
            this.updateCountDisplay(this.currentCount);
            this.updateStatus('진행중', true);
            this.elements.startBtn.disabled = true;
            this.elements.nextBtn.disabled = false;
            this.elements.resetBtn.disabled = false;

            // 진행률 0%
            this.updateProgress(0);

            // 초기 애니메이션
            if (explosionAnim) {
                explosionAnim.clear();
                explosionAnim.startFireLoop();
            }

            console.log('Session started:', this.sessionId);
        } catch (error) {
            console.error('Failed to start:', error);
            this.showError('시작하는데 실패했습니다.');
        }
    }

    /**
     * 다음 단계
     */
    async nextStep() {
        if (!this.isRunning || this.currentStep >= this.currentSteps.length) {
            return;
        }

        const step = this.currentSteps[this.currentStep];
        const previousCount = this.currentCount;
        const newCount = step.count_increase;

        // 카운트 업데이트
        this.currentCount = newCount;
        this.animateCountChange(previousCount, newCount);

        // 애니메이션 효과
        if (explosionAnim) {
            explosionAnim.onCountIncrease(newCount, previousCount);
        }

        // 화면 진동 효과
        this.shakeScreen();

        // 단계 표시 업데이트
        this.updateStepDisplay(step);

        // 단계 아이템 활성화
        this.highlightStep(this.currentStep);

        // 진행률 업데이트
        const progress = ((this.currentStep + 1) / this.currentSteps.length) * 100;
        this.updateProgress(progress);

        // 세션 업데이트
        try {
            await api.updateSession(this.sessionId, {
                current_step: this.currentStep + 1,
                current_count: this.currentCount,
                max_count_reached: Math.max(this.currentCount, previousCount)
            });
        } catch (error) {
            console.error('Failed to update session:', error);
        }

        // 다음 단계로
        this.currentStep++;

        // 마지막 단계인지 확인
        if (this.currentStep >= this.currentSteps.length) {
            this.complete();
        }

        console.log(`Step ${this.currentStep}: ${previousCount} → ${newCount}`);
    }

    /**
     * 완료
     */
    async complete() {
        this.isRunning = false;
        this.elements.nextBtn.disabled = true;
        this.updateStatus('완료!', false);

        // 최종 폭발 효과
        if (explosionAnim) {
            explosionAnim.stopFireLoop();
            setTimeout(() => {
                explosionAnim.explode(this.currentCount);
            }, 500);
        }

        // 세션 완료 처리
        try {
            await api.updateSession(this.sessionId, {
                completed: true
            });
        } catch (error) {
            console.error('Failed to complete session:', error);
        }

        console.log('Completed! Final count:', this.currentCount);
    }

    /**
     * 초기화
     */
    reset() {
        this.isRunning = false;
        this.currentStep = 0;
        this.currentCount = this.currentProblem?.initial_count || 1;
        this.sessionId = null;

        // UI 초기화
        this.updateCountDisplay(this.currentCount);
        this.updateStatus('대기중', false);
        this.elements.currentStepDisplay.textContent = '0';
        this.elements.stepName.textContent = '시작 전';
        this.elements.stepMultiplier.textContent = '';
        this.updateProgress(0);

        // 버튼 상태
        this.elements.startBtn.disabled = !this.currentProblem;
        this.elements.nextBtn.disabled = true;
        this.elements.resetBtn.disabled = !this.currentProblem;

        // 단계 하이라이트 제거
        document.querySelectorAll('.step-item').forEach(item => {
            item.classList.remove('active', 'completed');
        });

        // 애니메이션 정리
        if (explosionAnim) {
            explosionAnim.clear();
            explosionAnim.stopFireLoop();
        }

        console.log('Reset');
    }

    /**
     * 카운트 표시 업데이트 (애니메이션)
     */
    updateCountDisplay(count) {
        this.elements.currentCountDisplay.textContent = count.toLocaleString();
        this.elements.explosionCount.textContent = count.toLocaleString();
        this.elements.currentStepDisplay.textContent = this.currentStep;

        // 애니메이션 클래스 추가
        this.elements.explosionCount.classList.add('animating');
        setTimeout(() => {
            this.elements.explosionCount.classList.remove('animating');
        }, 600);
    }

    /**
     * 카운트 변경 애니메이션
     */
    animateCountChange(from, to) {
        const duration = 1000; // 1초
        const steps = 30;
        const increment = (to - from) / steps;
        let current = from;
        let step = 0;

        const interval = setInterval(() => {
            current += increment;
            step++;

            if (step >= steps) {
                current = to;
                clearInterval(interval);
            }

            this.updateCountDisplay(Math.round(current));
        }, duration / steps);
    }

    /**
     * 단계 정보 업데이트
     */
    updateStepDisplay(step) {
        this.elements.stepName.textContent = step.step_name;
        this.elements.stepMultiplier.textContent = `×${step.multiplier}`;
    }

    /**
     * 단계 하이라이트
     */
    highlightStep(stepIndex) {
        document.querySelectorAll('.step-item').forEach((item, index) => {
            item.classList.remove('active');
            if (index < stepIndex) {
                item.classList.add('completed');
            } else if (index === stepIndex) {
                item.classList.add('active');
                // 스크롤
                item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                item.classList.remove('completed');
            }
        });
    }

    /**
     * 진행률 업데이트
     */
    updateProgress(percent) {
        this.elements.progressFill.style.width = `${percent}%`;
    }

    /**
     * 상태 표시 업데이트
     */
    updateStatus(text, isActive) {
        this.elements.appStatusText.textContent = text;
        const statusElement = this.elements.appStatusText.parentElement;

        if (isActive) {
            statusElement.classList.add('active');
        } else {
            statusElement.classList.remove('active');
        }
    }

    /**
     * 화면 진동 효과
     */
    shakeScreen() {
        const screen = document.querySelector('.smartphone-screen');
        screen.classList.add('shake');
        setTimeout(() => {
            screen.classList.remove('shake');
        }, 300);
    }

    /**
     * 에러 표시
     */
    showError(message) {
        alert(message); // 실제로는 더 나은 에러 UI를 사용
        console.error(message);
    }
}

// 앱 초기화
let app = null;

document.addEventListener('DOMContentLoaded', () => {
    app = new ExplosionCountApp();
});
