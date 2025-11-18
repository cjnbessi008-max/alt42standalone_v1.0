/**
 * Dot Product Heat - Main Application Logic
 * Handles API calls, UI updates, and user interactions
 */

class DotProductApp {
    constructor() {
        this.config = window.APP_CONFIG;
        this.visualization = null;
        this.currentProblem = null;
        this.startTime = null;

        this.init();
    }

    async init() {
        // Initialize visualization
        this.visualization = new DotProductHeat('vectorCanvas');

        // Load problem data
        await this.loadProblem();

        // Setup event listeners
        this.setupEventListeners();
    }

    /**
     * Load problem from API
     */
    async loadProblem() {
        try {
            const url = `${this.config.apiBase}/api/get_problem.php?id=${this.config.problemId}&user_id=${this.config.userId}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to load problem');
            }

            this.currentProblem = data.problem;
            this.renderProblem(data.problem);
            this.renderAttemptHistory(data.attempts);

            // Visualize vectors
            const result = this.visualization.setVectors(
                data.problem.vector1,
                data.problem.vector2
            );

            this.log('Problem loaded:', data.problem);
            this.log('Dot product:', result.dotProduct);

            // Start timer
            this.startTime = Date.now();

        } catch (error) {
            console.error('Error loading problem:', error);
            this.showError('문제를 불러오는데 실패했습니다: ' + error.message);
        }
    }

    /**
     * Render problem information
     */
    renderProblem(problem) {
        const problemSection = document.getElementById('problemSection');

        problemSection.innerHTML = `
            <h2>${problem.title}</h2>
            <p>${problem.description}</p>
            <div class="vector-display">
                <div class="vector-item">
                    <div class="label">벡터 v₁</div>
                    <div class="value">(${problem.vector1.x}, ${problem.vector1.y})</div>
                </div>
                <div class="vector-item">
                    <div class="label">벡터 v₂</div>
                    <div class="value">(${problem.vector2.x}, ${problem.vector2.y})</div>
                </div>
            </div>
            <div style="text-align: center; margin-top: 12px;">
                <span style="display: inline-block; padding: 6px 12px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #6b7280;">
                    난이도: <strong>${this.getDifficultyEmoji(problem.difficulty)} ${problem.difficulty}</strong>
                </span>
            </div>
        `;
    }

    /**
     * Get difficulty emoji
     */
    getDifficultyEmoji(difficulty) {
        const emojis = {
            'easy': '⭐',
            'medium': '⭐⭐',
            'hard': '⭐⭐⭐'
        };
        return emojis[difficulty] || '⭐';
    }

    /**
     * Render attempt history
     */
    renderAttemptHistory(attempts) {
        const attemptsList = document.getElementById('attemptsList');

        if (!attempts || attempts.length === 0) {
            attemptsList.innerHTML = '<p style="text-align: center; color: #9ca3af; font-size: 13px;">아직 시도한 기록이 없습니다</p>';
            return;
        }

        attemptsList.innerHTML = attempts.map((attempt, index) => `
            <div class="attempt-item ${attempt.isCorrect ? 'correct' : 'incorrect'}">
                <div class="attempt-info">
                    <div style="font-weight: 500;">
                        #${attempt.attemptNumber}: ${attempt.answer.toFixed(2)}
                        ${attempt.isCorrect ? '✓' : '✗'}
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                        ${this.formatTimestamp(attempt.timestamp)}
                        ${attempt.timeTaken ? ` · ${attempt.timeTaken}초` : ''}
                    </div>
                </div>
                <div
                    class="attempt-color"
                    style="background-color: ${attempt.heatColor};"
                    title="Heat: ${attempt.dotProduct.toFixed(2)}"
                ></div>
            </div>
        `).join('');
    }

    /**
     * Format timestamp
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`;

        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const submitBtn = document.getElementById('submitBtn');
        const answerInput = document.getElementById('answerInput');

        submitBtn.addEventListener('click', () => this.submitAnswer());

        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        // Clear feedback when user starts typing
        answerInput.addEventListener('input', () => {
            this.clearFeedback();
        });
    }

    /**
     * Submit answer
     */
    async submitAnswer() {
        const answerInput = document.getElementById('answerInput');
        const submitBtn = document.getElementById('submitBtn');
        const answer = parseFloat(answerInput.value);

        // Validation
        if (isNaN(answer)) {
            this.showError('올바른 숫자를 입력해주세요');
            return;
        }

        // Calculate time taken
        const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);

        // Disable button during submission
        submitBtn.disabled = true;
        submitBtn.textContent = '제출 중...';

        try {
            const url = `${this.config.apiBase}/api/submit_answer.php`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    problem_id: this.config.problemId,
                    user_id: this.config.userId,
                    answer: answer,
                    time_taken: timeTaken
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to submit answer');
            }

            this.log('Answer submitted:', data);

            // Update visualization with result
            this.updateVisualizationWithResult(data.result);

            // Show feedback
            if (data.result.isCorrect) {
                this.showSuccess(data.feedback);
                this.celebrate();
            } else {
                this.showError(data.feedback);
            }

            // Reload problem to get updated attempts
            setTimeout(() => {
                this.loadProblem();
                answerInput.value = '';
            }, 2000);

        } catch (error) {
            console.error('Error submitting answer:', error);
            this.showError('답안 제출에 실패했습니다: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '제출하기';
        }
    }

    /**
     * Update visualization with submission result
     */
    updateVisualizationWithResult(result) {
        // Animate heat color change
        const heatIndicator = document.getElementById('heatIndicator');
        if (heatIndicator) {
            heatIndicator.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                heatIndicator.style.animation = '';
            }, 500);
        }

        // Update heat bar
        if (this.visualization) {
            this.visualization.updateHeatBar(result.dotProduct);
        }

        this.log('Heat visualization updated:', {
            dotProduct: result.dotProduct,
            temperature: result.temperature,
            color: result.heatColor
        });
    }

    /**
     * Show success feedback
     */
    showSuccess(message) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = 'feedback success';
    }

    /**
     * Show error feedback
     */
    showError(message) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = 'feedback error';
    }

    /**
     * Clear feedback
     */
    clearFeedback() {
        const feedback = document.getElementById('feedback');
        feedback.textContent = '';
        feedback.className = 'feedback';
    }

    /**
     * Celebration animation for correct answer
     */
    celebrate() {
        // Create confetti effect
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd'];
        const confettiCount = 30;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                this.createConfetti(colors[Math.floor(Math.random() * colors.length)]);
            }, i * 30);
        }
    }

    /**
     * Create single confetti piece
     */
    createConfetti(color) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = color;
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.transition = 'all 1s ease-in';

        document.body.appendChild(confetti);

        setTimeout(() => {
            confetti.style.top = window.innerHeight + 'px';
            confetti.style.opacity = '0';
        }, 10);

        setTimeout(() => {
            confetti.remove();
        }, 1000);
    }

    /**
     * Console log helper (only in debug mode)
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[DotProductApp]', ...args);
        }
    }
}

// Add pulse animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dotProductApp = new DotProductApp();
    });
} else {
    window.dotProductApp = new DotProductApp();
}
