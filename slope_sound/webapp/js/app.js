/**
 * Slope Sound - Main Application
 * Integrates all modules and handles user interactions
 */

class SlopeSoundApp {
    constructor() {
        // Initialize engines
        this.mathEngine = new MathEngine();
        this.audioEngine = new AudioEngine();
        this.moodleAPI = new MoodleAPI();

        // Canvas and renderer
        this.canvas = document.getElementById('functionCanvas');
        this.renderer = new GraphRenderer(this.canvas);

        // Current state
        this.currentProblem = null;
        this.currentPoints = [];
        this.exploredPoints = [];
        this.startTime = null;
        this.isDragging = false;

        // DOM elements
        this.elements = {
            problemList: document.getElementById('problemList'),
            problemTitle: document.getElementById('problemTitle'),
            currentX: document.getElementById('currentX'),
            currentY: document.getElementById('currentY'),
            currentSlope: document.getElementById('currentSlope'),
            currentFreq: document.getElementById('currentFreq'),
            soundIndicator: document.getElementById('soundIndicator'),
            playBtn: document.getElementById('playBtn'),
            resetBtn: document.getElementById('resetBtn'),
            backBtn: document.getElementById('backBtn'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText')
        };

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        await this.loadProblems();
        this.setupEventListeners();
        console.log('Slope Sound App initialized');
    }

    /**
     * Load problems from Moodle
     */
    async loadProblems() {
        try {
            // Try to load from Moodle API
            const problems = await this.moodleAPI.getProblems();
            this.renderProblemList(problems);
        } catch (error) {
            console.warn('Failed to load from Moodle, using mock data:', error);
            // Fallback to mock data for standalone testing
            const mockProblems = this.moodleAPI.getMockProblems();
            this.renderProblemList(mockProblems);
        }
    }

    /**
     * Render problem list
     */
    renderProblemList(problems) {
        this.elements.problemList.innerHTML = '';

        problems.forEach(problem => {
            const item = document.createElement('div');
            item.className = 'problem-item';
            item.dataset.problemId = problem.id;

            const difficultyEmoji = ['⭐', '⭐⭐', '⭐⭐⭐'][problem.difficulty_level - 1];

            item.innerHTML = `
                <h4>${problem.title}</h4>
                <div class="problem-meta">
                    <span>함수: f(x) = ${problem.function_expression}</span><br>
                    <span>난이도: ${difficultyEmoji}</span>
                    <span style="margin-left: 10px;">범위: [${problem.x_min}, ${problem.x_max}]</span>
                </div>
            `;

            item.addEventListener('click', () => this.selectProblem(problem));
            this.elements.problemList.appendChild(item);
        });
    }

    /**
     * Select a problem
     */
    async selectProblem(problem) {
        // Update UI
        document.querySelectorAll('.problem-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`[data-problem-id="${problem.id}"]`)?.classList.add('selected');

        // Set current problem
        this.currentProblem = problem;
        this.elements.problemTitle.textContent = problem.title;

        // Generate function points
        this.currentPoints = this.mathEngine.generatePoints(
            problem.function_expression,
            parseFloat(problem.x_min),
            parseFloat(problem.x_max)
        );

        // Update renderer ranges
        const yRange = this.mathEngine.findYRange(this.currentPoints);
        this.renderer.setRanges(
            parseFloat(problem.x_min),
            parseFloat(problem.x_max),
            yRange.min,
            yRange.max
        );

        // Render graph
        this.renderer.render(this.currentPoints);

        // Reset state
        this.exploredPoints = [];
        this.startTime = Date.now();
        this.updateProgress();

        // Enable play button
        this.elements.playBtn.disabled = false;

        // Start attempt in Moodle
        try {
            await this.moodleAPI.startAttempt(problem.id);
        } catch (error) {
            console.warn('Failed to start attempt:', error);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        this.canvas.addEventListener('mouseup', () => this.handlePointerUp());
        this.canvas.addEventListener('mouseleave', () => this.handlePointerUp());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePointerDown(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handlePointerMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.handlePointerUp());

        // Buttons
        this.elements.playBtn.addEventListener('click', () => this.playCurrentSlope());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.backBtn.addEventListener('click', () => this.backToProblemList());
    }

    /**
     * Handle pointer down
     */
    handlePointerDown(event) {
        if (!this.currentProblem) return;

        this.isDragging = true;
        this.audioEngine.initialize(); // Initialize on first interaction
        this.handlePointerMove(event);
    }

    /**
     * Handle pointer move
     */
    handlePointerMove(event) {
        if (!this.currentProblem || !this.isDragging) return;

        // Get canvas coordinates
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;

        // Check if within bounds
        if (!this.renderer.isWithinBounds(canvasX, canvasY)) return;

        // Convert to data coordinates
        const dataCoords = this.renderer.canvasToData(canvasX, canvasY);
        const x = dataCoords.x;

        // Find nearest point on curve
        const nearestPoint = this.renderer.findNearestPoint(x);
        if (!nearestPoint) return;

        // Calculate slope at this point
        const slope = this.mathEngine.derivative(
            this.currentProblem.function_expression,
            nearestPoint.x
        );

        // Update display
        this.updateDisplay(nearestPoint.x, nearestPoint.y, slope);

        // Render with current point
        this.renderer.render(this.currentPoints, {
            x: nearestPoint.x,
            y: nearestPoint.y,
            slope: slope
        });

        // Play sound
        const frequency = this.audioEngine.playSlope(slope);

        // Log to analytics
        this.logExploredPoint(nearestPoint.x, nearestPoint.y, slope, frequency);
    }

    /**
     * Handle pointer up
     */
    handlePointerUp() {
        this.isDragging = false;
        this.elements.soundIndicator.textContent = '🔇';
        this.elements.soundIndicator.classList.remove('active');
    }

    /**
     * Update display with current values
     */
    updateDisplay(x, y, slope) {
        this.elements.currentX.textContent = x.toFixed(2);
        this.elements.currentY.textContent = y.toFixed(2);
        this.elements.currentSlope.textContent = slope.toFixed(2);

        const frequency = this.audioEngine.slopeToFrequency(slope);
        this.elements.currentFreq.textContent = `${frequency} Hz`;

        // Update sound indicator
        this.elements.soundIndicator.textContent = '🔊';
        this.elements.soundIndicator.classList.add('active');
    }

    /**
     * Play sound for current slope
     */
    playCurrentSlope() {
        const slopeText = this.elements.currentSlope.textContent;
        if (slopeText === '-') return;

        const slope = parseFloat(slopeText);
        this.audioEngine.playSlope(slope, 500); // Longer duration for button click
    }

    /**
     * Log explored point
     */
    logExploredPoint(x, y, slope, frequency) {
        // Add to explored points if not recently explored
        const isNew = !this.exploredPoints.some(p =>
            Math.abs(p.x - x) < 0.1
        );

        if (isNew) {
            this.exploredPoints.push({ x, y, slope });
            this.updateProgress();

            // Log to Moodle
            try {
                this.moodleAPI.logAudioEvent(x, slope, frequency);
            } catch (error) {
                console.warn('Failed to log audio event:', error);
            }
        }
    }

    /**
     * Update progress
     */
    updateProgress() {
        if (!this.currentProblem) return;

        const totalRange = this.currentProblem.x_max - this.currentProblem.x_min;
        const exploredRange = this.exploredPoints.length * 0.1; // Approximate
        const progress = Math.min(100, (exploredRange / totalRange) * 100);

        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.progressText.textContent = `${Math.round(progress)}%`;

        // Save progress to Moodle
        if (this.exploredPoints.length % 10 === 0) { // Every 10 points
            const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
            try {
                this.moodleAPI.updateAttempt(
                    this.exploredPoints.map(p => p.x),
                    timeSpent,
                    progress >= 80, // Consider complete if 80% explored
                    progress
                );
            } catch (error) {
                console.warn('Failed to update attempt:', error);
            }
        }
    }

    /**
     * Reset current problem
     */
    reset() {
        if (!this.currentProblem) return;

        this.exploredPoints = [];
        this.startTime = Date.now();
        this.renderer.render(this.currentPoints);
        this.updateProgress();

        // Clear display
        this.elements.currentX.textContent = '-';
        this.elements.currentY.textContent = '-';
        this.elements.currentSlope.textContent = '-';
        this.elements.currentFreq.textContent = '-';
    }

    /**
     * Back to problem list
     */
    backToProblemList() {
        this.currentProblem = null;
        this.elements.problemTitle.textContent = '문제를 선택하세요';
        this.elements.playBtn.disabled = true;
        this.renderer.clear();
        this.reset();

        document.querySelectorAll('.problem-item').forEach(item => {
            item.classList.remove('selected');
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SlopeSoundApp();
});
