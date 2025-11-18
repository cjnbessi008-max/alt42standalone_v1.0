/**
 * Main Application
 * Symmetry Discovery Interactive App
 */

class SymmetryDiscoveryApp {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('shape-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Initialize modules
        this.shapeLibrary = new ShapeLibrary();
        this.detector = new SymmetryDetector();
        this.lineRenderer = new SymmetryLineRenderer(this.canvas, this.ctx);
        this.particles = new ParticleEffect();
        this.sound = new SoundEffect();
        this.feedback = new FeedbackManager();
        this.moodle = new MoodleIntegration();

        // State
        this.currentShape = null;
        this.rotation = 0;
        this.isDragging = false;
        this.lastMouseAngle = 0;
        this.score = 0;
        this.highScore = 0;
        this.level = 1;

        // Touch/Mouse tracking
        this.startX = 0;
        this.startY = 0;
        this.centerX = 0;
        this.centerY = 0;

        // Animation
        this.animationId = null;
        this.isAnimating = true;

        // Initialize
        this.init();
    }

    /**
     * Initialize application
     */
    async init() {
        // Initialize Moodle integration
        const moodleResult = await this.moodle.init();
        console.log('Moodle integration:', moodleResult);

        // Load saved progress
        await this.loadProgress();

        // Set up canvas
        this.setupCanvas();

        // Load first shape
        this.loadShape(this.shapeLibrary.getCurrentShape());

        // Set up event listeners
        this.setupEventListeners();

        // Start animation loop
        this.animate();

        // Initialize sound (requires user interaction)
        document.addEventListener('click', () => {
            this.sound.init();
        }, { once: true });

        // Log app start
        this.moodle.logEvent('app_start', {
            timestamp: Date.now()
        });
    }

    /**
     * Set up canvas dimensions
     */
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleEnd());
        this.canvas.addEventListener('mouseleave', () => this.handleEnd());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleEnd();
        });

        // Button events
        document.getElementById('next-shape-btn').addEventListener('click', () => {
            this.nextShape();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetShape();
        });

        document.getElementById('hint-btn').addEventListener('click', () => {
            this.showHint();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
    }

    /**
     * Load a shape
     */
    loadShape(shape) {
        this.currentShape = shape;
        this.rotation = 0;
        this.detector.resetForNewShape(shape);
        this.lineRenderer.clear();

        // Update UI
        this.updateUI();

        // Log shape load
        this.moodle.logEvent('shape_load', {
            shape_id: shape.id,
            shape_name: shape.name
        });
    }

    /**
     * Handle drag start
     */
    handleStart(e) {
        this.isDragging = true;
        this.startX = e.clientX || e.pageX;
        this.startY = e.clientY || e.pageY;

        const rect = this.canvas.getBoundingClientRect();
        const x = this.startX - rect.left;
        const y = this.startY - rect.top;

        this.lastMouseAngle = this.calculateAngle(x, y);
    }

    /**
     * Handle drag move
     */
    handleMove(e) {
        if (!this.isDragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.pageX) - rect.left;
        const y = (e.clientY || e.pageY) - rect.top;

        const currentAngle = this.calculateAngle(x, y);
        const angleDiff = currentAngle - this.lastMouseAngle;

        this.rotation += angleDiff;
        this.rotation = this.rotation % 360;
        if (this.rotation < 0) this.rotation += 360;

        this.lastMouseAngle = currentAngle;

        // Check for symmetry
        this.checkSymmetry();
    }

    /**
     * Handle drag end
     */
    handleEnd() {
        this.isDragging = false;
    }

    /**
     * Calculate angle from center
     */
    calculateAngle(x, y) {
        const dx = x - this.centerX;
        const dy = y - this.centerY;
        return Math.atan2(dy, dx) * (180 / Math.PI);
    }

    /**
     * Check for symmetry discovery
     */
    checkSymmetry() {
        const result = this.detector.checkSymmetry(this.rotation, this.currentShape);

        if (result) {
            this.onSymmetryDiscovered(result);
        }
    }

    /**
     * Handle symmetry discovery
     */
    onSymmetryDiscovered(result) {
        // Mark as discovered
        this.detector.discoverSymmetry(result.key);

        // Reveal symmetry line
        const canvasRect = this.canvas.getBoundingClientRect();
        this.lineRenderer.revealSymmetryLine(
            this.centerX,
            this.centerY,
            result.symmetryLine.angle,
            Math.max(this.canvas.width, this.canvas.height) / 2
        );

        // Calculate score
        const earnedScore = this.detector.calculateScore(
            result.accuracy,
            this.currentShape.difficulty
        );
        this.score += earnedScore;

        // Visual effects
        this.particles.createFirework(
            canvasRect.left + this.centerX,
            canvasRect.top + this.centerY
        );
        this.particles.createScreenFlash();

        // Sound effect
        this.sound.playSuccess();

        // Feedback message
        const discoveredCount = this.detector.getDiscoveredCount(this.currentShape);
        const totalCount = this.currentShape.symmetryLines.length;

        this.feedback.showSuccess(
            `🎉 대칭선 발견! +${earnedScore}점 (${discoveredCount}/${totalCount})`
        );

        // Update UI
        this.updateUI();

        // Check if all symmetries found
        if (this.detector.allSymmetriesDiscovered(this.currentShape)) {
            setTimeout(() => {
                this.onShapeCompleted();
            }, 1000);
        }

        // Log event
        this.moodle.logEvent('symmetry_discovered', {
            shape_id: this.currentShape.id,
            symmetry_angle: result.symmetryLine.angle,
            accuracy: result.accuracy,
            score: earnedScore
        });

        // Save progress
        this.saveProgress();
    }

    /**
     * Handle shape completion
     */
    onShapeCompleted() {
        const bonusScore = 500 * this.currentShape.difficulty;
        this.score += bonusScore;

        this.sound.playComplete();
        this.feedback.showSuccess(
            `✨ 완성! 보너스 +${bonusScore}점!`,
            3000
        );

        // Celebration effect
        const canvasRect = this.canvas.getBoundingClientRect();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.particles.createFirework(
                    canvasRect.left + this.centerX,
                    canvasRect.top + this.centerY
                );
            }, i * 200);
        }

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
        }

        this.updateUI();

        // Log completion
        this.moodle.logEvent('shape_completed', {
            shape_id: this.currentShape.id,
            total_score: this.score,
            bonus_score: bonusScore
        });

        // Save progress
        this.saveProgress();

        // Auto-advance to next shape
        setTimeout(() => {
            this.nextShape();
        }, 2000);
    }

    /**
     * Next shape
     */
    nextShape() {
        const nextShape = this.shapeLibrary.nextShape();
        this.loadShape(nextShape);
        this.level++;

        this.feedback.showMessage(
            `레벨 ${this.level}: ${nextShape.name}`,
            'hint',
            2000
        );
    }

    /**
     * Reset current shape
     */
    resetShape() {
        this.rotation = 0;
        this.detector.resetForNewShape(this.currentShape);
        this.lineRenderer.clear();
        this.updateUI();

        this.feedback.showMessage('초기화됨', 'hint', 1000);

        // Log reset
        this.moodle.logEvent('shape_reset', {
            shape_id: this.currentShape.id
        });
    }

    /**
     * Show hint
     */
    showHint() {
        const hint = this.detector.getHint(this.rotation, this.currentShape);

        if (!hint) {
            this.feedback.showHint('모든 대칭선을 발견했습니다!');
            return;
        }

        const direction = this.detector.getDirectionHint(this.rotation, hint.angle);
        const directionText = direction === 'clockwise' ? '시계 방향' : '반시계 방향';

        this.feedback.showHint(
            `💡 힌트: ${directionText}으로 회전해보세요!`
        );

        this.sound.playHint();

        // Log hint usage
        this.moodle.logEvent('hint_used', {
            shape_id: this.currentShape.id,
            current_rotation: this.rotation,
            target_angle: hint.angle
        });
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isAnimating) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw shape
        if (this.currentShape) {
            this.currentShape.draw(
                this.ctx,
                this.centerX,
                this.centerY,
                Math.min(this.canvas.width, this.canvas.height) * 0.25,
                this.rotation
            );
        }

        // Draw symmetry lines
        this.lineRenderer.update(this.centerX, this.centerY);

        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Update UI elements
     */
    updateUI() {
        // Update level
        document.getElementById('current-level').textContent = this.level;

        // Update shape info
        if (this.currentShape) {
            document.getElementById('shape-description').textContent =
                this.currentShape.description;

            // Update symmetry progress
            const discovered = this.detector.getDiscoveredCount(this.currentShape);
            const total = this.currentShape.symmetryLines.length;
            document.getElementById('found-symmetries').textContent = discovered;
            document.getElementById('total-symmetries').textContent = total;

            // Update progress bar
            const progress = (discovered / total) * 100;
            document.getElementById('progress-fill').style.width = progress + '%';
        }

        // Update score
        document.getElementById('score').textContent = this.score;
        document.getElementById('high-score').textContent = this.highScore;
    }

    /**
     * Save progress
     */
    async saveProgress() {
        const progressData = {
            score: this.score,
            highScore: this.highScore,
            level: this.level,
            currentShapeIndex: this.shapeLibrary.currentShapeIndex,
            timestamp: Date.now()
        };

        await this.moodle.saveProgress(progressData);
    }

    /**
     * Load progress
     */
    async loadProgress() {
        const progressData = await this.moodle.loadProgress();

        if (progressData) {
            this.score = progressData.score || 0;
            this.highScore = progressData.highScore || 0;
            this.level = progressData.level || 1;
            this.shapeLibrary.currentShapeIndex = progressData.currentShapeIndex || 0;
        }
    }

    /**
     * Clean up
     */
    destroy() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new SymmetryDiscoveryApp();
    window.symmetryApp = app; // Make available globally for debugging
});
