/**
 * Number Memory Pulse - Game Engine
 * Core game logic and state management
 */

class GameEngine {
    constructor() {
        this.state = GAME_STATE.IDLE;
        this.currentProblem = null;
        this.currentPattern = [];
        this.userInput = '';
        this.startTime = null;
        this.currentLevel = 1;
        this.currentScore = 0;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.listeners = {};
    }

    /**
     * Initialize the game engine
     */
    async initialize() {
        try {
            // Load user progress from server
            const progress = await api.getProgress();
            this.currentLevel = progress.current_level;
            this.currentScore = progress.total_score;
            this.currentStreak = progress.current_streak;
            this.bestStreak = progress.best_streak;

            this.emit('initialized', progress);
            return progress;
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.emit('error', { message: NMP_CONFIG.MESSAGES.NO_CONNECTION });
            throw error;
        }
    }

    /**
     * Start a new game round
     */
    async startRound(difficulty = null) {
        this.setState(GAME_STATE.LOADING);
        this.userInput = '';

        try {
            // Get a problem from server
            const targetDifficulty = difficulty || this.getCurrentDifficulty();
            const problem = await api.getProblem(targetDifficulty);

            if (!problem) {
                throw new Error(NMP_CONFIG.MESSAGES.NO_PROBLEMS);
            }

            this.currentProblem = problem;
            this.startTime = Date.now();

            this.emit('roundStarted', problem);

            // Load the pattern
            await this.loadPattern(problem.problem_id);

            return problem;
        } catch (error) {
            console.error('Failed to start round:', error);
            this.setState(GAME_STATE.IDLE);
            this.emit('error', { message: error.message });
            throw error;
        }
    }

    /**
     * Load pattern from server
     */
    async loadPattern(problemId) {
        try {
            const patternData = await api.getPattern(problemId);
            this.currentPattern = patternData.pattern;

            this.setState(GAME_STATE.READY);
            this.emit('patternLoaded', {
                pattern: this.currentPattern,
                duration: patternData.display_duration
            });

            return this.currentPattern;
        } catch (error) {
            console.error('Failed to load pattern:', error);
            this.emit('error', { message: NMP_CONFIG.MESSAGES.GENERIC_ERROR });
            throw error;
        }
    }

    /**
     * Show pattern to user
     */
    async showPattern() {
        this.setState(GAME_STATE.SHOWING_PATTERN);
        this.emit('showingPattern', {
            pattern: this.currentPattern,
            duration: this.currentProblem.display_duration
        });

        // Pattern will be displayed by UI controller
        // Wait for pattern display to complete
        const totalDuration = this.currentPattern.length * this.currentProblem.display_duration +
                            (this.currentPattern.length - 1) * NMP_CONFIG.UI.INTER_NUMBER_DELAY;

        await NMP_UTILS.sleep(totalDuration);

        this.setState(GAME_STATE.WAITING_INPUT);
        this.emit('waitingInput');
    }

    /**
     * Handle user input
     */
    handleInput(digit) {
        if (this.state !== GAME_STATE.WAITING_INPUT) {
            return;
        }

        if (digit === 'clear') {
            this.userInput = this.userInput.slice(0, -1);
        } else if (digit === 'submit') {
            this.submitAnswer();
            return;
        } else {
            if (this.userInput.length < NMP_CONFIG.UI.MAX_INPUT_LENGTH) {
                this.userInput += digit;
            }
        }

        this.emit('inputChanged', this.userInput);
    }

    /**
     * Submit answer to server
     */
    async submitAnswer() {
        if (!this.userInput) {
            this.emit('error', { message: '숫자를 입력해주세요.' });
            return;
        }

        this.setState(GAME_STATE.CHECKING_ANSWER);

        try {
            const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
            const result = await api.submitAnswer(
                this.currentProblem.problem_id,
                this.userInput,
                timeSpent
            );

            // Update local state
            this.currentScore = result.current_score;
            this.currentLevel = result.current_level;
            this.currentStreak = result.current_streak;
            this.bestStreak = result.best_streak;

            this.setState(GAME_STATE.SHOWING_RESULT);
            this.emit('answerChecked', {
                isCorrect: result.is_correct,
                correctPattern: result.correct_pattern,
                userPattern: this.userInput,
                pointsEarned: result.points_earned,
                currentScore: result.current_score,
                currentLevel: result.current_level,
                currentStreak: result.current_streak,
                bestStreak: result.best_streak,
                accuracy: result.accuracy
            });

            // Play sound and vibrate
            if (result.is_correct) {
                NMP_UTILS.playSound('CORRECT');
                NMP_UTILS.vibrate(100);
            } else {
                NMP_UTILS.playSound('INCORRECT');
                NMP_UTILS.vibrate([100, 50, 100]);
            }

            return result;
        } catch (error) {
            console.error('Failed to submit answer:', error);
            this.setState(GAME_STATE.WAITING_INPUT);
            this.emit('error', { message: NMP_CONFIG.MESSAGES.SUBMIT_ERROR });
            throw error;
        }
    }

    /**
     * Retry current problem
     */
    async retry() {
        this.userInput = '';
        await this.showPattern();
    }

    /**
     * Move to next problem
     */
    async nextProblem() {
        await this.startRound();
        await this.showPattern();
    }

    /**
     * Get current difficulty based on level
     */
    getCurrentDifficulty() {
        return Math.min(this.currentLevel, NMP_CONFIG.DIFFICULTY_LEVELS.MASTER);
    }

    /**
     * Get current state
     */
    getState() {
        return this.state;
    }

    /**
     * Set game state
     */
    setState(newState) {
        const oldState = this.state;
        this.state = newState;
        this.emit('stateChanged', { oldState, newState });
    }

    /**
     * Get current game data
     */
    getGameData() {
        return {
            level: this.currentLevel,
            score: this.currentScore,
            streak: this.currentStreak,
            bestStreak: this.bestStreak,
            state: this.state
        };
    }

    /**
     * Reset game
     */
    reset() {
        this.state = GAME_STATE.IDLE;
        this.currentProblem = null;
        this.currentPattern = [];
        this.userInput = '';
        this.startTime = null;
        this.emit('reset');
    }

    /**
     * Event emitter - on
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Event emitter - off
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Event emitter - emit
     */
    emit(event, data) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }

    /**
     * Get leaderboard
     */
    async getLeaderboard(limit = 10) {
        try {
            return await api.getLeaderboard(limit);
        } catch (error) {
            console.error('Failed to get leaderboard:', error);
            return [];
        }
    }

    /**
     * Get user statistics
     */
    async getStatistics() {
        try {
            return await api.getStats();
        } catch (error) {
            console.error('Failed to get statistics:', error);
            return null;
        }
    }
}

// Create singleton instance
const gameEngine = new GameEngine();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEngine;
}
