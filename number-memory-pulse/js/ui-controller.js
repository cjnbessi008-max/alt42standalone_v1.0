/**
 * Number Memory Pulse - UI Controller
 * Manages all UI interactions and updates
 */

class UIController {
    constructor() {
        this.elements = {};
        this.currentScreen = null;
        this.isMinimized = false;
    }

    /**
     * Initialize UI elements
     */
    initialize() {
        // Cache DOM elements
        this.elements = {
            // Container
            smartphone: document.getElementById('virtual-smartphone'),
            toggleBtn: document.getElementById('toggle-smartphone'),

            // Status bar
            statusTime: document.getElementById('current-time'),

            // Stats
            levelDisplay: document.getElementById('level'),
            scoreDisplay: document.getElementById('score'),

            // Screens
            welcomeScreen: document.getElementById('welcome-screen'),
            patternScreen: document.getElementById('pattern-screen'),
            inputScreen: document.getElementById('input-screen'),
            resultScreen: document.getElementById('result-screen'),

            // Pattern screen elements
            numberDisplay: document.getElementById('number-display'),
            patternProgress: document.getElementById('pattern-progress'),

            // Input screen elements
            userInputDisplay: document.getElementById('user-input-display'),
            numberPad: document.querySelectorAll('.num-btn'),

            // Result screen elements
            resultIcon: document.getElementById('result-icon'),
            resultTitle: document.getElementById('result-title'),
            correctPattern: document.getElementById('correct-pattern'),
            userPattern: document.getElementById('user-pattern'),

            // Buttons
            btnStart: document.getElementById('btn-start'),
            btnRetry: document.getElementById('btn-retry'),
            btnNext: document.getElementById('btn-next'),

            // Loading overlay
            loadingOverlay: document.getElementById('loading-overlay')
        };

        this.attachEventListeners();
        this.startClock();
        this.showScreen(SCREEN.WELCOME);
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toggle smartphone visibility
        if (this.elements.toggleBtn) {
            this.elements.toggleBtn.addEventListener('click', () => {
                this.toggleSmartphone();
            });
        }

        // Start button
        if (this.elements.btnStart) {
            this.elements.btnStart.addEventListener('click', () => {
                this.emit('startGame');
            });
        }

        // Retry button
        if (this.elements.btnRetry) {
            this.elements.btnRetry.addEventListener('click', () => {
                this.emit('retry');
            });
        }

        // Next button
        if (this.elements.btnNext) {
            this.elements.btnNext.addEventListener('click', () => {
                this.emit('next');
            });
        }

        // Number pad buttons
        this.elements.numberPad.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.getAttribute('data-num');
                this.emit('numberInput', value);
            });
        });
    }

    /**
     * Toggle smartphone visibility
     */
    toggleSmartphone() {
        this.isMinimized = !this.isMinimized;
        this.elements.smartphone.classList.toggle('minimized', this.isMinimized);
        this.elements.toggleBtn.querySelector('.toggle-icon').textContent =
            this.isMinimized ? '+' : '−';
    }

    /**
     * Start the status bar clock
     */
    startClock() {
        const updateTime = () => {
            if (this.elements.statusTime) {
                this.elements.statusTime.textContent = NMP_UTILS.getCurrentTime();
            }
        };

        updateTime();
        setInterval(updateTime, 60000); // Update every minute
    }

    /**
     * Show a specific screen
     */
    showScreen(screenId) {
        // Hide all screens
        Object.values(this.elements).forEach(el => {
            if (el && el.classList && el.classList.contains('screen')) {
                el.classList.remove('active');
            }
        });

        // Show requested screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
        }
    }

    /**
     * Update game stats display
     */
    updateStats(data) {
        if (this.elements.levelDisplay) {
            this.elements.levelDisplay.textContent = data.level || 1;
        }
        if (this.elements.scoreDisplay) {
            this.elements.scoreDisplay.textContent = NMP_UTILS.formatNumber(data.score || 0);
        }
    }

    /**
     * Show loading overlay
     */
    showLoading(show = true) {
        if (this.elements.loadingOverlay) {
            if (show) {
                this.elements.loadingOverlay.classList.add('active');
            } else {
                this.elements.loadingOverlay.classList.remove('active');
            }
        }
    }

    /**
     * Display pattern sequence
     */
    async displayPattern(pattern, duration) {
        this.showScreen(SCREEN.PATTERN);

        const displayNumber = this.elements.numberDisplay.querySelector('.display-number');
        const progressBar = this.elements.patternProgress;

        for (let i = 0; i < pattern.length; i++) {
            // Update progress
            const progress = ((i + 1) / pattern.length) * 100;
            progressBar.style.width = `${progress}%`;

            // Show number with animation
            displayNumber.textContent = pattern[i];
            this.elements.numberDisplay.style.animation = 'none';
            // Trigger reflow to restart animation
            void this.elements.numberDisplay.offsetWidth;
            this.elements.numberDisplay.style.animation = 'scaleIn 0.3s ease';

            // Play sound
            NMP_UTILS.playSound('NUMBER_BEEP');

            // Wait for display duration
            await NMP_UTILS.sleep(duration);

            // Inter-number delay
            if (i < pattern.length - 1) {
                displayNumber.textContent = '';
                await NMP_UTILS.sleep(NMP_CONFIG.UI.INTER_NUMBER_DELAY);
            }
        }

        // Clear display
        await NMP_UTILS.sleep(500);
        displayNumber.textContent = '';
    }

    /**
     * Show input screen
     */
    showInputScreen() {
        this.showScreen(SCREEN.INPUT);
        this.updateUserInput('');
    }

    /**
     * Update user input display
     */
    updateUserInput(input) {
        if (this.elements.userInputDisplay) {
            this.elements.userInputDisplay.textContent = input || '';
        }
    }

    /**
     * Show result screen
     */
    showResult(data) {
        this.showScreen(SCREEN.RESULT);

        const resultContainer = document.querySelector('.result-container');

        if (data.isCorrect) {
            resultContainer.classList.add('success');
            resultContainer.classList.remove('fail');
            this.elements.resultIcon.textContent = '🎉';
            this.elements.resultTitle.textContent = '정답입니다!';
        } else {
            resultContainer.classList.add('fail');
            resultContainer.classList.remove('success');
            this.elements.resultIcon.textContent = '😢';
            this.elements.resultTitle.textContent = '틀렸습니다';
        }

        // Show patterns
        if (this.elements.correctPattern) {
            this.elements.correctPattern.textContent = data.correctPattern;
        }
        if (this.elements.userPattern) {
            this.elements.userPattern.textContent = data.userPattern;
        }

        // Update stats
        this.updateStats({
            level: data.currentLevel,
            score: data.currentScore
        });

        // Show appropriate buttons
        if (data.isCorrect) {
            this.elements.btnRetry.style.display = 'none';
            this.elements.btnNext.style.display = 'inline-block';
        } else {
            this.elements.btnRetry.style.display = 'inline-block';
            this.elements.btnNext.style.display = 'inline-block';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(message); // Simple alert for now
        // Could implement a custom toast notification
    }

    /**
     * Show welcome screen
     */
    showWelcome() {
        this.showScreen(SCREEN.WELCOME);
    }

    /**
     * Event emitter - on
     */
    on(event, callback) {
        if (!this.listeners) {
            this.listeners = {};
        }
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Event emitter - emit
     */
    emit(event, data) {
        if (!this.listeners || !this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in UI event listener for ${event}:`, error);
            }
        });
    }

    /**
     * Animate level up
     */
    async animateLevelUp(newLevel) {
        const levelDisplay = this.elements.levelDisplay;
        if (!levelDisplay) return;

        levelDisplay.style.animation = 'none';
        void levelDisplay.offsetWidth;
        levelDisplay.style.animation = 'pulse 0.6s ease';

        NMP_UTILS.playSound('LEVEL_UP');
        NMP_UTILS.showToast(`레벨 업! 이제 레벨 ${newLevel}입니다!`, 'success');
    }

    /**
     * Update progress info
     */
    updateProgressInfo(progress) {
        // Could display additional progress info in the UI
        console.log('Progress:', progress);
    }
}

// Create singleton instance
const uiController = new UIController();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIController;
}
