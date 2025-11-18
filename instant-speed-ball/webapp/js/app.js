/**
 * Instant Speed Ball - Main Application
 */

class InstantSpeedBallApp {
    constructor() {
        // Initialize physics and graph
        this.physics = new BallPhysics('ballCanvas');
        this.graph = new VelocityGraph('velocityGraph');

        // UI elements
        this.elements = {
            problemTitle: document.getElementById('problemTitle'),
            problemDescription: document.getElementById('problemDescription'),
            timeValue: document.getElementById('timeValue'),
            positionValue: document.getElementById('positionValue'),
            velocityValue: document.getElementById('velocityValue'),
            btnStart: document.getElementById('btnStart'),
            btnPause: document.getElementById('btnPause'),
            btnReset: document.getElementById('btnReset'),
            answerSection: document.getElementById('answerSection'),
            questionText: document.getElementById('questionText'),
            answerInput: document.getElementById('answerInput'),
            btnSubmit: document.getElementById('btnSubmit'),
            feedback: document.getElementById('feedback'),
            currentTime: document.getElementById('currentTime')
        };

        // Current problem data
        this.currentProblem = null;

        // Update interval
        this.updateInterval = null;

        // Initialize
        this.init();
    }

    init() {
        // Set up event listeners
        this.setupEventListeners();

        // Update clock
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);

        // Load problem from URL parameter or use default
        const urlParams = new URLSearchParams(window.location.search);
        const problemId = urlParams.get('problem') || '1';

        this.loadProblem(problemId);
    }

    setupEventListeners() {
        // Control buttons
        this.elements.btnStart.addEventListener('click', () => this.start());
        this.elements.btnPause.addEventListener('click', () => this.togglePause());
        this.elements.btnReset.addEventListener('click', () => this.reset());

        // Submit answer
        this.elements.btnSubmit.addEventListener('click', () => this.submitAnswer());
        this.elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitAnswer();
        });
    }

    updateClock() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        this.elements.currentTime.textContent = `${hours}:${minutes}`;
    }

    /**
     * Load problem from API
     */
    async loadProblem(problemId) {
        try {
            // Show loading state
            this.elements.problemTitle.textContent = '문제를 불러오는 중...';

            // Fetch problem from API
            const response = await fetch(`api/problem-loader.php?id=${problemId}`);

            if (!response.ok) {
                throw new Error('Failed to load problem');
            }

            const problem = await response.json();

            // If API returns error, use sample data
            if (problem.error) {
                this.loadSampleProblem(problemId);
                return;
            }

            this.currentProblem = problem;
            this.displayProblem();

        } catch (error) {
            console.error('Error loading problem:', error);
            // Use sample data as fallback
            this.loadSampleProblem(problemId);
        }
    }

    /**
     * Load sample problem (fallback when API is unavailable)
     */
    loadSampleProblem(problemId) {
        const sampleProblems = {
            '1': {
                id: 1,
                title: '자유낙하 - 기본',
                description: '높이 100m에서 공을 가만히 놓았을 때, 2초 후의 순간속도는?',
                initial_position: 100,
                initial_velocity: 0,
                acceleration: -9.8,
                simulation_duration: 10,
                question_type: 'velocity_at_time',
                question_time: 2.0,
                correct_answer: -19.6,
                tolerance: 0.1
            },
            '2': {
                id: 2,
                title: '위로 던진 공',
                description: '지면에서 공을 20m/s의 속도로 위로 던졌을 때, 1초 후의 순간속도는?',
                initial_position: 0,
                initial_velocity: 20,
                acceleration: -9.8,
                simulation_duration: 10,
                question_type: 'velocity_at_time',
                question_time: 1.0,
                correct_answer: 10.2,
                tolerance: 0.1
            },
            '3': {
                id: 3,
                title: '최고점에서의 속도',
                description: '지면에서 공을 15m/s의 속도로 위로 던졌을 때, 최고점(1.53초)에서의 순간속도는?',
                initial_position: 0,
                initial_velocity: 15,
                acceleration: -9.8,
                simulation_duration: 5,
                question_type: 'velocity_at_time',
                question_time: 1.53,
                correct_answer: 0,
                tolerance: 0.1
            },
            '4': {
                id: 4,
                title: '아래로 던진 공',
                description: '높이 50m에서 공을 10m/s의 속도로 아래로 던졌을 때, 1초 후의 순간속도는?',
                initial_position: 50,
                initial_velocity: -10,
                acceleration: -9.8,
                simulation_duration: 5,
                question_type: 'velocity_at_time',
                question_time: 1.0,
                correct_answer: -19.8,
                tolerance: 0.1
            },
            '5': {
                id: 5,
                title: '자유 관찰',
                description: '공의 운동을 관찰하고 순간변화율의 개념을 이해하세요.',
                initial_position: 80,
                initial_velocity: 5,
                acceleration: -9.8,
                simulation_duration: 10,
                question_type: 'free_observation',
                question_time: null,
                correct_answer: null,
                tolerance: null
            }
        };

        this.currentProblem = sampleProblems[problemId] || sampleProblems['1'];
        this.displayProblem();
    }

    /**
     * Display problem on UI
     */
    displayProblem() {
        const p = this.currentProblem;

        // Display problem info
        this.elements.problemTitle.textContent = p.title;
        this.elements.problemDescription.textContent = p.description;

        // Set physics parameters
        this.physics.setProblem(
            parseFloat(p.initial_position),
            parseFloat(p.initial_velocity),
            parseFloat(p.acceleration),
            parseFloat(p.simulation_duration)
        );

        // Set graph max time
        this.graph.setMaxTime(parseFloat(p.simulation_duration));

        // Show/hide answer section based on question type
        if (p.question_type === 'free_observation') {
            this.elements.answerSection.style.display = 'none';
        } else {
            this.elements.answerSection.style.display = 'block';

            // Format question
            if (p.question_type === 'velocity_at_time') {
                this.elements.questionText.textContent =
                    `${p.question_time}초 후의 순간속도는 몇 m/s입니까?`;
            } else if (p.question_type === 'position_at_time') {
                this.elements.questionText.textContent =
                    `${p.question_time}초 후의 위치는 몇 m입니까?`;
            }
        }

        // Reset feedback
        this.elements.feedback.classList.remove('show', 'correct', 'incorrect');
        this.elements.answerInput.value = '';

        // Update display
        this.updateDisplay();
    }

    /**
     * Start simulation
     */
    start() {
        this.physics.start();
        this.elements.btnStart.disabled = true;
        this.elements.btnPause.disabled = false;
        this.elements.btnPause.textContent = '일시정지';

        // Start update interval
        this.updateInterval = setInterval(() => this.updateDisplay(), 50);
    }

    /**
     * Toggle pause
     */
    togglePause() {
        if (this.physics.isPaused) {
            this.physics.resume();
            this.elements.btnPause.textContent = '일시정지';
        } else {
            this.physics.pause();
            this.elements.btnPause.textContent = '재개';
        }
    }

    /**
     * Reset simulation
     */
    reset() {
        this.physics.reset();
        this.graph.clear();

        this.elements.btnStart.disabled = false;
        this.elements.btnPause.disabled = true;
        this.elements.btnPause.textContent = '일시정지';

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        this.updateDisplay();

        // Clear feedback
        this.elements.feedback.classList.remove('show', 'correct', 'incorrect');
    }

    /**
     * Update display values
     */
    updateDisplay() {
        const state = this.physics.getState();

        // Update metrics
        this.elements.timeValue.textContent = state.time.toFixed(2);
        this.elements.positionValue.textContent = state.position.toFixed(2);
        this.elements.velocityValue.textContent = state.velocity.toFixed(2);

        // Update graph
        this.graph.addPoint(state.time, state.velocity);

        // Check if simulation ended
        if (!this.physics.isRunning && this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            this.elements.btnStart.disabled = false;
            this.elements.btnPause.disabled = true;
        }
    }

    /**
     * Submit answer
     */
    submitAnswer() {
        const answer = parseFloat(this.elements.answerInput.value);

        if (isNaN(answer)) {
            this.showFeedback('숫자를 입력해주세요.', false);
            return;
        }

        const p = this.currentProblem;
        let correctValue;

        // Calculate correct answer based on question type
        if (p.question_type === 'velocity_at_time') {
            correctValue = this.physics.calculateVelocity(parseFloat(p.question_time));
        } else if (p.question_type === 'position_at_time') {
            correctValue = this.physics.calculatePosition(parseFloat(p.question_time));
        }

        const tolerance = parseFloat(p.tolerance) || 0.1;
        const isCorrect = Math.abs(answer - correctValue) <= tolerance;

        if (isCorrect) {
            this.showFeedback('정답입니다! 🎉', true);
            this.recordAttempt(true);
        } else {
            this.showFeedback(
                `틀렸습니다. 정답은 ${correctValue.toFixed(2)} m/s입니다. (오차범위: ±${tolerance})`,
                false
            );
            this.recordAttempt(false);
        }
    }

    /**
     * Show feedback message
     */
    showFeedback(message, isCorrect) {
        this.elements.feedback.textContent = message;
        this.elements.feedback.classList.remove('correct', 'incorrect');
        this.elements.feedback.classList.add(isCorrect ? 'correct' : 'incorrect', 'show');
    }

    /**
     * Record student attempt (for Moodle integration)
     */
    async recordAttempt(isCorrect) {
        try {
            const data = {
                problem_id: this.currentProblem.id,
                student_answer: parseFloat(this.elements.answerInput.value),
                is_correct: isCorrect,
                time_spent: Math.floor(this.physics.time)
            };

            // Send to API
            const response = await fetch('api/record-attempt.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                console.log('Attempt recorded successfully');
            }
        } catch (error) {
            console.error('Error recording attempt:', error);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InstantSpeedBallApp();
});
