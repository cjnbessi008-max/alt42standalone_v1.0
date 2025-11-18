/**
 * Game Module
 * Core game logic and question generation
 */

class Game {
    constructor(storage, particleSystem, audio) {
        this.storage = storage;
        this.particles = particleSystem;
        this.audio = audio;

        this.currentQuestion = null;
        this.difficulty = storage.getSettings().difficulty;
        this.startTime = null;
        this.timerInterval = null;
        this.timeLimit = 30; // seconds
        this.timeRemaining = this.timeLimit;

        this.sessionStartTime = Date.now();
        this.questionsThisSession = 0;
    }

    /**
     * Generate a new question based on difficulty
     */
    generateQuestion() {
        const difficultySettings = {
            1: { baseRange: [2, 3], expRange: [1, 3] },
            2: { baseRange: [2, 4], expRange: [1, 4] },
            3: { baseRange: [2, 5], expRange: [1, 5] },
            4: { baseRange: [2, 5], expRange: [1, 6] }
        };

        const settings = difficultySettings[this.difficulty] || difficultySettings[2];

        const base = this.randomInt(settings.baseRange[0], settings.baseRange[1]);
        const exponent = this.randomInt(settings.expRange[0], settings.expRange[1]);
        const answer = Math.pow(base, exponent);

        this.currentQuestion = {
            base,
            exponent,
            answer,
            text: `${base}<sup>${exponent}</sup>`,
            startTime: Date.now()
        };

        this.startTimer();
        return this.currentQuestion;
    }

    /**
     * Start question timer
     */
    startTimer() {
        this.timeRemaining = this.timeLimit;
        this.startTime = Date.now();

        // Clear existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Update timer every 100ms for smooth animation
        this.timerInterval = setInterval(() => {
            const elapsed = (Date.now() - this.startTime) / 1000;
            this.timeRemaining = Math.max(0, this.timeLimit - elapsed);

            // Emit timer update event
            this.onTimerUpdate?.(this.timeRemaining, this.timeLimit);

            // Time's up
            if (this.timeRemaining <= 0) {
                this.stopTimer();
                this.onTimeUp?.();
            }

            // Warning at 5 seconds
            if (this.timeRemaining <= 5 && this.timeRemaining > 4.9) {
                this.audio.playTimerWarning();
            }
        }, 100);
    }

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Check if answer is correct
     */
    checkAnswer(userAnswer) {
        if (!this.currentQuestion) return null;

        this.stopTimer();

        const isCorrect = parseFloat(userAnswer) === this.currentQuestion.answer;
        const timeSpent = (Date.now() - this.currentQuestion.startTime) / 1000;

        const player = this.storage.getPlayer();
        this.storage.updatePlayer({
            totalAnswers: player.totalAnswers + 1,
            correctAnswers: player.correctAnswers + (isCorrect ? 1 : 0)
        });
        this.storage.updateAccuracy();

        this.questionsThisSession++;

        const result = {
            isCorrect,
            correctAnswer: this.currentQuestion.answer,
            timeSpent,
            base: this.currentQuestion.base,
            exponent: this.currentQuestion.exponent
        };

        if (isCorrect) {
            this.handleCorrectAnswer(result);
        } else {
            this.handleIncorrectAnswer(result);
        }

        return result;
    }

    /**
     * Handle correct answer
     */
    handleCorrectAnswer(result) {
        const player = this.storage.getPlayer();

        // Update streak
        const newStreak = player.streak + 1;
        const bestStreak = Math.max(player.bestStreak, newStreak);

        // Calculate score (bonus for speed and streak)
        const speedBonus = Math.floor((this.timeLimit - result.timeSpent) * 10);
        const streakBonus = newStreak * 50;
        const baseScore = Math.pow(result.base, result.exponent) * 10;
        const scoreGain = Math.floor(baseScore + speedBonus + streakBonus);

        // Update player data
        this.storage.updatePlayer({
            score: player.score + scoreGain,
            streak: newStreak,
            bestStreak: bestStreak,
            totalBursts: player.totalBursts + 1
        });

        // Check for level up
        const newLevel = Math.floor(player.score / 1000) + 1;
        if (newLevel > player.level) {
            this.handleLevelUp(newLevel);
        }

        // Play sounds
        this.audio.playCorrect(result.base, result.exponent);

        // Create particle burst
        this.particles.createBurst(result.base, result.exponent);

        // Combo notification
        if (newStreak > 1 && newStreak % 5 === 0) {
            this.audio.playCombo(newStreak / 5);
            this.onCombo?.(newStreak);
        }

        result.scoreGain = scoreGain;
        result.newStreak = newStreak;
    }

    /**
     * Handle incorrect answer
     */
    handleIncorrectAnswer(result) {
        const player = this.storage.getPlayer();

        // Reset streak
        this.storage.updatePlayer({
            streak: 0
        });

        // Play sound
        this.audio.playIncorrect();

        result.streakLost = player.streak;
    }

    /**
     * Handle level up
     */
    handleLevelUp(newLevel) {
        this.storage.updatePlayer({ level: newLevel });
        this.audio.playLevelUp();
        this.particles.createCelebration();
        this.onLevelUp?.(newLevel);
    }

    /**
     * Set difficulty
     */
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.storage.updateSettings({ difficulty });
    }

    /**
     * Get current question
     */
    getCurrentQuestion() {
        return this.currentQuestion;
    }

    /**
     * Get player stats
     */
    getStats() {
        return this.storage.getPlayer();
    }

    /**
     * Get time remaining
     */
    getTimeRemaining() {
        return this.timeRemaining;
    }

    /**
     * End game session
     */
    endSession() {
        this.stopTimer();

        const duration = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        this.storage.recordSession(duration);

        const player = this.storage.getPlayer();
        if (player.score > 0) {
            this.storage.addLeaderboardEntry(player.score);
        }
    }

    /**
     * Reset game
     */
    reset() {
        this.stopTimer();
        this.currentQuestion = null;
        this.questionsThisSession = 0;
        this.sessionStartTime = Date.now();
    }

    /**
     * Random integer between min and max (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Get hint for current question
     */
    getHint() {
        if (!this.currentQuestion) return '';

        const { base, exponent } = this.currentQuestion;
        const steps = [];

        for (let i = 1; i <= exponent; i++) {
            steps.push(Math.pow(base, i));
        }

        return `Hint: ${base}^1 = ${steps[0]}, ${base}^2 = ${steps[1] || '?'}, ...`;
    }

    /**
     * Get difficulty name
     */
    getDifficultyName() {
        const names = {
            1: 'Easy',
            2: 'Medium',
            3: 'Hard',
            4: 'Expert'
        };
        return names[this.difficulty] || 'Medium';
    }
}

export default Game;
