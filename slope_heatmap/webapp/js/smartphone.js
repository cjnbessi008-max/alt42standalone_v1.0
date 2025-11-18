/**
 * Main Application Controller
 * Integrates all components and manages application state
 */

class SlopeHeatmapApp {
    constructor() {
        this.currentProblem = null;
        this.currentSession = null;
        this.isRunning = false;
        this.elapsedTime = 0;
        this.dataPoints = 0;
        this.timerInterval = null;
        this.liveUpdateInterval = null;
        this.targetTimeInRange = 0;
        this.totalTargetTime = 0;

        this.initializeUI();
        this.loadProblems();
    }

    /**
     * Initialize UI elements and event listeners
     */
    initializeUI() {
        // Get button elements
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.resetBtn = document.getElementById('reset-btn');

        // Add event listeners
        this.startBtn.addEventListener('click', () => this.start());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.resetBtn.addEventListener('click', () => this.reset());

        // Info displays
        this.elapsedTimeDisplay = document.getElementById('elapsed-time');
        this.dataPointsDisplay = document.getElementById('data-points');
        this.progressFill = document.getElementById('progress-fill');
        this.targetTimeDisplay = document.getElementById('target-time');
    }

    /**
     * Load problems from API
     */
    async loadProblems() {
        try {
            const result = await window.slopeAPI.getProblems();

            if (result.success && result.problems) {
                this.displayProblems(result.problems);
            } else {
                // Show default problems if API fails
                this.displayProblems([
                    {
                        key: 'balance_basic',
                        title: '기본 균형',
                        description: '10초 동안 기기를 수평으로 유지하세요',
                        difficulty: 'easy'
                    },
                    {
                        key: 'tilt_forward',
                        title: '앞으로 기울이기',
                        description: '15초 동안 기기를 앞으로 45도 기울이세요',
                        difficulty: 'medium'
                    },
                    {
                        key: 'circle_motion',
                        title: '원 그리기',
                        description: '30초 동안 원을 그리듯 기기를 움직이세요',
                        difficulty: 'hard'
                    }
                ]);
            }
        } catch (error) {
            console.error('Failed to load problems:', error);
        }
    }

    /**
     * Display problems in the UI
     */
    displayProblems(problems) {
        const problemList = document.getElementById('problem-list');
        problemList.innerHTML = '';

        problems.forEach(problem => {
            const card = document.createElement('div');
            card.className = 'problem-card';
            card.innerHTML = `
                <h3>${problem.title}</h3>
                <p>${problem.description || '문제를 풀어보세요'}</p>
                <span class="difficulty ${problem.difficulty}">${this.getDifficultyText(problem.difficulty)}</span>
            `;

            card.addEventListener('click', () => this.selectProblem(problem, card));
            problemList.appendChild(card);
        });
    }

    /**
     * Get difficulty text in Korean
     */
    getDifficultyText(difficulty) {
        const texts = {
            easy: '쉬움',
            medium: '보통',
            hard: '어려움'
        };
        return texts[difficulty] || difficulty;
    }

    /**
     * Select a problem
     */
    selectProblem(problem, cardElement) {
        // Remove previous selection
        document.querySelectorAll('.problem-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection
        cardElement.classList.add('selected');

        this.currentProblem = problem;

        // Update problem info
        document.getElementById('problem-title').textContent = problem.title;
        document.getElementById('problem-description').textContent =
            problem.description || '문제를 시작하려면 시작 버튼을 누르세요';

        // Enable start button
        this.startBtn.disabled = false;

        console.log('Selected problem:', problem);
    }

    /**
     * Start the activity
     */
    async start() {
        if (!this.currentProblem) {
            alert('먼저 문제를 선택해주세요!');
            return;
        }

        if (this.isRunning) {
            return;
        }

        try {
            // Start session
            const result = await window.slopeAPI.startSession(this.currentProblem.key);

            if (result.success && result.session_id) {
                this.currentSession = result.session_id;
                this.isRunning = true;

                // Set target if available
                const problem = result.problem;
                if (problem.target_beta_min !== null) {
                    window.slopeSensor.setTarget(
                        problem.target_beta_min,
                        problem.target_beta_max,
                        problem.target_gamma_min,
                        problem.target_gamma_max
                    );
                    this.totalTargetTime = problem.time_limit || 10;
                }

                // Start sensor recording
                await window.slopeSensor.startRecording(this.currentSession);

                // Update UI
                this.startBtn.style.display = 'none';
                this.stopBtn.style.display = 'inline-block';
                document.getElementById('session-info').style.display = 'block';
                window.slopeHeatmap.show();
                window.slopeHeatmap.clear();

                // Start timers
                this.startTimers();

                console.log('Session started:', this.currentSession);
            }
        } catch (error) {
            console.error('Failed to start session:', error);
            alert('세션 시작에 실패했습니다: ' + error.message);
        }
    }

    /**
     * Stop the activity
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        // Stop sensor recording
        await window.slopeSensor.stopRecording();

        // Stop timers
        this.stopTimers();

        // Calculate score
        const score = this.calculateScore();

        try {
            // Complete session
            await window.slopeAPI.completeSession(this.currentSession, score);

            // Load and display final heatmap
            await window.slopeHeatmap.loadData(this.currentSession);

            // Show results
            this.showResults(score);

            console.log('Session completed with score:', score);
        } catch (error) {
            console.error('Failed to complete session:', error);
        }

        // Update UI
        this.startBtn.style.display = 'inline-block';
        this.stopBtn.style.display = 'none';
        this.startBtn.disabled = false;
    }

    /**
     * Reset the sensor and UI
     */
    reset() {
        window.slopeSensor.reset();
        this.elapsedTime = 0;
        this.dataPoints = 0;
        this.targetTimeInRange = 0;
        this.updateInfoDisplays();
    }

    /**
     * Start timers
     */
    startTimers() {
        this.elapsedTime = 0;
        this.dataPoints = 0;
        this.targetTimeInRange = 0;

        // Update elapsed time every second
        this.timerInterval = setInterval(() => {
            this.elapsedTime++;
            this.updateInfoDisplays();
        }, 1000);

        // Update live heatmap every 500ms
        this.liveUpdateInterval = setInterval(() => {
            this.updateLiveHeatmap();
        }, 500);
    }

    /**
     * Stop timers
     */
    stopTimers() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        if (this.liveUpdateInterval) {
            clearInterval(this.liveUpdateInterval);
            this.liveUpdateInterval = null;
        }
    }

    /**
     * Update info displays
     */
    updateInfoDisplays() {
        this.elapsedTimeDisplay.textContent = `${this.elapsedTime}s`;
        this.dataPointsDisplay.textContent = this.dataPoints;

        // Update progress bar
        if (this.totalTargetTime > 0) {
            const progress = Math.min((this.targetTimeInRange / this.totalTargetTime) * 100, 100);
            this.progressFill.style.width = `${progress}%`;
            this.targetTimeDisplay.textContent = `${this.targetTimeInRange}s / ${this.totalTargetTime}s`;
        } else {
            const progress = Math.min((this.elapsedTime / 30) * 100, 100);
            this.progressFill.style.width = `${progress}%`;
        }
    }

    /**
     * Update live heatmap
     */
    updateLiveHeatmap() {
        if (!this.isRunning) return;

        const beta = window.slopeSensor.beta;
        const gamma = window.slopeSensor.gamma;

        window.slopeHeatmap.updateLive(beta, gamma);
        window.slopeHeatmap.renderLive();

        this.dataPoints++;

        // Check if in target range
        if (window.slopeSensor.isInTargetRange()) {
            this.targetTimeInRange++;
        }

        this.updateInfoDisplays();

        // Auto-complete if target time reached
        if (this.totalTargetTime > 0 && this.targetTimeInRange >= this.totalTargetTime) {
            this.stop();
        }
    }

    /**
     * Calculate score based on performance
     */
    calculateScore() {
        if (this.totalTargetTime > 0) {
            // Score based on time in target range
            return Math.min((this.targetTimeInRange / this.totalTargetTime) * 100, 100);
        } else {
            // Score based on coverage and duration
            const stats = window.slopeHeatmap.getStats();
            const durationScore = Math.min((this.elapsedTime / 30) * 50, 50);
            const coverageScore = parseFloat(stats.coverage) * 0.5;
            return Math.min(durationScore + coverageScore, 100);
        }
    }

    /**
     * Show results dialog
     */
    showResults(score) {
        const stats = window.slopeHeatmap.getStats();

        const message = `
세션 완료!

점수: ${score.toFixed(1)}%
경과 시간: ${this.elapsedTime}초
데이터 포인트: ${stats.totalPoints}
커버리지: ${stats.coverage}%
핫스팟: ${stats.hotspots}개

히트맵을 확인하여 기울기 패턴을 분석해보세요.
        `;

        alert(message);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.slopeApp = new SlopeHeatmapApp();
    console.log('Slope Heatmap App initialized');
});
