/**
 * Main Application Controller
 * Integrates LMS connection and Rotational Sweep animation
 */

class App {
    constructor() {
        this.lms = null;
        this.rotationalSweep = null;
        this.currentProblem = null;

        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        console.log('Initializing Rotational Sweep Application...');

        // Initialize LMS integration
        this.lms = new LMSIntegration();
        await this.lms.initialize();

        // Get problem data
        this.currentProblem = this.lms.getProblem();

        // Initialize Three.js rotational sweep
        this.rotationalSweep = new RotationalSweep('three-container');

        // Apply problem parameters
        if (this.currentProblem && this.currentProblem.parameters) {
            this.rotationalSweep.updateParameters(this.currentProblem.parameters);
            this.updateControlsFromProblem();
        }

        // Setup event listeners
        this.setupEventListeners();

        console.log('Application initialized successfully');
    }

    /**
     * Update UI controls from problem data
     */
    updateControlsFromProblem() {
        if (!this.currentProblem) return;

        const params = this.currentProblem.parameters;

        // Update rotation speed
        const speedSlider = document.getElementById('rotation-speed');
        const speedValue = document.getElementById('speed-value');
        if (speedSlider && params.rotationSpeed) {
            speedSlider.value = params.rotationSpeed;
            speedValue.textContent = params.rotationSpeed.toFixed(1);
        }

        // Update spiral pitch
        const pitchSlider = document.getElementById('spiral-pitch');
        const pitchValue = document.getElementById('pitch-value');
        if (pitchSlider && params.spiralPitch) {
            pitchSlider.value = params.spiralPitch;
            pitchValue.textContent = params.spiralPitch.toFixed(1);
        }

        // Update segments
        const segmentsSlider = document.getElementById('segments');
        const segmentsValue = document.getElementById('segments-value');
        if (segmentsSlider && params.segments) {
            segmentsSlider.value = params.segments;
            segmentsValue.textContent = params.segments;
        }
    }

    /**
     * Setup event listeners for UI controls
     */
    setupEventListeners() {
        // Rotation speed slider
        const speedSlider = document.getElementById('rotation-speed');
        const speedValue = document.getElementById('speed-value');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                speedValue.textContent = value.toFixed(1);
                this.rotationalSweep.updateParameters({ rotationSpeed: value });
                this.lms.updateParameters({ rotationSpeed: value });
            });
        }

        // Spiral pitch slider
        const pitchSlider = document.getElementById('spiral-pitch');
        const pitchValue = document.getElementById('pitch-value');
        if (pitchSlider) {
            pitchSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                pitchValue.textContent = value.toFixed(1);
                this.rotationalSweep.updateParameters({ spiralPitch: value });
                this.lms.updateParameters({ spiralPitch: value });
            });
        }

        // Segments slider
        const segmentsSlider = document.getElementById('segments');
        const segmentsValue = document.getElementById('segments-value');
        if (segmentsSlider) {
            segmentsSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                segmentsValue.textContent = value;
                this.rotationalSweep.updateParameters({ segments: value });
                this.lms.updateParameters({ segments: value });
            });
        }

        // Start animation button
        const startButton = document.getElementById('start-animation');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.startAnimation();
            });
        }

        // Reset animation button
        const resetButton = document.getElementById('reset-animation');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetAnimation();
            });
        }

        // Toggle wireframe button
        const wireframeButton = document.getElementById('toggle-wireframe');
        if (wireframeButton) {
            wireframeButton.addEventListener('click', () => {
                const isEnabled = this.rotationalSweep.toggleWireframe();
                wireframeButton.textContent = isEnabled ? '와이어프레임 끄기' : '와이어프레임 켜기';
            });
        }

        // Listen for animation complete events
        window.addEventListener('animationComplete', (event) => {
            this.onAnimationComplete(event.detail);
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.startAnimation();
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                this.resetAnimation();
            } else if (e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                const wireframeButton = document.getElementById('toggle-wireframe');
                if (wireframeButton) wireframeButton.click();
            }
        });
    }

    /**
     * Start animation with current problem data
     */
    startAnimation() {
        if (!this.currentProblem) {
            console.error('No problem data available');
            return;
        }

        console.log('Starting animation for problem:', this.currentProblem.id);

        this.rotationalSweep.startAnimation(
            this.currentProblem.curveFunction,
            this.currentProblem.bounds
        );

        // Track start event in LMS
        this.lms.submitProgress({
            event: 'animation_started',
            problemId: this.currentProblem.id,
            timestamp: Date.now(),
            parameters: this.rotationalSweep.params
        });
    }

    /**
     * Reset animation
     */
    resetAnimation() {
        console.log('Resetting animation');
        this.rotationalSweep.resetAnimation();

        // Track reset event in LMS
        this.lms.submitProgress({
            event: 'animation_reset',
            problemId: this.currentProblem?.id,
            timestamp: Date.now()
        });
    }

    /**
     * Handle animation completion
     */
    onAnimationComplete(detail) {
        console.log('Animation completed:', detail);

        // Submit completion to LMS
        this.lms.submitProgress({
            event: 'animation_completed',
            problemId: this.currentProblem?.id,
            timestamp: detail.timestamp,
            progress: detail.progress,
            parameters: this.rotationalSweep.params,
            completed: true
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Show loading indicator
console.log('%c회전체 생성 애플리케이션 (Rotational Sweep Animation)', 'font-size: 20px; font-weight: bold; color: #667eea;');
console.log('%cMoodle LMS Integration: MySQL 5.7 | PHP 7.1.9 | Moodle 3.7', 'color: #764ba2;');
console.log('%cKeyboard Shortcuts:', 'font-weight: bold;');
console.log('  Space: Start Animation');
console.log('  R: Reset');
console.log('  W: Toggle Wireframe');
