/**
 * Main App Module
 * Initializes and coordinates all components
 */

import storage from './storage.js';
import ParticleSystem from './particles.js';
import audio from './audio.js';
import Game from './game.js';

class App {
    constructor() {
        this.storage = storage;
        this.audio = audio;
        this.particleSystem = null;
        this.game = null;

        this.animationFrame = null;
        this.isInitialized = false;

        // DOM elements
        this.elements = {};
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Exponential Burst...');

        // Show loading screen
        this.showLoading();

        // Get DOM elements
        this.cacheElements();

        // Initialize canvas and particle system
        this.initCanvas();

        // Initialize game
        this.game = new Game(this.storage, this.particleSystem, this.audio);
        this.setupGameCallbacks();

        // Setup event listeners
        this.setupEventListeners();

        // Load saved settings
        this.loadSettings();

        // Update UI with saved data
        this.updateStats();
        this.updateLeaderboard();

        // Start animation loop
        this.startAnimation();

        // Load first question
        this.loadNewQuestion();

        // Hide loading screen
        setTimeout(() => {
            this.hideLoading();
        }, 1000);

        this.isInitialized = true;
        console.log('App initialized successfully');
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Screens
            loadingScreen: document.getElementById('loading-screen'),
            app: document.getElementById('app'),

            // Stats
            scoreValue: document.getElementById('score-value'),
            streakValue: document.getElementById('streak-value'),
            levelValue: document.getElementById('level-value'),
            burstsValue: document.getElementById('bursts-value'),

            // Game
            canvas: document.getElementById('burst-canvas'),
            questionDisplay: document.getElementById('question-display'),
            questionHint: document.getElementById('question-hint'),
            answerInput: document.getElementById('answer-input'),
            submitBtn: document.getElementById('submit-btn'),
            timerBar: document.getElementById('timer-bar'),

            // Feedback
            feedbackOverlay: document.getElementById('feedback-overlay'),
            feedbackIcon: document.getElementById('feedback-icon'),
            feedbackText: document.getElementById('feedback-text'),
            feedbackDetail: document.getElementById('feedback-detail'),

            // Combo
            comboDisplay: document.getElementById('combo-display'),
            comboValue: document.getElementById('combo-value'),

            // Settings
            difficultySelect: document.getElementById('difficulty-select'),
            soundToggle: document.getElementById('sound-toggle'),
            particlesToggle: document.getElementById('particles-toggle'),

            // Menu
            menuBtn: document.getElementById('menu-btn'),
            menuModal: document.getElementById('menu-modal'),
            closeMenu: document.getElementById('close-menu'),
            newGameBtn: document.getElementById('new-game-btn'),
            resetProgressBtn: document.getElementById('reset-progress-btn'),
            aboutBtn: document.getElementById('about-btn'),

            // Leaderboard
            leaderboard: document.getElementById('leaderboard')
        };
    }

    /**
     * Initialize canvas and particle system
     */
    initCanvas() {
        this.particleSystem = new ParticleSystem(
            this.elements.canvas,
            this.storage.getSettings().particleDensity
        );

        // Handle window resize
        window.addEventListener('resize', () => {
            this.particleSystem.resize();
        });
    }

    /**
     * Setup game callbacks
     */
    setupGameCallbacks() {
        this.game.onTimerUpdate = (remaining, total) => {
            const percentage = (remaining / total) * 100;
            this.elements.timerBar.style.width = `${percentage}%`;

            if (remaining <= 5) {
                this.elements.timerBar.style.background = 'linear-gradient(90deg, #f87171, #ef4444)';
            } else {
                this.elements.timerBar.style.background = 'linear-gradient(90deg, var(--primary), var(--accent))';
            }
        };

        this.game.onTimeUp = () => {
            this.showFeedback(false, 'Time\'s Up!', `The answer was ${this.game.currentQuestion.answer}`);
            this.game.handleIncorrectAnswer({ timeSpent: this.game.timeLimit });
            this.updateStats();

            setTimeout(() => {
                this.loadNewQuestion();
            }, 2000);
        };

        this.game.onCombo = (streak) => {
            this.showCombo(streak);
        };

        this.game.onLevelUp = (newLevel) => {
            this.showFeedback(true, 'Level Up!', `You reached Level ${newLevel}!`, 2000);
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Initialize audio on first user interaction
        const initAudio = () => {
            this.audio.init();
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);

        // Submit answer
        this.elements.submitBtn.addEventListener('click', () => {
            this.audio.playClick();
            this.submitAnswer();
        });

        this.elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.submitAnswer();
            }
        });

        // Settings
        this.elements.difficultySelect.addEventListener('change', (e) => {
            const difficulty = parseInt(e.target.value);
            this.game.setDifficulty(difficulty);
            this.audio.playClick();
        });

        this.elements.soundToggle.addEventListener('change', (e) => {
            const enabled = e.target.checked;
            this.audio.setEnabled(enabled);
            this.storage.updateSettings({ soundEnabled: enabled });
            if (enabled) this.audio.playClick();
        });

        this.elements.particlesToggle.addEventListener('change', (e) => {
            const density = e.target.value;
            this.particleSystem.setDensity(density);
            this.storage.updateSettings({ particleDensity: density });
            this.audio.playClick();
        });

        // Menu
        this.elements.menuBtn.addEventListener('click', () => {
            this.audio.playClick();
            this.showMenu();
        });

        this.elements.closeMenu.addEventListener('click', () => {
            this.audio.playClick();
            this.hideMenu();
        });

        this.elements.menuModal.addEventListener('click', (e) => {
            if (e.target === this.elements.menuModal) {
                this.hideMenu();
            }
        });

        this.elements.newGameBtn.addEventListener('click', () => {
            this.audio.playClick();
            this.newGame();
            this.hideMenu();
        });

        this.elements.resetProgressBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                this.audio.playClick();
                this.resetProgress();
                this.hideMenu();
            }
        });

        this.elements.aboutBtn.addEventListener('click', () => {
            this.audio.playClick();
            this.showAbout();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.elements.menuModal.classList.contains('show')) {
                    this.hideMenu();
                }
            }
        });
    }

    /**
     * Load saved settings
     */
    loadSettings() {
        const settings = this.storage.getSettings();

        this.elements.difficultySelect.value = settings.difficulty;
        this.elements.soundToggle.checked = settings.soundEnabled;
        this.elements.particlesToggle.value = settings.particleDensity;

        this.audio.setEnabled(settings.soundEnabled);
        this.particleSystem.setDensity(settings.particleDensity);
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        const animate = () => {
            this.particleSystem.animate();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Stop animation loop
     */
    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /**
     * Load new question
     */
    loadNewQuestion() {
        const question = this.game.generateQuestion();
        this.elements.questionDisplay.innerHTML = question.text;
        this.elements.questionHint.textContent = '';
        this.elements.answerInput.value = '';
        this.elements.answerInput.focus();
        this.hideFeedback();
    }

    /**
     * Submit answer
     */
    submitAnswer() {
        const answer = this.elements.answerInput.value.trim();

        if (!answer) {
            this.elements.answerInput.classList.add('shake');
            setTimeout(() => {
                this.elements.answerInput.classList.remove('shake');
            }, 400);
            return;
        }

        const result = this.game.checkAnswer(answer);

        if (result.isCorrect) {
            this.showFeedback(
                true,
                '🎉 Correct!',
                `+${result.scoreGain} points • ${result.timeSpent.toFixed(1)}s`
            );

            // Play burst sound for each stage
            for (let i = 1; i <= result.exponent; i++) {
                setTimeout(() => {
                    this.audio.playBurst(i);
                }, i * 180);
            }
        } else {
            this.showFeedback(
                false,
                '❌ Incorrect',
                `The answer was ${result.correctAnswer}`
            );

            if (result.streakLost > 0) {
                setTimeout(() => {
                    this.elements.feedbackDetail.textContent += ` • Lost ${result.streakLost}x streak`;
                }, 200);
            }
        }

        this.updateStats();

        // Load next question
        setTimeout(() => {
            this.loadNewQuestion();
        }, result.isCorrect ? 3000 : 2000);
    }

    /**
     * Update stats display
     */
    updateStats() {
        const stats = this.game.getStats();
        this.elements.scoreValue.textContent = stats.score.toLocaleString();
        this.elements.streakValue.textContent = stats.streak;
        this.elements.levelValue.textContent = stats.level;
        this.elements.burstsValue.textContent = stats.totalBursts;
    }

    /**
     * Update leaderboard display
     */
    updateLeaderboard() {
        const leaderboard = this.storage.getLeaderboard();
        this.elements.leaderboard.innerHTML = '';

        if (leaderboard.length === 0) {
            this.elements.leaderboard.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No scores yet</p>';
            return;
        }

        leaderboard.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="score">${entry.score.toLocaleString()}</span>
            `;
            this.elements.leaderboard.appendChild(item);
        });
    }

    /**
     * Show feedback overlay
     */
    showFeedback(isCorrect, text, detail = '', duration = 1500) {
        this.elements.feedbackIcon.textContent = isCorrect ? '✓' : '✗';
        this.elements.feedbackText.textContent = text;
        this.elements.feedbackDetail.textContent = detail;

        this.elements.feedbackOverlay.className = `feedback-overlay show ${isCorrect ? 'text-success' : 'text-error'}`;

        setTimeout(() => {
            this.hideFeedback();
        }, duration);
    }

    /**
     * Hide feedback overlay
     */
    hideFeedback() {
        this.elements.feedbackOverlay.classList.remove('show');
    }

    /**
     * Show combo notification
     */
    showCombo(streak) {
        this.elements.comboValue.textContent = `x${streak}`;
        this.elements.comboDisplay.classList.add('show');

        setTimeout(() => {
            this.elements.comboDisplay.classList.remove('show');
        }, 2000);
    }

    /**
     * Show menu modal
     */
    showMenu() {
        this.elements.menuModal.classList.add('show');
        this.game.stopTimer(); // Pause game
    }

    /**
     * Hide menu modal
     */
    hideMenu() {
        this.elements.menuModal.classList.remove('show');
        // Resume timer if there's a current question
        if (this.game.currentQuestion) {
            this.game.startTimer();
        }
    }

    /**
     * Show about dialog
     */
    showAbout() {
        alert(`Exponential Burst v1.0.0

A fun way to learn exponential functions!

Solve problems and watch your answers explode into beautiful firework displays.

Made with ❤️ by KAIST Touch Math Academy

© 2025 All rights reserved`);
    }

    /**
     * Start new game
     */
    newGame() {
        this.game.reset();
        this.storage.resetProgress();
        this.updateStats();
        this.updateLeaderboard();
        this.particleSystem.clear();
        this.loadNewQuestion();
    }

    /**
     * Reset progress
     */
    resetProgress() {
        this.storage.reset();
        this.loadSettings();
        this.updateStats();
        this.updateLeaderboard();
        this.particleSystem.clear();
        this.loadNewQuestion();
    }

    /**
     * Show loading screen
     */
    showLoading() {
        this.elements.loadingScreen.classList.remove('hidden');
        this.elements.app.style.display = 'none';
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        this.elements.loadingScreen.classList.add('hidden');
        this.elements.app.style.display = 'flex';
    }

    /**
     * Cleanup before unload
     */
    cleanup() {
        this.game.endSession();
        this.stopAnimation();
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    const app = new App();
    app.init();

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        app.cleanup();
    });

    // Make app globally accessible for debugging
    window.exponentialBurst = app;
}
