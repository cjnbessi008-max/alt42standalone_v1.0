/**
 * Step Simplifier App
 * Main application logic
 */

class StepSimplifierApp {
    constructor() {
        this.currentUser = null;
        this.currentProblem = null;
        this.currentStep = 1;
        this.totalSteps = 0;
        this.steps = [];
        this.attempts = [];
        this.startTime = null;
        this.stepStartTime = null;

        this.init();
    }

    /**
     * Initialize app
     */
    async init() {
        logger.log('Initializing Step Simplifier App...');

        try {
            // Get or create user
            await this.initUser();

            // Load problem
            await this.loadProblem(CONFIG.DEFAULT_PROBLEM_ID);

            // Hide loading screen
            this.hideLoading();

        } catch (error) {
            logger.error('Initialization error:', error);
            alert('앱을 초기화하는 중 오류가 발생했습니다: ' + error.message);
        }
    }

    /**
     * Initialize user
     */
    async initUser() {
        try {
            // Get user from Moodle or use default
            if (CONFIG.MOODLE_INTEGRATION) {
                const urlParams = new URLSearchParams(window.location.search);
                const moodleUserId = urlParams.get('user_id');

                if (moodleUserId) {
                    this.currentUser = await api.createUser(
                        moodleUserId,
                        `student_${moodleUserId}`,
                        null
                    );
                } else {
                    this.currentUser = CONFIG.DEFAULT_USER;
                }
            } else {
                this.currentUser = CONFIG.DEFAULT_USER;
            }

            logger.log('User initialized:', this.currentUser);
        } catch (error) {
            logger.error('User initialization error:', error);
            this.currentUser = CONFIG.DEFAULT_USER;
        }
    }

    /**
     * Load problem
     */
    async loadProblem(problemId) {
        try {
            logger.log('Loading problem:', problemId);

            // Get problem details
            this.currentProblem = await api.getProblem(problemId);

            // Get steps
            this.steps = await api.getProblemSteps(problemId);
            this.totalSteps = this.steps.length;

            // Start problem for user
            await api.startProblem(this.currentUser.id, problemId);

            // Reset state
            this.currentStep = 1;
            this.attempts = [];
            this.startTime = Date.now();
            this.stepStartTime = Date.now();

            // Update UI
            this.updateProblemDisplay();
            this.updateStepDisplay();

        } catch (error) {
            logger.error('Error loading problem:', error);
            throw error;
        }
    }

    /**
     * Update problem display
     */
    updateProblemDisplay() {
        const problemView = document.getElementById('problem-view');
        problemView.classList.remove('hidden');

        // Update problem info
        document.getElementById('problem-number').textContent = this.currentProblem.id;
        document.getElementById('equation-text').textContent = this.currentProblem.equation_text;

        // Update difficulty badge
        const difficultyBadge = document.getElementById('difficulty-badge');
        difficultyBadge.textContent = this.currentProblem.difficulty_level;
        difficultyBadge.className = `difficulty-badge ${this.currentProblem.difficulty_level}`;

        // Update progress
        this.updateProgress();
    }

    /**
     * Update step display
     */
    updateStepDisplay() {
        const step = this.steps[this.currentStep - 1];

        if (!step) return;

        // Update step info
        document.getElementById('step-description').textContent = step.step_description;
        document.getElementById('step-equation-text').textContent = step.step_equation;
        document.getElementById('hint-text').textContent = step.hint_text;

        // Clear previous answer
        document.getElementById('user-answer').value = '';

        // Hide feedback
        this.hideFeedback();

        // Update navigation buttons
        this.updateNavigationButtons();

        // Reset step timer
        this.stepStartTime = Date.now();
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        document.getElementById('current-step').textContent = this.currentStep;
        document.getElementById('total-steps').textContent = this.totalSteps;

        const progress = (this.currentStep / this.totalSteps) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;

        // Update score
        this.updateScore();
    }

    /**
     * Update score
     */
    updateScore() {
        const correctAttempts = this.attempts.filter(a => a.is_correct).length;
        const totalAttempts = this.attempts.length;
        const score = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

        document.getElementById('score').textContent = score;
    }

    /**
     * Submit answer
     */
    async submitAnswer() {
        const userAnswer = document.getElementById('user-answer').value.trim();

        if (!userAnswer) {
            alert('답을 입력해주세요!');
            return;
        }

        try {
            // Calculate time spent
            const timeSpent = Math.floor((Date.now() - this.stepStartTime) / 1000);

            // Submit to API
            const result = await api.submitAnswer(
                this.currentUser.id,
                this.currentProblem.id,
                this.currentStep,
                userAnswer,
                timeSpent
            );

            // Record attempt
            this.attempts.push({
                step_number: this.currentStep,
                user_answer: userAnswer,
                is_correct: result.is_correct,
                time_spent: timeSpent
            });

            // Update attempts display
            this.updateAttemptsDisplay();

            // Show feedback
            this.showFeedback(result.is_correct, result.message);

            // If correct, move to next step
            if (result.is_correct) {
                setTimeout(() => {
                    if (result.completed) {
                        this.showCompletionScreen();
                    } else {
                        this.nextStep();
                    }
                }, CONFIG.FEEDBACK_DISPLAY_TIME);
            }

            // Update score
            this.updateScore();

        } catch (error) {
            logger.error('Error submitting answer:', error);
            alert('답을 제출하는 중 오류가 발생했습니다.');
        }
    }

    /**
     * Next step
     */
    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateProgress();
            this.updateStepDisplay();
        }
    }

    /**
     * Previous step
     */
    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateProgress();
            this.updateStepDisplay();
        }
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const prevButton = document.getElementById('prev-button');
        const nextButton = document.getElementById('next-button');

        prevButton.disabled = this.currentStep === 1;
        nextButton.disabled = this.currentStep === this.totalSteps;
    }

    /**
     * Show feedback
     */
    showFeedback(isCorrect, message) {
        const feedbackEl = document.getElementById('feedback-message');
        const feedbackText = document.getElementById('feedback-text');
        const icon = feedbackEl.querySelector('i');

        feedbackEl.classList.remove('hidden', 'correct', 'incorrect');
        feedbackEl.classList.add(isCorrect ? 'correct' : 'incorrect');

        icon.className = isCorrect ? 'fas fa-check-circle' : 'fas fa-times-circle';
        feedbackText.textContent = message;
    }

    /**
     * Hide feedback
     */
    hideFeedback() {
        const feedbackEl = document.getElementById('feedback-message');
        feedbackEl.classList.add('hidden');
    }

    /**
     * Update attempts display
     */
    updateAttemptsDisplay() {
        const attemptsList = document.getElementById('attempts-list');

        if (this.attempts.length === 0) {
            attemptsList.innerHTML = '<p class="no-attempts">아직 시도가 없습니다</p>';
            return;
        }

        const html = this.attempts.map(attempt => `
            <div class="attempt-item ${attempt.is_correct ? 'correct' : 'incorrect'}">
                <i class="fas fa-${attempt.is_correct ? 'check' : 'times'}"></i>
                <span>단계 ${attempt.step_number}: ${attempt.user_answer}</span>
                <span style="margin-left: auto; font-size: 12px;">${attempt.time_spent}초</span>
            </div>
        `).reverse().join('');

        attemptsList.innerHTML = html;
    }

    /**
     * Show completion screen
     */
    showCompletionScreen() {
        document.getElementById('problem-view').classList.add('hidden');
        document.getElementById('completion-screen').classList.remove('hidden');

        // Calculate stats
        const correctAttempts = this.attempts.filter(a => a.is_correct).length;
        const wrongAttempts = this.attempts.length - correctAttempts;
        const totalTime = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(totalTime / 60);
        const seconds = totalTime % 60;
        const score = Math.round((correctAttempts / this.attempts.length) * 100);

        // Update display
        document.getElementById('final-score').textContent = score;
        document.getElementById('correct-attempts').textContent = correctAttempts;
        document.getElementById('wrong-attempts').textContent = wrongAttempts;
        document.getElementById('total-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Load new problem
     */
    async loadNewProblem() {
        document.getElementById('completion-screen').classList.add('hidden');
        this.showLoading();

        // Load next problem (for demo, just reload same problem)
        await this.loadProblem(CONFIG.DEFAULT_PROBLEM_ID);

        this.hideLoading();
    }

    /**
     * Show loading screen
     */
    showLoading() {
        document.getElementById('loading-screen').classList.remove('hidden');
        document.getElementById('problem-view').classList.add('hidden');
        document.getElementById('completion-screen').classList.add('hidden');
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        document.getElementById('loading-screen').classList.add('hidden');
    }
}

// Global functions for HTML onclick handlers
function submitAnswer() {
    app.submitAnswer();
}

function nextStep() {
    app.nextStep();
}

function previousStep() {
    app.previousStep();
}

function toggleHint() {
    const hintBox = document.getElementById('hint-box');
    hintBox.classList.toggle('hidden');
}

function loadNewProblem() {
    app.loadNewProblem();
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new StepSimplifierApp();
});
