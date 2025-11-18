/**
 * Main Application Logic
 * Coordinates all modules and handles user interactions
 */

class LogTreeApp {
    constructor() {
        this.currentProblem = null;
        this.initialized = false;

        // DOM Elements
        this.elements = {
            studentName: document.getElementById('studentName'),
            studentProgress: document.getElementById('studentProgress'),
            currentLevel: document.getElementById('currentLevel'),
            currentProblem: document.getElementById('currentProblem'),
            answerInput: document.getElementById('answerInput'),
            submitButton: document.getElementById('submitAnswer'),
            feedback: document.getElementById('feedback'),
            solvedProblems: document.getElementById('solvedProblems'),
            accuracy: document.getElementById('accuracy'),
            treeHeight: document.getElementById('treeHeight'),
            growthIndex: document.getElementById('growthIndex'),
            phoneMessage: document.getElementById('phoneMessage'),
            settingsBtn: document.getElementById('settingsBtn'),
            configModal: document.getElementById('configModal'),
            moodleConfigForm: document.getElementById('moodleConfigForm'),
            useDemoMode: document.getElementById('useDemoMode')
        };

        this.bindEvents();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Submit answer
        this.elements.submitButton.addEventListener('click', () => this.submitAnswer());

        // Enter key to submit
        this.elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        // Settings button
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());

        // Moodle config form
        this.elements.moodleConfigForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.connectToMoodle();
        });

        // Demo mode button
        this.elements.useDemoMode.addEventListener('click', () => this.startDemoMode());

        // Click outside modal to close
        this.elements.configModal.addEventListener('click', (e) => {
            if (e.target === this.elements.configModal) {
                this.hideSettings();
            }
        });
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Log Tree App...');

        // Load saved statistics
        logCalculator.loadFromStorage();

        // Update UI with loaded stats
        this.updateStatistics();

        // Check for saved Moodle config
        const savedConfig = localStorage.getItem('moodleConfig');

        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                moodleAPI.init(config);

                // Test connection
                const connected = await moodleAPI.testConnection();

                if (connected) {
                    await this.loadUserInfo();
                    await this.loadNextProblem();
                    this.initialized = true;
                } else {
                    throw new Error('Connection test failed');
                }
            } catch (error) {
                console.error('Failed to connect with saved config:', error);
                this.showSettings();
            }
        } else {
            // No saved config, show settings
            this.showSettings();
        }
    }

    /**
     * Show settings modal
     */
    showSettings() {
        this.elements.configModal.classList.add('show');
    }

    /**
     * Hide settings modal
     */
    hideSettings() {
        this.elements.configModal.classList.remove('show');
    }

    /**
     * Connect to Moodle
     */
    async connectToMoodle() {
        const config = {
            url: document.getElementById('moodleUrl').value,
            token: document.getElementById('moodleToken').value,
            courseId: document.getElementById('courseId').value,
            quizId: document.getElementById('quizId').value,
            demoMode: false
        };

        try {
            moodleAPI.init(config);

            // Test connection
            const connected = await moodleAPI.testConnection();

            if (connected) {
                this.hideSettings();
                await this.loadUserInfo();
                await this.loadNextProblem();
                this.initialized = true;

                this.showNotification('Moodle 연결 성공!', 'success');
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            console.error('Moodle connection error:', error);
            this.showNotification('Moodle 연결 실패. 설정을 확인해주세요.', 'error');
        }
    }

    /**
     * Start demo mode (no Moodle required)
     */
    async startDemoMode() {
        console.log('Starting demo mode...');

        moodleAPI.enableDemoMode();
        this.hideSettings();

        this.elements.studentName.textContent = '학습자: 데모 사용자';

        await this.loadNextProblem();
        this.initialized = true;

        this.showNotification('데모 모드로 시작합니다!', 'success');
        treeVisualizer.showPhoneMessage('데모 모드: 문제를 풀어보세요! 🌱', 'info');
    }

    /**
     * Load user information
     */
    async loadUserInfo() {
        try {
            const user = await moodleAPI.getCurrentUser();

            if (user) {
                this.elements.studentName.textContent = `학습자: ${user.fullname}`;
            }
        } catch (error) {
            console.error('Failed to load user info:', error);
        }
    }

    /**
     * Load next problem
     */
    async loadNextProblem() {
        try {
            this.elements.currentProblem.innerHTML = '<p>문제를 불러오는 중...</p>';
            this.elements.answerInput.value = '';
            this.elements.feedback.classList.remove('show');

            this.currentProblem = await moodleAPI.getNextProblem();

            // Display problem
            this.elements.currentProblem.innerHTML = `
                <div class="problem-text">
                    <strong>문제:</strong> ${this.currentProblem.question}
                </div>
            `;

            // Enable input
            this.elements.answerInput.disabled = false;
            this.elements.submitButton.disabled = false;
            this.elements.answerInput.focus();

        } catch (error) {
            console.error('Failed to load problem:', error);
            this.elements.currentProblem.innerHTML = '<p>문제를 불러올 수 없습니다.</p>';
            this.showNotification('문제 로딩 실패', 'error');
        }
    }

    /**
     * Submit answer
     */
    async submitAnswer() {
        if (!this.initialized) {
            this.showNotification('먼저 설정을 완료해주세요.', 'error');
            return;
        }

        const answer = this.elements.answerInput.value.trim();

        if (!answer) {
            this.showNotification('답을 입력해주세요.', 'error');
            return;
        }

        // Disable input during processing
        this.elements.answerInput.disabled = true;
        this.elements.submitButton.disabled = true;

        try {
            // Submit to Moodle
            const result = await moodleAPI.submitAnswer(this.currentProblem.id, answer);

            // Record attempt
            const isCorrect = logCalculator.recordAttempt(result.correct);

            // Show feedback
            this.showFeedback(result.correct, result.explanation);

            if (result.correct) {
                // Update statistics
                this.updateStatistics();

                // Update tree visualization
                const stats = logCalculator.getStatistics();
                treeVisualizer.updateTree(stats);

                // Save progress
                logCalculator.saveToStorage();

                // Show success message on phone
                treeVisualizer.showPhoneMessage('정답입니다! 나무가 자랐어요! 🌳', 'success');

                // Load next problem after delay
                setTimeout(() => {
                    moodleAPI.nextProblem();
                    this.loadNextProblem();
                }, 2000);

            } else {
                // Show error message
                treeVisualizer.showPhoneMessage('다시 시도해보세요! 💪', 'error');

                // Re-enable input for retry
                setTimeout(() => {
                    this.elements.answerInput.disabled = false;
                    this.elements.submitButton.disabled = false;
                    this.elements.answerInput.value = '';
                    this.elements.answerInput.focus();
                }, 1500);
            }

        } catch (error) {
            console.error('Error submitting answer:', error);
            this.showNotification('답안 제출 실패', 'error');

            // Re-enable input
            this.elements.answerInput.disabled = false;
            this.elements.submitButton.disabled = false;
        }
    }

    /**
     * Show feedback to user
     */
    showFeedback(isCorrect, explanation) {
        this.elements.feedback.classList.remove('correct', 'incorrect');
        this.elements.feedback.classList.add(isCorrect ? 'correct' : 'incorrect');

        if (isCorrect) {
            this.elements.feedback.innerHTML = `
                ✅ <strong>정답입니다!</strong><br>
                ${explanation}
            `;
        } else {
            this.elements.feedback.innerHTML = `
                ❌ <strong>틀렸습니다.</strong><br>
                ${explanation}
            `;
        }

        this.elements.feedback.classList.add('show');
    }

    /**
     * Update statistics display
     */
    updateStatistics() {
        const stats = logCalculator.getStatistics();

        this.elements.solvedProblems.textContent = stats.solvedProblems;
        this.elements.accuracy.textContent = stats.accuracy + '%';
        this.elements.treeHeight.textContent = stats.treeHeight + ' cm';
        this.elements.growthIndex.textContent = logCalculator.getGrowthFormula();
        this.elements.studentProgress.textContent = `진행률: ${Math.round(stats.progress)}%`;
        this.elements.currentLevel.textContent = `현재 레벨: ${stats.level}`;
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-weight: 500;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Reset application
     */
    reset() {
        if (confirm('모든 진행 상황을 초기화하시겠습니까?')) {
            logCalculator.reset();
            logCalculator.saveToStorage();
            treeVisualizer.reset();
            this.updateStatistics();
            this.loadNextProblem();

            this.showNotification('초기화되었습니다.', 'success');
        }
    }
}

// Additional CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
const app = new LogTreeApp();

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for console access (debugging)
window.logTreeApp = app;
window.resetApp = () => app.reset();
