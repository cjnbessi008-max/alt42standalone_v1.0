/**
 * Log Gear App - Main Application Logic
 * Connects UI, API, and Gear Engine
 */

class LogGearApp {
    constructor() {
        this.gearEngine = null;
        this.currentProblem = null;
        this.startTime = null;
        this.stats = {
            attempts: 0,
            correct: 0
        };

        this.init();
    }

    async init() {
        // Initialize gear engine
        this.gearEngine = new LogGearEngine('gearCanvas');

        // Initialize session
        await this.initSession();

        // Setup event listeners
        this.setupEventListeners();

        // Update time display
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);

        // Load initial problem
        this.loadRandomProblem();

        console.log('Log Gear App initialized');
    }

    /**
     * Initialize or restore session
     */
    async initSession() {
        try {
            const sessionId = api.sessionId;
            document.getElementById('sessionId').textContent = sessionId.substring(0, 12) + '...';

            // Try to get existing session stats
            try {
                const stats = await api.getSessionStats();
                if (stats.success) {
                    this.updateStatistics(stats.data.statistics);
                }
            } catch (error) {
                // If session doesn't exist in DB, create new one
                await api.createSession();
            }
        } catch (error) {
            console.error('Failed to initialize session:', error);
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Load problem button
        document.getElementById('loadProblemBtn').addEventListener('click', () => {
            this.loadRandomProblem();
        });

        // Random problem button
        document.getElementById('randomProblemBtn').addEventListener('click', () => {
            this.loadRandomProblem();
        });

        // Submit answer button
        document.getElementById('submitAnswerBtn').addEventListener('click', () => {
            this.submitAnswer();
        });

        // Show animation button
        document.getElementById('showAnimationBtn').addEventListener('click', () => {
            this.gearEngine.startAnimation();
        });

        // Answer input - submit on Enter key
        document.getElementById('answerInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        // Sync Moodle button
        document.getElementById('syncMoodleBtn').addEventListener('click', () => {
            this.syncMoodleQuestions();
        });

        // Difficulty select change
        document.getElementById('difficultySelect').addEventListener('change', () => {
            this.loadRandomProblem();
        });
    }

    /**
     * Load random problem
     */
    async loadRandomProblem() {
        try {
            const difficulty = document.getElementById('difficultySelect').value || null;
            const response = await api.getRandomProblem(difficulty);

            if (response.success && response.data) {
                this.setProblem(response.data);
            } else {
                this.showError('문제를 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('Failed to load problem:', error);
            this.showError('API 연결 실패. 데모 문제를 표시합니다.');
            this.loadDemoProblem();
        }
    }

    /**
     * Load demo problem (offline mode)
     */
    loadDemoProblem() {
        const demoProblems = [
            { id: 'demo1', problem_text: '2 × 3을 로그 기어로 계산하세요', operand1: 2, operand2: 3, operation: 'multiply', answer: 6 },
            { id: 'demo2', problem_text: '5 × 4를 로그 기어로 계산하세요', operand1: 5, operand2: 4, operation: 'multiply', answer: 20 },
            { id: 'demo3', problem_text: '8 ÷ 2를 로그 기어로 계산하세요', operand1: 8, operand2: 2, operation: 'divide', answer: 4 }
        ];

        const randomProblem = demoProblems[Math.floor(Math.random() * demoProblems.length)];
        this.setProblem(randomProblem);
    }

    /**
     * Set current problem
     */
    setProblem(problem) {
        this.currentProblem = problem;
        this.startTime = Date.now();

        // Update UI
        document.getElementById('problemText').textContent = problem.problem_text;
        document.getElementById('currentProblem').textContent = problem.problem_text;
        document.getElementById('operand1').textContent = problem.operand1;
        document.getElementById('operand2').textContent = problem.operand2;
        document.getElementById('operator').textContent = problem.operation === 'multiply' ? '×' : '÷';
        document.getElementById('result').textContent = '?';

        // Clear previous answer and feedback
        document.getElementById('answerInput').value = '';
        const feedbackArea = document.getElementById('feedbackArea');
        feedbackArea.textContent = '';
        feedbackArea.className = 'feedback-area';

        // Update gear engine
        this.gearEngine.setProblem(problem.operand1, problem.operand2, problem.operation);

        // Update connection status
        document.getElementById('connectionStatus').className = 'status-indicator connected';
    }

    /**
     * Submit answer
     */
    async submitAnswer() {
        if (!this.currentProblem) {
            this.showError('먼저 문제를 불러와주세요.');
            return;
        }

        const answerInput = document.getElementById('answerInput');
        const studentAnswer = parseFloat(answerInput.value);

        if (isNaN(studentAnswer)) {
            this.showError('올바른 숫자를 입력하세요.');
            return;
        }

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        // Check answer locally
        const isCorrect = Math.abs(studentAnswer - this.currentProblem.answer) < 0.01;

        // Update stats
        this.stats.attempts++;
        if (isCorrect) {
            this.stats.correct++;
        }

        // Update UI
        document.getElementById('result').textContent = this.currentProblem.answer;
        this.showFeedback(isCorrect, this.currentProblem.answer);
        this.updateStatistics({
            total_attempts: this.stats.attempts,
            correct_attempts: this.stats.correct,
            accuracy: ((this.stats.correct / this.stats.attempts) * 100).toFixed(1)
        });

        // Submit to backend
        try {
            if (typeof this.currentProblem.id === 'number') {
                const response = await api.submitAttempt(
                    this.currentProblem.id,
                    studentAnswer,
                    timeSpent,
                    false
                );

                if (response.success) {
                    console.log('Answer submitted successfully');
                }
            }
        } catch (error) {
            console.error('Failed to submit answer:', error);
            // Continue anyway in offline mode
        }

        // Show animation for correct answers
        if (isCorrect) {
            setTimeout(() => {
                this.gearEngine.startAnimation();
            }, 500);
        }
    }

    /**
     * Show feedback message
     */
    showFeedback(isCorrect, correctAnswer) {
        const feedbackArea = document.getElementById('feedbackArea');

        if (isCorrect) {
            feedbackArea.textContent = '정답입니다! 🎉';
            feedbackArea.className = 'feedback-area correct';
        } else {
            feedbackArea.textContent = `틀렸습니다. 정답은 ${correctAnswer}입니다.`;
            feedbackArea.className = 'feedback-area incorrect';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const feedbackArea = document.getElementById('feedbackArea');
        feedbackArea.textContent = message;
        feedbackArea.className = 'feedback-area incorrect';

        setTimeout(() => {
            feedbackArea.textContent = '';
            feedbackArea.className = 'feedback-area';
        }, 3000);
    }

    /**
     * Update statistics display
     */
    updateStatistics(stats) {
        document.getElementById('attemptCount').textContent = stats.total_attempts || 0;
        document.getElementById('accuracy').textContent = (stats.accuracy || 0) + '%';
    }

    /**
     * Sync questions from Moodle
     */
    async syncMoodleQuestions() {
        const quizIdInput = document.getElementById('quizIdInput');
        const quizId = parseInt(quizIdInput.value);

        if (!quizId || isNaN(quizId)) {
            this.showMoodleStatus('Quiz ID를 입력하세요.', 'error');
            return;
        }

        this.showMoodleStatus('Moodle에서 문제를 가져오는 중...', 'success');

        try {
            const response = await api.syncMoodleQuestions(quizId);

            if (response.success) {
                this.showMoodleStatus(
                    `${response.data.imported_count}개의 문제를 가져왔습니다.`,
                    'success'
                );
            } else {
                this.showMoodleStatus('문제를 가져오지 못했습니다.', 'error');
            }
        } catch (error) {
            console.error('Moodle sync error:', error);
            this.showMoodleStatus('Moodle 연결 실패. API 설정을 확인하세요.', 'error');
        }
    }

    /**
     * Show Moodle status message
     */
    showMoodleStatus(message, type) {
        const statusDiv = document.getElementById('moodleStatus');
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;

        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status-message';
        }, 5000);
    }

    /**
     * Update current time display
     */
    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('currentTime').textContent = `${hours}:${minutes}`;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.logGearApp = new LogGearApp();
});
