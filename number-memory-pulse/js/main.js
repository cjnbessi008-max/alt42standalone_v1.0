/**
 * Number Memory Pulse - Main Application
 * Initializes and orchestrates the game
 */

class NumberMemoryPulseApp {
    constructor() {
        this.initialized = false;
        this.previousLevel = 1;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Number Memory Pulse...');

        try {
            // Initialize UI
            uiController.initialize();
            console.log('UI initialized');

            // Set up event listeners
            this.setupEventListeners();
            console.log('Event listeners set up');

            // Initialize game engine
            const progress = await gameEngine.initialize();
            console.log('Game engine initialized', progress);

            // Update UI with progress
            uiController.updateStats({
                level: progress.current_level,
                score: progress.total_score
            });

            this.previousLevel = progress.current_level;
            this.initialized = true;

            console.log('Number Memory Pulse ready!');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            uiController.showError('앱을 초기화하는 데 실패했습니다. 페이지를 새로고침해주세요.');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // UI Events
        uiController.on('startGame', () => this.handleStartGame());
        uiController.on('retry', () => this.handleRetry());
        uiController.on('next', () => this.handleNext());
        uiController.on('numberInput', (value) => this.handleNumberInput(value));

        // Game Engine Events
        gameEngine.on('initialized', (data) => this.onGameInitialized(data));
        gameEngine.on('roundStarted', (data) => this.onRoundStarted(data));
        gameEngine.on('patternLoaded', (data) => this.onPatternLoaded(data));
        gameEngine.on('showingPattern', (data) => this.onShowingPattern(data));
        gameEngine.on('waitingInput', () => this.onWaitingInput());
        gameEngine.on('inputChanged', (input) => this.onInputChanged(input));
        gameEngine.on('answerChecked', (data) => this.onAnswerChecked(data));
        gameEngine.on('stateChanged', (data) => this.onStateChanged(data));
        gameEngine.on('error', (data) => this.onError(data));
    }

    /**
     * Handle start game button
     */
    async handleStartGame() {
        if (!this.initialized) {
            uiController.showError('게임이 아직 초기화되지 않았습니다.');
            return;
        }

        try {
            uiController.showLoading(true);
            await gameEngine.startRound();
            await gameEngine.showPattern();
        } catch (error) {
            console.error('Failed to start game:', error);
            uiController.showWelcome();
        } finally {
            uiController.showLoading(false);
        }
    }

    /**
     * Handle retry button
     */
    async handleRetry() {
        try {
            uiController.showLoading(true);
            await gameEngine.retry();
        } catch (error) {
            console.error('Failed to retry:', error);
        } finally {
            uiController.showLoading(false);
        }
    }

    /**
     * Handle next button
     */
    async handleNext() {
        try {
            uiController.showLoading(true);
            await gameEngine.nextProblem();
        } catch (error) {
            console.error('Failed to load next problem:', error);
        } finally {
            uiController.showLoading(false);
        }
    }

    /**
     * Handle number input
     */
    handleNumberInput(value) {
        gameEngine.handleInput(value);
    }

    /**
     * Game initialized event
     */
    onGameInitialized(data) {
        console.log('Game initialized:', data);
    }

    /**
     * Round started event
     */
    onRoundStarted(data) {
        console.log('Round started:', data);
    }

    /**
     * Pattern loaded event
     */
    onPatternLoaded(data) {
        console.log('Pattern loaded:', data.pattern.length, 'digits');
    }

    /**
     * Showing pattern event
     */
    async onShowingPattern(data) {
        console.log('Showing pattern...');
        await uiController.displayPattern(data.pattern, data.duration);
    }

    /**
     * Waiting for input event
     */
    onWaitingInput() {
        console.log('Waiting for user input...');
        uiController.showInputScreen();
    }

    /**
     * Input changed event
     */
    onInputChanged(input) {
        uiController.updateUserInput(input);
    }

    /**
     * Answer checked event
     */
    onAnswerChecked(data) {
        console.log('Answer checked:', data);

        // Show result
        uiController.showResult(data);

        // Check for level up
        if (data.currentLevel > this.previousLevel) {
            setTimeout(() => {
                uiController.animateLevelUp(data.currentLevel);
            }, 500);
            this.previousLevel = data.currentLevel;
        }

        // Log streak
        if (data.isCorrect && data.currentStreak > 1) {
            console.log(`🔥 연속 ${data.currentStreak}회 정답!`);
        }
    }

    /**
     * State changed event
     */
    onStateChanged(data) {
        console.log('State changed:', data.oldState, '->', data.newState);

        // Show/hide loading based on state
        if (data.newState === GAME_STATE.LOADING || data.newState === GAME_STATE.CHECKING_ANSWER) {
            uiController.showLoading(true);
        } else {
            uiController.showLoading(false);
        }
    }

    /**
     * Error event
     */
    onError(data) {
        console.error('Game error:', data);
        uiController.showError(data.message);
    }

    /**
     * Get current game state
     */
    getGameState() {
        return gameEngine.getGameData();
    }

    /**
     * Get leaderboard
     */
    async getLeaderboard(limit = 10) {
        return await gameEngine.getLeaderboard(limit);
    }

    /**
     * Get statistics
     */
    async getStatistics() {
        return await gameEngine.getStatistics();
    }

    /**
     * Reset game
     */
    reset() {
        gameEngine.reset();
        uiController.showWelcome();
    }
}

// Create application instance
const app = new NumberMemoryPulseApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
} else {
    app.init();
}

// Expose app globally for debugging
window.NMP = {
    app: app,
    gameEngine: gameEngine,
    uiController: uiController,
    api: api,
    config: NMP_CONFIG,
    utils: NMP_UTILS
};

// Log ready message
console.log('%c Number Memory Pulse %c v1.0.0 ',
    'background: #667eea; color: white; font-weight: bold; padding: 5px;',
    'background: #764ba2; color: white; padding: 5px;');
console.log('Game loaded successfully. Use window.NMP for debugging.');
