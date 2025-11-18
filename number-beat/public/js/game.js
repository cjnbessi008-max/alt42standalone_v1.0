/**
 * Number Beat Game Logic
 */

class NumberBeatGame {
    constructor() {
        this.audioManager = new AudioManager();
        this.rhythmEngine = new RhythmEngine(this.audioManager);

        this.currentProblem = null;
        this.selectedNumbers = [];
        this.studentId = null;
        this.difficulty = 'easy';
        this.timeLimit = CONFIG.GAME.DEFAULT_TIME_LIMIT;
        this.timeRemaining = this.timeLimit;
        this.timerInterval = null;
        this.gameStartTime = null;
        this.sessionToken = null;

        this.initializeElements();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            // Screens
            gameScreen: document.getElementById('gameScreen'),
            resultScreen: document.getElementById('resultScreen'),
            loadingScreen: document.getElementById('loadingScreen'),

            // Game elements
            problemTitle: document.getElementById('problemTitle'),
            problemDescription: document.getElementById('problemDescription'),
            timeRemaining: document.getElementById('timeRemaining'),
            currentScore: document.getElementById('currentScore'),
            numberTiles: document.getElementById('numberTiles'),
            selectedNumbers: document.getElementById('selectedNumbers'),
            clearBtn: document.getElementById('clearBtn'),
            submitBtn: document.getElementById('submitBtn'),

            // Result elements
            resultIcon: document.getElementById('resultIcon'),
            resultTitle: document.getElementById('resultTitle'),
            earnedScore: document.getElementById('earnedScore'),
            resultRhythm: document.getElementById('resultRhythm'),
            resultTime: document.getElementById('resultTime'),
            correctAnswer: document.getElementById('correctAnswer'),
            nextBtn: document.getElementById('nextBtn'),

            // Statistics
            totalScore: document.getElementById('totalScore'),
            successRate: document.getElementById('successRate'),
            rhythmAccuracy: document.getElementById('rhythmAccuracy'),
            currentStreak: document.getElementById('currentStreak')
        };
    }

    /**
     * Show specific screen
     */
    showScreen(screenName) {
        Object.values(this.elements).forEach(el => {
            if (el && el.classList && el.classList.contains('screen')) {
                el.classList.remove('active');
            }
        });

        const screen = this.elements[screenName + 'Screen'];
        if (screen) {
            screen.classList.add('active');
        }
    }

    /**
     * Load problem from API
     */
    async loadProblem(difficulty) {
        this.showScreen('loading');

        try {
            const response = await fetch(
                `${CONFIG.API_URL}/get-problem?difficulty=${difficulty}&student_id=${this.studentId}`
            );

            if (!response.ok) {
                throw new Error('Failed to load problem');
            }

            const problem = await response.json();
            this.currentProblem = problem;

            this.setupProblem();
            this.showScreen('game');

        } catch (error) {
            console.error('Error loading problem:', error);
            alert('문제를 불러오는데 실패했습니다. 다시 시도해주세요.');
            this.showScreen('game');
        }
    }

    /**
     * Setup problem display
     */
    setupProblem() {
        if (!this.currentProblem) return;

        // Display problem info
        this.elements.problemTitle.textContent = this.currentProblem.title;
        this.elements.problemDescription.textContent = this.currentProblem.description;

        // Set time limit
        this.timeLimit = parseInt(this.currentProblem.time_limit) || CONFIG.GAME.DEFAULT_TIME_LIMIT;
        this.timeRemaining = this.timeLimit;
        this.elements.timeRemaining.textContent = this.timeLimit;

        // Setup rhythm pattern
        this.rhythmEngine.setPattern(this.currentProblem.rhythm_pattern);

        // Create number tiles
        this.createNumberTiles();

        // Reset selected numbers
        this.selectedNumbers = [];
        this.updateSelectedDisplay();

        // Start timer
        this.startTimer();

        // Play rhythm demo after a short delay
        setTimeout(() => {
            this.rhythmEngine.playDemo();
        }, 1000);

        // Start game session
        this.startSession();
    }

    /**
     * Create number tiles
     */
    createNumberTiles() {
        const numbers = this.currentProblem.number_sequence.split(',').map(n => n.trim());
        this.elements.numberTiles.innerHTML = '';

        numbers.forEach(number => {
            const tile = document.createElement('button');
            tile.className = 'number-tile';
            tile.textContent = number;
            tile.dataset.number = number;
            tile.addEventListener('click', () => this.selectNumber(number, tile));
            this.elements.numberTiles.appendChild(tile);
        });
    }

    /**
     * Select a number
     */
    selectNumber(number, tile) {
        if (tile.classList.contains('selected')) return;

        // Record tap time for rhythm accuracy
        this.rhythmEngine.recordTap();

        // Play tap sound
        this.audioManager.playTap();

        // Add to selected numbers
        this.selectedNumbers.push(number);

        // Mark tile as selected
        tile.classList.add('selected');

        // Update display
        this.updateSelectedDisplay();
    }

    /**
     * Update selected numbers display
     */
    updateSelectedDisplay() {
        this.elements.selectedNumbers.innerHTML = '';

        this.selectedNumbers.forEach((number, index) => {
            const numDiv = document.createElement('div');
            numDiv.className = 'selected-number';
            numDiv.textContent = number;
            numDiv.dataset.index = index;
            numDiv.addEventListener('click', () => this.removeNumber(index));
            this.elements.selectedNumbers.appendChild(numDiv);
        });
    }

    /**
     * Remove number from selection
     */
    removeNumber(index) {
        const number = this.selectedNumbers[index];

        // Remove from selected array
        this.selectedNumbers.splice(index, 1);

        // Unmark tile
        const tiles = this.elements.numberTiles.querySelectorAll('.number-tile');
        tiles.forEach(tile => {
            if (tile.dataset.number === number && tile.classList.contains('selected')) {
                // Check if this number is still in selected array
                if (!this.selectedNumbers.includes(number)) {
                    tile.classList.remove('selected');
                }
            }
        });

        // Update display
        this.updateSelectedDisplay();
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedNumbers = [];

        // Unmark all tiles
        const tiles = this.elements.numberTiles.querySelectorAll('.number-tile');
        tiles.forEach(tile => tile.classList.remove('selected'));

        // Update display
        this.updateSelectedDisplay();
    }

    /**
     * Submit answer
     */
    async submitAnswer() {
        if (this.selectedNumbers.length === 0) {
            alert('숫자를 선택해주세요!');
            return;
        }

        // Stop timer
        this.stopTimer();

        // Stop rhythm
        this.rhythmEngine.stop();

        // Calculate time spent
        const timeSpent = this.timeLimit - this.timeRemaining;

        // Calculate rhythm accuracy
        const rhythmAccuracy = this.rhythmEngine.calculateAccuracy();

        // Prepare submission
        const submittedOrder = this.selectedNumbers.join(',');

        this.showScreen('loading');

        try {
            const response = await fetch(`${CONFIG.API_URL}/submit-answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: this.studentId,
                    problem_id: this.currentProblem.id,
                    submitted_order: submittedOrder,
                    rhythm_accuracy: rhythmAccuracy,
                    time_spent: timeSpent,
                    session_token: this.sessionToken
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit answer');
            }

            const result = await response.json();
            this.showResult(result, timeSpent, rhythmAccuracy);

        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('답안 제출에 실패했습니다. 다시 시도해주세요.');
            this.showScreen('game');
            this.startTimer();
        }
    }

    /**
     * Show result screen
     */
    showResult(result, timeSpent, rhythmAccuracy) {
        // Play sound
        if (result.is_correct) {
            this.audioManager.playSuccess();
            this.elements.resultIcon.textContent = '🎉';
            this.elements.resultTitle.textContent = '정답입니다!';
            this.elements.correctAnswer.style.display = 'none';
        } else {
            this.audioManager.playFail();
            this.elements.resultIcon.textContent = '😞';
            this.elements.resultTitle.textContent = '틀렸습니다!';
            this.elements.correctAnswer.textContent = `정답: ${result.correct_order}`;
            this.elements.correctAnswer.style.display = 'block';
        }

        // Display stats
        this.elements.earnedScore.textContent = result.score;
        this.elements.resultRhythm.textContent = rhythmAccuracy.toFixed(1) + '%';
        this.elements.resultTime.textContent = timeSpent + '초';

        // Update statistics
        this.updateStatistics();

        // Show result screen
        this.showScreen('result');
    }

    /**
     * Start timer
     */
    startTimer() {
        this.gameStartTime = Date.now();

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.elements.timeRemaining.textContent = this.timeRemaining;

            if (this.timeRemaining <= 0) {
                this.stopTimer();
                this.submitAnswer(); // Auto-submit when time's up
            }
        }, 1000);
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
     * Start game session
     */
    async startSession() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/start-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    student_id: this.studentId,
                    problem_id: this.currentProblem.id
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.sessionToken = data.session_token;
            }
        } catch (error) {
            console.error('Error starting session:', error);
        }
    }

    /**
     * Update statistics display
     */
    async updateStatistics() {
        try {
            const response = await fetch(
                `${CONFIG.API_URL}/get-progress?student_id=${this.studentId}`
            );

            if (response.ok) {
                const stats = await response.json();

                this.elements.totalScore.textContent = stats.total_score || 0;
                this.elements.successRate.textContent = (stats.success_rate || 0) + '%';
                this.elements.rhythmAccuracy.textContent = (stats.average_rhythm_accuracy || 0).toFixed(1) + '%';
                this.elements.currentStreak.textContent = stats.current_streak || 0;
            }
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    /**
     * Load next problem
     */
    nextProblem() {
        this.rhythmEngine.reset();
        this.loadProblem(this.difficulty);
    }

    /**
     * Start new game
     */
    startGame(studentId, difficulty) {
        this.studentId = studentId;
        this.difficulty = difficulty;

        // Update statistics
        this.updateStatistics();

        // Load first problem
        this.loadProblem(difficulty);
    }
}
