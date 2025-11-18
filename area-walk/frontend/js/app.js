/**
 * Area Walk App
 * 메인 애플리케이션 로직
 */

class AreaWalkApp {
    constructor(problemId, userId) {
        this.problemId = problemId;
        this.userId = userId;

        // 컴포넌트 초기화
        this.api = new APIClient();
        this.renderer = null; // Canvas 로드 후 초기화
        this.animator = null;

        // 상태
        this.problemData = null;
        this.attemptCount = 0;
        this.hintCount = 0;
        this.startTime = null;
        this.timerInterval = null;

        // 세션 데이터
        this.sessionData = {
            interactions: 0,
            replays: 0,
            hintsViewed: [],
            inputHistory: [],
            timeSpent: 0,
            hintUsed: false
        };

        // DOM 요소
        this.elements = {};
    }

    /**
     * 앱 초기화
     */
    async init() {
        logger.log('Initializing Area Walk App...');

        try {
            // DOM 요소 캐싱
            this.cacheElements();

            // 이벤트 리스너 등록
            this.attachEventListeners();

            // 문제 로드
            await this.loadProblem();

            // Canvas 초기화
            this.initRenderer();

            // UI 표시
            this.showAppScreen();

            // 타이머 시작
            if (CONFIG.AUTO_START_TIMER) {
                this.startTimer();
            }

            logger.log('App initialized successfully');
        } catch (error) {
            logger.error('Initialization failed:', error);
            this.showError('앱을 초기화하는 중 오류가 발생했습니다.');
        }
    }

    /**
     * DOM 요소 캐싱
     */
    cacheElements() {
        this.elements = {
            // 화면
            loadingScreen: $('#loading-screen'),
            appScreen: $('#app-screen'),
            resultScreen: $('#result-screen'),

            // 문제 정보
            problemTitle: $('#problem-title'),
            functionLatex: $('#function-latex'),
            lowerBound: $('#lower-bound'),
            upperBound: $('#upper-bound'),

            // Canvas
            canvas: $('#integral-canvas'),

            // 컨트롤
            replayBtn: $('#replay-btn'),
            zoomBtn: $('#zoom-btn'),
            hintBtn: $('#hint-btn'),
            hintDisplay: $('#hint-display'),
            hintText: $('#hint-text'),
            answerInput: $('#answer-input'),
            submitBtn: $('#submit-btn'),

            // 상태 표시
            attemptCount: $('#attempt-count'),
            maxAttempts: $('#max-attempts'),
            timer: $('#timer'),
            timerDisplay: $('#timer-display'),

            // 피드백
            feedbackSection: $('#feedback-section'),
            feedbackMessage: $('#feedback-message'),
            scoreDisplay: $('#score-display'),

            // 결과 화면
            resultTitle: $('#result-title'),
            finalScore: $('#final-score'),
            totalAttempts: $('#total-attempts'),
            totalTime: $('#total-time'),
            nextProblemBtn: $('#next-problem-btn'),
            reviewBtn: $('#review-btn'),

            // 스마트폰 컨트롤
            minimizeBtn: $('#minimize-btn'),
            closeBtn: $('#close-btn'),
            smartphoneContainer: $('#smartphone-container')
        };
    }

    /**
     * 이벤트 리스너 등록
     */
    attachEventListeners() {
        // 재생 버튼
        this.elements.replayBtn.on('click', () => this.replay());

        // 힌트 버튼
        this.elements.hintBtn.on('click', () => this.showHint());

        // 제출 버튼
        this.elements.submitBtn.on('click', () => this.submitAnswer());

        // Enter 키로 제출
        this.elements.answerInput.on('keypress', (e) => {
            if (e.which === 13) {
                this.submitAnswer();
            }
        });

        // 입력 추적
        this.elements.answerInput.on('input', () => {
            this.sessionData.interactions++;
        });

        // 결과 화면 버튼
        this.elements.nextProblemBtn.on('click', () => this.loadNextProblem());
        this.elements.reviewBtn.on('click', () => this.reviewProblem());

        // 스마트폰 컨트롤
        this.elements.minimizeBtn.on('click', () => this.toggleMinimize());
        this.elements.closeBtn.on('click', () => this.close());
    }

    /**
     * 문제 로드
     */
    async loadProblem() {
        try {
            const response = await this.api.getProblem(this.problemId);

            if (!response.success) {
                throw new Error(response.error || 'Failed to load problem');
            }

            this.problemData = response.data;
            logger.log('Problem loaded:', this.problemData);

            // UI 업데이트
            this.updateProblemUI();

        } catch (error) {
            logger.error('Failed to load problem:', error);
            throw error;
        }
    }

    /**
     * 문제 UI 업데이트
     */
    updateProblemUI() {
        this.elements.problemTitle.text(this.problemData.title);
        this.elements.lowerBound.text(this.problemData.function.lower_bound);
        this.elements.upperBound.text(this.problemData.function.upper_bound);

        // 최대 시도 횟수
        const maxAttempts = this.problemData.settings.max_attempts;
        this.elements.maxAttempts.text(maxAttempts > 0 ? maxAttempts : '∞');

        // MathJax 렌더링
        this.elements.functionLatex.html(`\\(${this.problemData.function.latex}\\)`);
        if (window.MathJax) {
            MathJax.typesetPromise([this.elements.functionLatex[0]]);
        }
    }

    /**
     * Canvas 렌더러 초기화
     */
    initRenderer() {
        this.renderer = new GraphRenderer('integral-canvas');
        this.animator = new CharacterAnimator(this.renderer);

        // 초기 렌더링
        this.renderer.render(this.problemData);
    }

    /**
     * 앱 화면 표시
     */
    showAppScreen() {
        this.elements.loadingScreen.fadeOut();
        this.elements.appScreen.fadeIn();

        if (this.problemData.settings.time_limit_seconds > 0) {
            this.elements.timerDisplay.show();
        }
    }

    /**
     * 타이머 시작
     */
    startTimer() {
        this.startTime = Date.now();

        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;

            this.elements.timer.text(
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );

            // 제한 시간 체크
            const timeLimit = this.problemData.settings.time_limit_seconds;
            if (timeLimit > 0 && elapsed >= timeLimit) {
                this.stopTimer();
                this.showError('시간이 초과되었습니다.');
                this.disableInput();
            }
        }, 1000);
    }

    /**
     * 타이머 중지
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (this.startTime) {
            this.sessionData.timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        }
    }

    /**
     * 재생 (애니메이션 다시 보기)
     */
    replay() {
        logger.log('Replaying animation');

        this.sessionData.replays++;

        this.animator.animateFillArea(
            this.problemData,
            this.problemData.function.lower_bound,
            this.problemData.function.upper_bound,
            CONFIG.ANIMATION_DURATION
        );
    }

    /**
     * 힌트 표시
     */
    showHint() {
        if (this.hintCount >= this.problemData.hints.length) {
            this.showToast('더 이상 힌트가 없습니다.', 'warning');
            return;
        }

        const hint = this.problemData.hints[this.hintCount];
        this.hintCount++;

        this.elements.hintText.text(hint);
        this.elements.hintDisplay.slideDown();

        this.sessionData.hintUsed = true;
        this.sessionData.hintsViewed.push(`hint_${this.hintCount}`);

        logger.log(`Hint ${this.hintCount} shown:`, hint);
    }

    /**
     * 답안 제출
     */
    async submitAnswer() {
        const answerValue = this.elements.answerInput.val().trim();

        if (!answerValue) {
            this.showToast('답을 입력해주세요.', 'warning');
            return;
        }

        const answer = parseFloat(answerValue);

        if (isNaN(answer)) {
            this.showToast('올바른 숫자를 입력해주세요.', 'error');
            return;
        }

        // 입력 히스토리 저장
        this.sessionData.inputHistory.push(answer);

        // 버튼 비활성화
        this.elements.submitBtn.prop('disabled', true);
        this.elements.submitBtn.html('<i class="fas fa-spinner fa-spin"></i> 채점 중...');

        try {
            // 타이머 중지
            this.stopTimer();

            // API 호출
            const response = await this.api.submitAnswer(
                this.problemId,
                this.userId,
                answer,
                this.sessionData
            );

            if (!response.success) {
                throw new Error(response.error || 'Submission failed');
            }

            logger.log('Submission result:', response.data);

            // 시도 횟수 증가
            this.attemptCount++;
            this.elements.attemptCount.text(this.attemptCount);

            // 결과 처리
            await this.handleSubmissionResult(response.data);

        } catch (error) {
            logger.error('Submission error:', error);
            this.showError('답안 제출 중 오류가 발생했습니다.');

            // 버튼 다시 활성화
            this.elements.submitBtn.prop('disabled', false);
            this.elements.submitBtn.html('<i class="fas fa-check"></i> 제출');
        }
    }

    /**
     * 제출 결과 처리
     */
    async handleSubmissionResult(result) {
        // 피드백 표시
        this.showFeedback(result);

        // 애니메이션
        if (result.is_correct) {
            await this.playSuccessAnimation(result);
        } else {
            await this.playFailureAnimation(result);
        }

        // 완료 여부 확인
        if (result.is_correct) {
            setTimeout(() => {
                this.showResultScreen(result);
            }, 1500);
        } else {
            // 재시도 허용
            this.elements.submitBtn.prop('disabled', false);
            this.elements.submitBtn.html('<i class="fas fa-check"></i> 제출');

            // 타이머 재시작
            if (CONFIG.AUTO_START_TIMER && this.problemData.settings.time_limit_seconds === 0) {
                this.startTimer();
            }
        }
    }

    /**
     * 피드백 표시
     */
    showFeedback(result) {
        this.elements.feedbackMessage.text(result.feedback);
        this.elements.scoreDisplay.text(`점수: ${result.score.toFixed(0)}점`);

        this.elements.feedbackSection
            .removeClass('correct incorrect')
            .addClass(result.is_correct ? 'correct' : 'incorrect')
            .slideDown();
    }

    /**
     * 성공 애니메이션
     */
    playSuccessAnimation(result) {
        return new Promise((resolve) => {
            this.animator.animateSuccess(
                this.problemData,
                this.problemData.function.upper_bound,
                resolve
            );
        });
    }

    /**
     * 실패 애니메이션
     */
    playFailureAnimation(result) {
        return new Promise((resolve) => {
            this.animator.animateFailure(
                this.problemData,
                result.user_answer,
                resolve
            );
        });
    }

    /**
     * 결과 화면 표시
     */
    showResultScreen(result) {
        this.elements.appScreen.fadeOut(() => {
            this.elements.finalScore.text(result.score.toFixed(0));
            this.elements.totalAttempts.text(this.attemptCount);
            this.elements.totalTime.text(this.formatTime(this.sessionData.timeSpent));

            this.elements.resultScreen.fadeIn();
        });
    }

    /**
     * 다음 문제 로드
     */
    async loadNextProblem() {
        // 실제로는 Moodle에서 제어해야 하지만, 여기서는 간단히 새로고침
        window.location.reload();
    }

    /**
     * 복습하기
     */
    reviewProblem() {
        window.location.reload();
    }

    /**
     * 유틸리티 함수들
     */
    showToast(message, type = 'info') {
        const toast = $('<div>')
            .addClass(`toast ${type}`)
            .text(message)
            .appendTo('body');

        setTimeout(() => {
            toast.fadeOut(() => toast.remove());
        }, 3000);
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    disableInput() {
        this.elements.answerInput.prop('disabled', true);
        this.elements.submitBtn.prop('disabled', true);
    }

    toggleMinimize() {
        this.elements.smartphoneContainer.toggleClass('minimized');
    }

    close() {
        this.elements.smartphoneContainer.fadeOut();
    }
}
