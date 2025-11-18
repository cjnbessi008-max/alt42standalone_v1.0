/**
 * Slope Sense - Main Application
 * 100% Client-side, No Server Required
 */

import { DataManager } from './modules/DataManager.js';
import { AnimationEngine } from './modules/AnimationEngine.js';
import { UIManager } from './modules/UIManager.js';

class SlopeSenseApp {
    constructor() {
        this.dataManager = new DataManager();
        this.uiManager = new UIManager();
        this.animationEngine = null;

        this.currentProblem = null;
        this.startTime = null;
        this.hintsUsed = 0;
        this.speed = 1.0;
        this.animationType = 'ball_roll';

        this.init();
    }

    async init() {
        try {
            // Load problems
            await this.dataManager.loadProblems();

            // Hide loading, show app
            this.uiManager.hideLoading();

            // Load current problem
            await this.loadCurrentProblem();

            // Setup global event listeners
            this.setupGlobalListeners();

        } catch (error) {
            console.error('Initialization error:', error);
            this.uiManager.showError('앱을 초기화하는 중 오류가 발생했습니다.');
        }
    }

    async loadCurrentProblem() {
        this.currentProblem = this.dataManager.getCurrentProblem();

        if (!this.currentProblem) {
            // All problems completed
            this.showCompletion();
            return;
        }

        // Reset state
        this.startTime = Date.now();
        this.hintsUsed = 0;

        // Update UI
        this.updateStats();
        this.updateProgress();

        const problems = this.dataManager.getAllProblems();
        const currentIndex = this.dataManager.userData.currentProblemIndex;

        this.uiManager.renderProblem(this.currentProblem, currentIndex, problems.length);
        this.uiManager.renderControls(this.speed, this.currentProblem.animation);

        // Initialize animation engine
        await this.initAnimationEngine();

        // Setup problem-specific event listeners
        this.setupProblemListeners();

        // Focus input
        this.uiManager.enableInput();
    }

    async initAnimationEngine() {
        // Destroy previous instance
        if (this.animationEngine) {
            this.animationEngine.destroy();
        }

        // Wait for canvas to be in DOM
        await new Promise(resolve => setTimeout(resolve, 50));

        // Create new instance
        this.animationEngine = new AnimationEngine('slopeCanvas');

        // Set problem data
        this.animationEngine.setProblem(
            this.currentProblem.point1,
            this.currentProblem.point2
        );

        // Set animation type from problem
        this.animationType = this.currentProblem.animation || 'ball_roll';
        this.animationEngine.setAnimationType(this.animationType);
        this.animationEngine.setSpeed(this.speed);

        // Start animation
        this.animationEngine.play();
    }

    setupProblemListeners() {
        // Submit button
        const submitBtn = document.getElementById('submitBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleSubmit());
        }

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.handleReset());
        }

        // Hint button
        const hintBtn = document.getElementById('hintBtn');
        if (hintBtn) {
            hintBtn.addEventListener('click', () => this.handleHint());
        }

        // Play button
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.animationEngine.play());
        }

        // Pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.animationEngine.pause());
        }

        // Speed slider
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => this.handleSpeedChange(e));
        }

        // Animation select
        const animationSelect = document.getElementById('animationSelect');
        if (animationSelect) {
            animationSelect.addEventListener('change', (e) => this.handleAnimationChange(e));
        }
    }

    setupGlobalListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.animationEngine) {
                this.animationEngine.setupCanvas();
                this.animationEngine.render();
            }
        });

        // Prevent accidental page close
        window.addEventListener('beforeunload', (e) => {
            if (this.dataManager.userData.stats.totalAttempts > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    handleSubmit() {
        const userAnswer = this.uiManager.getInputValue();

        if (userAnswer === null || isNaN(userAnswer)) {
            this.uiManager.showFeedback(false, '⚠️ 답을 입력해주세요!');
            return;
        }

        const isCorrect = this.dataManager.checkAnswer(this.currentProblem.id, userAnswer);
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        // Record attempt
        this.dataManager.recordAttempt(
            this.currentProblem.id,
            userAnswer,
            isCorrect,
            timeSpent,
            this.hintsUsed
        );

        // Update stats
        this.updateStats();

        if (isCorrect) {
            this.handleCorrectAnswer();
        } else {
            this.handleIncorrectAnswer(userAnswer);
        }
    }

    handleCorrectAnswer() {
        const message = `🎉 정답입니다! 기울기는 ${this.currentProblem.answer}입니다.`;
        this.uiManager.showFeedback(true, message, this.currentProblem.explanation);

        // Disable input
        this.uiManager.disableInput();

        // Show next button
        this.uiManager.showNextButton(() => this.handleNext());

        // Add celebration effect
        this.animationEngine.pause();
        setTimeout(() => {
            this.animationEngine.play();
        }, 1000);
    }

    handleIncorrectAnswer(userAnswer) {
        const correctAnswer = this.currentProblem.answer;
        const diff = Math.abs(userAnswer - correctAnswer);
        let hint = '';

        if (diff < 0.5) {
            hint = '아주 가까워요! 조금만 더 정확하게 계산해보세요.';
        } else if (userAnswer > correctAnswer) {
            hint = '답이 너무 큽니다. 더 작은 값을 시도해보세요.';
        } else {
            hint = '답이 너무 작습니다. 더 큰 값을 시도해보세요.';
        }

        this.uiManager.showFeedback(false, `❌ 틀렸습니다. ${hint}`);

        // Clear input for retry
        setTimeout(() => {
            this.uiManager.clearInput();
            this.uiManager.hideFeedback();
            this.uiManager.enableInput();
        }, 2000);
    }

    handleReset() {
        this.animationEngine.reset();
        this.animationEngine.play();
        this.uiManager.hideFeedback();
        this.uiManager.hideNextButton();
        this.uiManager.clearInput();
        this.uiManager.enableInput();
    }

    handleHint() {
        if (!this.uiManager.currentHintShown) {
            this.hintsUsed++;
        }
        this.uiManager.showHint();
    }

    handleNext() {
        const nextProblem = this.dataManager.nextProblem();

        if (nextProblem) {
            this.loadCurrentProblem();
        } else {
            this.showCompletion();
        }
    }

    handleSpeedChange(e) {
        this.speed = parseFloat(e.target.value);
        this.animationEngine.setSpeed(this.speed);

        const speedValue = document.getElementById('speedValue');
        if (speedValue) {
            speedValue.textContent = `${this.speed.toFixed(1)}x`;
        }

        // Save to settings
        this.dataManager.updateSettings({ animationSpeed: this.speed });
    }

    handleAnimationChange(e) {
        this.animationType = e.target.value;
        this.animationEngine.setAnimationType(this.animationType);
    }

    updateStats() {
        const stats = this.dataManager.getStats();
        this.uiManager.updateStats(stats);
    }

    updateProgress() {
        const currentIndex = this.dataManager.userData.currentProblemIndex;
        const totalProblems = this.dataManager.getAllProblems().length;
        this.uiManager.updateProgress(currentIndex + 1, totalProblems);
    }

    showCompletion() {
        const stats = this.dataManager.getStats();
        this.uiManager.showCompletionScreen(stats);

        // Setup completion screen buttons
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                if (this.dataManager.resetProgress()) {
                    location.reload();
                }
            });
        }

        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.dataManager.exportData();
            });
        }

        // Stop animation
        if (this.animationEngine) {
            this.animationEngine.pause();
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.slopeSenseApp = new SlopeSenseApp();
    });
} else {
    window.slopeSenseApp = new SlopeSenseApp();
}

export default SlopeSenseApp;
