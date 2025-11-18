/**
 * Main Application Module
 * Coordinates the Step Derivative app
 */

const App = {
    config: null,
    problem: null,
    steps: [],
    currentStepIndex: 0,
    attemptId: null,
    startTime: null,
    timeSpent: 0,

    /**
     * Initialize application
     */
    async init() {
        console.log('Initializing Step Derivative App...');

        // Get configuration
        this.config = window.STEP_DERIVATIVE_CONFIG;

        // Initialize modules
        API.init(this.config);
        UI.init();

        // Set up event listeners
        this.setupEventListeners();

        // Load problem
        await this.loadProblem();
    },

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Navigation buttons
        UI.elements.prevStepBtn.addEventListener('click', () => this.previousStep());
        UI.elements.nextStepBtn.addEventListener('click', () => this.nextStep());

        // Retry and restart buttons
        UI.elements.retryBtn.addEventListener('click', () => this.loadProblem());
        UI.elements.restartBtn.addEventListener('click', () => this.restart());

        // Back button
        document.getElementById('back-btn').addEventListener('click', () => this.goBack());

        // Menu button
        document.getElementById('menu-btn').addEventListener('click', () => this.showMenu());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousStep();
            } else if (e.key === 'ArrowRight') {
                this.nextStep();
            }
        });
    },

    /**
     * Load problem from backend
     */
    async loadProblem() {
        try {
            UI.showLoading();

            // Check if problem ID is provided
            if (!this.config.problemId) {
                // For demo purposes, create a sample problem
                console.log('No problem ID provided, creating demo problem...');
                await this.createDemoProblem();
            }

            // Fetch problem
            const problemData = await API.getProblem(this.config.problemId);
            this.problem = problemData.problem;

            // Fetch solution steps
            const solutionData = await API.getSolution(this.config.problemId);
            this.steps = solutionData.steps;

            // Start attempt
            const attemptData = await API.startAttempt(
                this.config.moodleUserId,
                this.config.problemId
            );
            this.attemptId = attemptData.attempt_id;
            this.config.sessionToken = attemptData.session_token;

            // Start timer
            this.startTime = Date.now();
            this.startTimer();

            // Show problem
            UI.showProblem(this.problem);

            // Auto-advance to steps after 2 seconds
            setTimeout(() => {
                this.showSteps();
            }, 2000);

        } catch (error) {
            console.error('Failed to load problem:', error);
            UI.showError('문제를 불러오는데 실패했습니다. 다시 시도해주세요.');
        }
    },

    /**
     * Create demo problem (for testing without backend)
     */
    async createDemoProblem() {
        try {
            const demoExpression = '3*x^2 + 2*x + 5';
            const result = await API.createProblem(
                demoExpression,
                1, // course_id
                1, // quiz_id
                1, // question_id
                'basic'
            );

            this.config.problemId = result.problem_id;
            console.log('Created demo problem:', result);

        } catch (error) {
            console.error('Failed to create demo problem:', error);
            throw error;
        }
    },

    /**
     * Show steps
     */
    showSteps() {
        this.currentStepIndex = 0;
        UI.showSteps(this.steps, this.currentStepIndex);
    },

    /**
     * Go to next step
     */
    async nextStep() {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.currentStepIndex++;
            UI.showSteps(this.steps, this.currentStepIndex);

            // Update attempt
            await this.updateProgress();

            // Check if completed
            if (this.currentStepIndex === this.steps.length - 1) {
                setTimeout(() => {
                    this.completeAttempt();
                }, 1000);
            }
        }
    },

    /**
     * Go to previous step
     */
    async previousStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            UI.showSteps(this.steps, this.currentStepIndex);

            // Update attempt
            await this.updateProgress();
        }
    },

    /**
     * Update progress on backend
     */
    async updateProgress() {
        if (!this.attemptId) return;

        try {
            await API.updateAttempt(
                this.attemptId,
                this.currentStepIndex + 1,
                this.timeSpent,
                false
            );
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    },

    /**
     * Complete attempt
     */
    async completeAttempt() {
        if (!this.attemptId) return;

        try {
            // Stop timer
            this.stopTimer();

            // Update backend
            await API.updateAttempt(
                this.attemptId,
                this.steps.length,
                this.timeSpent,
                true
            );

            // Show completion screen
            UI.showCompletion(this.timeSpent, this.steps.length);

        } catch (error) {
            console.error('Failed to complete attempt:', error);
        }
    },

    /**
     * Restart problem
     */
    async restart() {
        this.currentStepIndex = 0;
        this.timeSpent = 0;
        this.startTime = Date.now();

        // Start new attempt
        try {
            const attemptData = await API.startAttempt(
                this.config.moodleUserId,
                this.config.problemId
            );
            this.attemptId = attemptData.attempt_id;

            this.showSteps();
        } catch (error) {
            console.error('Failed to restart:', error);
            UI.showError('재시작에 실패했습니다.');
        }
    },

    /**
     * Go back (to problem or previous screen)
     */
    goBack() {
        if (this.currentStepIndex > 0 || UI.elements.stepsSection.classList.contains('hidden')) {
            // Go back to problem view
            UI.showProblem(this.problem);
        } else {
            // Ask user if they want to exit
            if (confirm('학습을 종료하시겠습니까?')) {
                // In Moodle context, this would close the window or return to LMS
                window.close();
            }
        }
    },

    /**
     * Show menu
     */
    showMenu() {
        // Simple menu implementation
        const menuOptions = [
            '문제로 돌아가기',
            '처음부터 다시 시작',
            '도움말',
            '닫기'
        ];

        // In a real implementation, this would show a modal
        const choice = prompt(menuOptions.join('\n') + '\n\n번호를 선택하세요 (1-4):');

        switch (choice) {
            case '1':
                UI.showProblem(this.problem);
                break;
            case '2':
                this.restart();
                break;
            case '3':
                alert('Step Derivative는 복잡한 미분을 단계별로 보여주는 학습 도구입니다.\n\n화살표 버튼이나 키보드 방향키로 단계를 이동할 수 있습니다.');
                break;
        }
    },

    /**
     * Start timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        }, 1000);
    },

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for debugging
window.App = App;
