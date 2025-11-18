/**
 * Vector 3D Sense - Main Application Controller
 * Manages interaction between LMS, API, and 3D visualization
 *
 * @package    vector3d_sense
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

class Vector3DSenseApp {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: config.apiBaseUrl || '/api',
            containerId: config.containerId || 'vector3d-container',
            ...config
        };

        this.engine = null;
        this.currentProblem = null;
        this.sessionToken = null;
        this.userId = null;
        this.startTime = null;
        this.interactionCount = 0;
        this.cameraMovements = 0;

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        // Get URL parameters
        const params = new URLSearchParams(window.location.search);
        this.questionId = params.get('question_id');
        this.userId = params.get('user_id');

        if (!this.questionId || !this.userId) {
            this.showError('필수 매개변수가 누락되었습니다 (question_id, user_id)');
            return;
        }

        // Show loading
        this.showLoading(true);

        try {
            // Load problem from API
            await this.loadProblem();

            // Initialize 3D engine
            this.initEngine();

            // Render vectors
            this.renderVectors();

            // Setup event listeners
            this.setupEventListeners();

            // Start tracking session
            this.startSession();

        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('문제를 로드하는 중 오류가 발생했습니다: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Load problem from API
     */
    async loadProblem() {
        const url = `${this.config.apiBaseUrl}/problem?question_id=${this.questionId}&user_id=${this.userId}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();

        if (result.status !== 'success') {
            throw new Error(result.message || 'Unknown error');
        }

        this.currentProblem = result.data;
        this.sessionToken = result.data.session.session_token;

        // Update UI with problem info
        this.updateProblemInfo();
    }

    /**
     * Initialize 3D engine
     */
    initEngine() {
        const options = {
            gridSize: this.currentProblem.show_grid ? 10 : 0,
            showGrid: this.currentProblem.show_grid,
            showAxes: this.currentProblem.show_axes,
            showLabels: this.currentProblem.show_labels,
            cameraPosition: this.currentProblem.camera_position || { x: 10, y: 10, z: 10 }
        };

        this.engine = new Vector3DEngine(this.config.containerId, options);
    }

    /**
     * Render vectors on 3D scene
     */
    renderVectors() {
        this.engine.clearVectors();

        const vectors = this.currentProblem.vectors_data.vectors || [];

        vectors.forEach(vectorData => {
            this.engine.addVector(vectorData);
        });

        // For addition/subtraction problems, show result
        if (this.currentProblem.problem_type === 'addition') {
            setTimeout(() => {
                this.showResult();
            }, 1000);
        }

        // Focus camera on vectors
        this.engine.focusOnVectors();
    }

    /**
     * Show problem result (for demonstration)
     */
    showResult() {
        const vectors = this.currentProblem.vectors_data.vectors || [];

        if (this.currentProblem.problem_type === 'addition') {
            this.engine.showVectorAddition(vectors);
        }
    }

    /**
     * Update problem information in UI
     */
    updateProblemInfo() {
        document.getElementById('problem-title').textContent = this.currentProblem.title;
        document.getElementById('problem-description').textContent = this.currentProblem.description;

        const difficultyEl = document.getElementById('problem-difficulty');
        difficultyEl.textContent = '난이도: ' + '★'.repeat(this.currentProblem.difficulty_level);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Submit answer button
        const submitBtn = document.getElementById('submit-answer');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitAnswer());
        }

        // Show result button
        const showResultBtn = document.getElementById('show-result');
        if (showResultBtn) {
            showResultBtn.addEventListener('click', () => this.showResult());
        }

        // Reset view button
        const resetBtn = document.getElementById('reset-view');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetView());
        }

        // Track camera movements
        if (this.engine && this.engine.controls) {
            this.engine.controls.addEventListener('change', () => {
                this.cameraMovements++;
                this.trackEvent('rotate', {
                    position: this.engine.getCameraPosition()
                });
            });
        }

        // Track interactions
        document.addEventListener('click', () => {
            this.interactionCount++;
        });
    }

    /**
     * Start session tracking
     */
    startSession() {
        this.startTime = Date.now();

        // Track view event
        this.trackEvent('view', {
            problem_id: this.currentProblem.id,
            problem_type: this.currentProblem.problem_type
        });

        // Periodic session update (every 30 seconds)
        this.sessionUpdateInterval = setInterval(() => {
            this.updateSession();
        }, 30000);
    }

    /**
     * Update session state
     */
    async updateSession() {
        if (!this.sessionToken) return;

        const url = `${this.config.apiBaseUrl}/session`;
        const data = {
            session_token: this.sessionToken,
            current_state: {
                interaction_count: this.interactionCount,
                camera_movements: this.cameraMovements
            },
            camera_position: this.engine.getCameraPosition()
        };

        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Session update error:', error);
        }
    }

    /**
     * Track analytics event
     */
    async trackEvent(eventType, eventData = {}) {
        const url = `${this.config.apiBaseUrl}/analytics`;
        const data = {
            session_id: this.currentProblem?.session?.id,
            problem_id: this.currentProblem?.id,
            user_id: this.userId,
            event_type: eventType,
            event_data: eventData,
            camera_position: this.engine?.getCameraPosition()
        };

        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Event tracking error:', error);
        }
    }

    /**
     * Submit student answer
     */
    async submitAnswer() {
        // Get answer from input fields
        const answerX = parseFloat(document.getElementById('answer-x')?.value || 0);
        const answerY = parseFloat(document.getElementById('answer-y')?.value || 0);
        const answerZ = parseFloat(document.getElementById('answer-z')?.value || 0);

        const answer = {
            x: answerX,
            y: answerY,
            z: answerZ
        };

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        this.showLoading(true);

        try {
            const url = `${this.config.apiBaseUrl}/submit`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problem_id: this.currentProblem.id,
                    user_id: this.userId,
                    answer: answer,
                    time_spent: timeSpent
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                this.showResult();
                this.displaySubmissionResult(result.data);
            } else {
                this.showError(result.message);
            }

        } catch (error) {
            console.error('Submit error:', error);
            this.showError('답안 제출 중 오류가 발생했습니다');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Display submission result
     */
    displaySubmissionResult(result) {
        const resultEl = document.getElementById('submission-result');
        if (!resultEl) return;

        resultEl.className = result.is_correct ? 'result correct' : 'result incorrect';
        resultEl.innerHTML = `
            <h3>${result.is_correct ? '정답입니다! ✓' : '다시 시도해보세요'}</h3>
            <p>점수: ${result.score}점</p>
            <p>시도 횟수: ${result.attempt_number}</p>
            ${!result.is_correct ? `<p>정답: (${result.expected_answer.x}, ${result.expected_answer.y}, ${result.expected_answer.z})</p>` : ''}
        `;
        resultEl.style.display = 'block';

        // Track submission
        this.trackEvent('answer_submit', {
            is_correct: result.is_correct,
            attempt_number: result.attempt_number
        });
    }

    /**
     * Reset camera view
     */
    resetView() {
        this.engine.focusOnVectors();
        this.trackEvent('pan', { action: 'reset_view' });
    }

    /**
     * Show loading indicator
     */
    showLoading(show) {
        const loader = document.getElementById('loading');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        } else {
            alert(message);
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.sessionUpdateInterval) {
            clearInterval(this.sessionUpdateInterval);
        }

        if (this.engine) {
            this.engine.dispose();
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.vector3dApp = new Vector3DSenseApp({
        apiBaseUrl: '/vector3d-sense/api',
        containerId: 'vector3d-container'
    });
});
