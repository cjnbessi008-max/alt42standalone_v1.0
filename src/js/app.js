/**
 * Main Application
 * Integrates all components and handles user interactions
 */

class TangentApp {
    constructor() {
        // Initialize components
        this.graphCanvas = document.getElementById('graphCanvas');
        this.shineCanvas = document.getElementById('shineCanvas');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.problemInfo = document.getElementById('problemInfo');
        this.problemTitle = document.getElementById('problemTitle');
        this.instruction = document.getElementById('instruction');
        this.feedback = document.getElementById('feedback');
        this.resetBtn = document.getElementById('resetBtn');
        this.submitBtn = document.getElementById('submitBtn');

        this.tangentCalc = new TangentCalculator(this.graphCanvas);
        this.shineEffect = new ShineEffect(this.shineCanvas);
        this.moodleAPI = new MoodleAPI();

        this.currentProblem = null;
        this.userAnswer = null;
        this.isDrawing = false;
        this.touchStartPoint = null;

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        try {
            this.showLoading(true);
            this.setupEventListeners();

            // Load problem from Moodle
            await this.loadProblem();

            // Hide loading overlay
            setTimeout(() => {
                this.showLoading(false);
            }, 500);
        } catch (error) {
            console.error('Initialization error:', error);
            this.showFeedback('앱을 시작하는데 문제가 발생했습니다.', 'error');
            this.showLoading(false);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.graphCanvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.graphCanvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.graphCanvas.addEventListener('mouseup', (e) => this.handleEnd(e));
        this.graphCanvas.addEventListener('mouseleave', (e) => this.handleEnd(e));

        // Touch events for mobile
        this.graphCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e);
        }, { passive: false });

        this.graphCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e);
        }, { passive: false });

        this.graphCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd(e);
        }, { passive: false });

        // Button events
        this.resetBtn.addEventListener('click', () => this.reset());
        this.submitBtn.addEventListener('click', () => this.submit());

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Get coordinates from mouse or touch event
     */
    getEventCoordinates(e) {
        const rect = this.graphCanvas.getBoundingClientRect();

        if (e.touches && e.touches.length > 0) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    }

    /**
     * Handle start of interaction
     */
    handleStart(e) {
        const coords = this.getEventCoordinates(e);
        this.isDrawing = true;
        this.touchStartPoint = coords;

        // Find nearest point on curve
        const nearestPoint = this.tangentCalc.findNearestPointOnCurve(coords.x, coords.y);

        // Calculate tangent at this point
        const tangentData = this.tangentCalc.calculateTangentLine(nearestPoint.x);

        // Get canvas coordinates for shine effect
        const canvasPoint = this.tangentCalc.graphToCanvas(nearestPoint.x, nearestPoint.y);

        // Create ripple effect
        this.shineEffect.createRipple(canvasPoint.x, canvasPoint.y);

        // Render
        this.tangentCalc.render();

        // Log interaction
        this.moodleAPI.logEvent('tangent_point_selected', {
            point: nearestPoint,
            slope: tangentData.slope
        });
    }

    /**
     * Handle move during interaction
     */
    handleMove(e) {
        if (!this.isDrawing) return;

        const coords = this.getEventCoordinates(e);

        // Find nearest point on curve
        const nearestPoint = this.tangentCalc.findNearestPointOnCurve(coords.x, coords.y);

        // Calculate tangent at this point
        this.tangentCalc.calculateTangentLine(nearestPoint.x);

        // Render
        this.tangentCalc.render();
    }

    /**
     * Handle end of interaction
     */
    handleEnd(e) {
        if (!this.isDrawing) return;

        this.isDrawing = false;

        // Trigger shine effect
        if (this.tangentCalc.tangentPoint && this.tangentCalc.tangentLine) {
            const point = this.tangentCalc.tangentPoint;
            const canvasPoint = this.tangentCalc.graphToCanvas(point.x, point.y);

            // Calculate tangent line endpoints in canvas coordinates
            const line = this.tangentCalc.tangentLine;
            const canvas1 = this.tangentCalc.graphToCanvas(line.x1, line.slope * line.x1 + line.intercept);
            const canvas2 = this.tangentCalc.graphToCanvas(line.x2, line.slope * line.x2 + line.intercept);

            // Trigger magnificent shine effect
            this.shineEffect.triggerShine(canvasPoint.x, canvasPoint.y, {
                x1: canvas1.x,
                y1: canvas1.y,
                x2: canvas2.x,
                y2: canvas2.y
            });

            // Store user answer
            this.userAnswer = {
                point: this.tangentCalc.tangentPoint,
                slope: this.tangentCalc.tangentLine.slope,
                equation: `y = ${this.tangentCalc.tangentLine.slope.toFixed(2)}x + ${this.tangentCalc.tangentLine.intercept.toFixed(2)}`,
                timestamp: new Date().toISOString()
            };

            // Update instruction
            this.instruction.textContent = `접선 방정식: ${this.userAnswer.equation}`;

            // Enable submit button
            this.submitBtn.disabled = false;
        }

        this.touchStartPoint = null;
    }

    /**
     * Handle window resize
     */
    handleResize() {
        this.tangentCalc.setupCanvas();
        this.shineEffect.setupCanvas();
        this.tangentCalc.render();
    }

    /**
     * Load problem from Moodle
     */
    async loadProblem() {
        try {
            const problem = await this.moodleAPI.getProblem();
            this.currentProblem = problem;

            // Update UI
            this.problemTitle.textContent = problem.title || '접선 그리기';
            this.instruction.textContent = problem.description || '곡선 위의 점을 선택하여 접선을 그려보세요';

            // Set function in calculator
            this.tangentCalc.setFunction(problem.function);

            // Log problem loaded
            this.moodleAPI.logEvent('problem_loaded', {
                problemId: problem.id,
                function: problem.function
            });

            console.log('Problem loaded:', problem);
        } catch (error) {
            console.error('Failed to load problem:', error);

            // Use default problem
            this.useDefaultProblem();
        }
    }

    /**
     * Use default problem (fallback)
     */
    useDefaultProblem() {
        this.currentProblem = {
            id: 'default',
            title: '이차함수의 접선',
            description: '곡선 위의 점을 선택하여 접선을 그려보세요',
            function: {
                type: 'polynomial',
                coefficients: {
                    a: 0.5,
                    b: 0,
                    c: -2
                },
                display: 'f(x) = 0.5x² - 2'
            }
        };

        this.problemTitle.textContent = this.currentProblem.title;
        this.instruction.textContent = this.currentProblem.description;
        this.tangentCalc.setFunction(this.currentProblem.function);
    }

    /**
     * Reset canvas
     */
    reset() {
        this.tangentCalc.tangentPoint = null;
        this.tangentCalc.tangentLine = null;
        this.tangentCalc.render();

        this.shineEffect.clearEffects();

        this.userAnswer = null;
        this.instruction.textContent = this.currentProblem?.description || '곡선 위의 점을 선택하여 접선을 그려보세요';
        this.feedback.textContent = '';
        this.feedback.className = 'feedback';
        this.submitBtn.disabled = false;

        // Log reset
        this.moodleAPI.logEvent('reset_clicked', {
            problemId: this.currentProblem?.id
        });
    }

    /**
     * Submit answer
     */
    async submit() {
        if (!this.userAnswer) {
            this.showFeedback('먼저 접선을 그려주세요.', 'error');
            return;
        }

        try {
            this.submitBtn.disabled = true;
            this.showLoading(true);

            // Submit to Moodle
            const result = await this.moodleAPI.submitAnswer(this.userAnswer);

            // Show result with animation
            setTimeout(() => {
                this.showLoading(false);
                this.showResult(result);
            }, 500);

            // Log submission
            this.moodleAPI.logEvent('answer_submitted', {
                answer: this.userAnswer,
                result: result
            });
        } catch (error) {
            console.error('Submit error:', error);
            this.showLoading(false);
            this.showFeedback('제출 중 오류가 발생했습니다.', 'error');
            this.submitBtn.disabled = false;
        }
    }

    /**
     * Show result with celebration
     */
    showResult(result) {
        if (result.correct) {
            this.showFeedback(result.feedback || '정답입니다! 🎉', 'success');

            // Celebration effect
            const point = this.tangentCalc.tangentPoint;
            if (point) {
                const canvasPoint = this.tangentCalc.graphToCanvas(point.x, point.y);
                this.shineEffect.createParticleBurst(canvasPoint.x, canvasPoint.y, 30);
                this.shineEffect.startAnimation();
            }
        } else {
            this.showFeedback(result.feedback || '다시 시도해보세요.', 'error');
            this.submitBtn.disabled = false;
        }

        // Show solution if provided
        if (result.solution) {
            console.log('Solution:', result.solution);
        }
    }

    /**
     * Show feedback message
     */
    showFeedback(message, type = '') {
        this.feedback.textContent = message;
        this.feedback.className = 'feedback ' + type;
    }

    /**
     * Show/hide loading overlay
     */
    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TangentApp();
});
