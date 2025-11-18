/**
 * Main Application Controller
 * Coordinates UI, animations, and Moodle integration
 */

class App {
    constructor() {
        this.currentScore = 0;
        this.streak = 0;
        this.level = 1;
        this.activityHistory = [];

        // DOM elements
        this.elements = {
            username: document.getElementById('username'),
            totalScore: document.getElementById('total-score'),
            powerScore: document.getElementById('power-score'),
            streakCount: document.getElementById('streak-count'),
            levelDisplay: document.getElementById('level'),
            problemContent: document.getElementById('problem-content'),
            userAnswer: document.getElementById('user-answer'),
            submitBtn: document.getElementById('submit-btn'),
            feedbackArea: document.getElementById('feedback-area'),
            activityList: document.getElementById('activity-list')
        };

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('Initializing ALT42 Learning System...');

        // Initialize Moodle connection
        const initResult = await window.moodleAPI.initialize();

        if (initResult.success) {
            // Load user data
            const userData = await window.moodleAPI.getUserInfo();
            this.updateUserInfo(userData);

            // Load first problem
            await this.loadNextProblem();

            // Setup event listeners
            this.setupEventListeners();

            console.log('Application ready!');
        } else {
            this.showError('Failed to connect to LMS');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Submit button
        this.elements.submitBtn.addEventListener('click', () => this.handleSubmit());

        // Enter key in answer input
        this.elements.userAnswer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSubmit();
            }
        });

        // Window resize - update canvas
        window.addEventListener('resize', () => {
            if (window.powerChargeAnimation) {
                window.powerChargeAnimation.setupCanvas();
            }
        });
    }

    /**
     * Update user information display
     */
    updateUserInfo(userData) {
        this.elements.username.textContent = userData.name || 'Student';
        this.currentScore = userData.totalScore || 0;
        this.level = userData.level || 1;
        this.streak = userData.streak || 0;

        this.elements.totalScore.textContent = this.currentScore;
        this.elements.powerScore.textContent = this.currentScore;
        this.elements.levelDisplay.textContent = this.level;
        this.elements.streakCount.textContent = this.streak;
    }

    /**
     * Load next problem from Moodle
     */
    async loadNextProblem() {
        try {
            this.elements.problemContent.innerHTML = '<p class="loading">Loading next problem...</p>';
            this.elements.userAnswer.value = '';
            this.elements.userAnswer.disabled = true;
            this.elements.submitBtn.disabled = true;

            const problem = await window.moodleAPI.getNextProblem();

            if (problem) {
                this.displayProblem(problem);
                this.elements.userAnswer.disabled = false;
                this.elements.submitBtn.disabled = false;
                this.elements.userAnswer.focus();
            } else {
                this.elements.problemContent.innerHTML = '<p>No problems available.</p>';
            }
        } catch (error) {
            console.error('Error loading problem:', error);
            this.showError('Failed to load problem');
        }
    }

    /**
     * Display problem in UI
     */
    displayProblem(problem) {
        const difficultyStars = '⭐'.repeat(problem.difficulty || 1);

        this.elements.problemContent.innerHTML = `
            <div class="problem-header">
                <span class="difficulty">${difficultyStars}</span>
                <span class="points">+${problem.points} points</span>
            </div>
            <div class="problem-question">
                ${this.formatQuestion(problem.question)}
            </div>
        `;

        // Add CSS for problem display if not exists
        if (!document.getElementById('problem-display-style')) {
            const style = document.createElement('style');
            style.id = 'problem-display-style';
            style.textContent = `
                .problem-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 15px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #eee;
                }
                .difficulty {
                    font-size: 18px;
                }
                .points {
                    color: #4CAF50;
                    font-weight: bold;
                }
                .problem-question {
                    font-size: 20px;
                    line-height: 1.8;
                    color: #333;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Format question text (support for math notation, etc.)
     */
    formatQuestion(question) {
        // Replace fraction notation with better display
        return question.replace(/(\d+)\/(\d+)/g, '<span class="fraction"><sup>$1</sup>/<sub>$2</sub></span>');
    }

    /**
     * Handle answer submission
     */
    async handleSubmit() {
        const answer = this.elements.userAnswer.value.trim();

        if (!answer) {
            this.showFeedback('Please enter an answer', 'incorrect');
            return;
        }

        // Disable input during submission
        this.elements.userAnswer.disabled = true;
        this.elements.submitBtn.disabled = true;
        this.elements.submitBtn.textContent = 'Checking...';

        try {
            const result = await window.moodleAPI.submitAnswer(answer);
            await this.processSubmitResult(result);
        } catch (error) {
            console.error('Submit error:', error);
            this.showFeedback('Error submitting answer', 'incorrect');
        } finally {
            this.elements.submitBtn.textContent = 'Submit';
        }
    }

    /**
     * Process submission result
     */
    async processSubmitResult(result) {
        if (result.correct) {
            // Correct answer
            const oldScore = this.currentScore;
            this.currentScore += result.points;
            this.streak++;

            // Update displays
            this.elements.totalScore.textContent = this.currentScore;
            this.elements.streakCount.textContent = this.streak;

            // Trigger Power Charge animation
            window.powerChargeAnimation.charge(oldScore, this.currentScore, 1000);

            // Show feedback
            this.showFeedback(`✓ ${result.message}<br><strong>+${result.points} points!</strong>`, 'correct');

            // Add to activity log
            this.addActivity(`Correct answer`, result.points);

            // Check level up
            this.checkLevelUp();

            // Load next problem after delay
            setTimeout(() => {
                this.loadNextProblem();
                this.hideFeedback();
            }, 2000);

        } else {
            // Incorrect answer
            this.streak = 0;
            this.elements.streakCount.textContent = this.streak;

            // Show feedback
            this.showFeedback(
                `✗ ${result.message}<br>Correct answer: <strong>${result.correctAnswer}</strong>`,
                'incorrect'
            );

            // Add to activity log
            this.addActivity(`Incorrect answer`, 0, true);

            // Re-enable input for retry
            this.elements.userAnswer.disabled = false;
            this.elements.submitBtn.disabled = false;
            this.elements.userAnswer.select();
        }

        // Update progress in Moodle
        await window.moodleAPI.updateProgress({
            score: this.currentScore,
            level: this.level,
            streak: this.streak
        });
    }

    /**
     * Check if user should level up
     */
    checkLevelUp() {
        const requiredScore = this.level * 100;

        if (this.currentScore >= requiredScore) {
            this.level++;
            this.elements.levelDisplay.textContent = this.level;

            // Show level up notification
            this.showLevelUpNotification();
        }
    }

    /**
     * Show level up notification
     */
    showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 40px 60px;
            border-radius: 20px;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            animation: levelUpBounce 0.6s ease-out;
        `;
        notification.innerHTML = `
            🎉 LEVEL UP! 🎉<br>
            <span style="font-size: 48px; color: #FFD700;">Level ${this.level}</span>
        `;

        document.body.appendChild(notification);

        // Add animation
        if (!document.getElementById('levelup-animation-style')) {
            const style = document.createElement('style');
            style.id = 'levelup-animation-style';
            style.textContent = `
                @keyframes levelUpBounce {
                    0% { transform: translate(-50%, -50%) scale(0); }
                    50% { transform: translate(-50%, -50%) scale(1.1); }
                    100% { transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            notification.style.transition = 'opacity 0.5s';
            notification.style.opacity = '0';
            setTimeout(() => document.body.removeChild(notification), 500);
        }, 2000);
    }

    /**
     * Show feedback message
     */
    showFeedback(message, type) {
        this.elements.feedbackArea.innerHTML = message;
        this.elements.feedbackArea.className = type;
    }

    /**
     * Hide feedback message
     */
    hideFeedback() {
        this.elements.feedbackArea.style.display = 'none';
        setTimeout(() => {
            this.elements.feedbackArea.className = '';
        }, 300);
    }

    /**
     * Add activity to log
     */
    addActivity(description, points, isNegative = false) {
        const activity = {
            description,
            points,
            timestamp: new Date(),
            isNegative
        };

        this.activityHistory.unshift(activity);

        // Keep only last 10 activities
        if (this.activityHistory.length > 10) {
            this.activityHistory.pop();
        }

        this.updateActivityLog();
    }

    /**
     * Update activity log display
     */
    updateActivityLog() {
        this.elements.activityList.innerHTML = this.activityHistory
            .map(activity => {
                const pointsStr = activity.points > 0 ? `+${activity.points}` : activity.points;
                const negativeClass = activity.isNegative ? 'negative' : '';
                return `
                    <li class="${negativeClass}">
                        <span>${activity.description}</span>
                        <span class="points">${pointsStr}</span>
                    </li>
                `;
            })
            .join('');
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error(message);
        this.elements.problemContent.innerHTML = `
            <p style="color: #F44336; text-align: center;">
                ⚠️ ${message}
            </p>
        `;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
