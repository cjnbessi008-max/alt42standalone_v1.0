/**
 * Area Fill Animation Engine
 *
 * Canvas-based animation for visualizing area calculation
 * with smooth fill animation
 */

class AreaFillAnimation {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id '${canvasId}' not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Default options
        this.options = {
            duration: options.duration || 3000, // milliseconds
            fillColor: options.fillColor || '#667eea',
            strokeColor: options.strokeColor || '#333',
            backgroundColor: options.backgroundColor || '#fafafa',
            lineWidth: options.lineWidth || 2,
            showGrid: options.showGrid !== false,
            gridColor: options.gridColor || '#e9ecef',
            labelColor: options.labelColor || '#333',
            fontSize: options.fontSize || 14,
            onComplete: options.onComplete || null,
            onProgress: options.onProgress || null
        };

        this.animationFrame = null;
        this.isAnimating = false;
        this.progress = 0;
        this.startTime = null;

        // Problem data
        this.problemData = null;
    }

    /**
     * Load problem data and prepare animation
     */
    loadProblem(problemData) {
        this.problemData = problemData;
        this.reset();
        this.drawShape(0); // Draw outline only
    }

    /**
     * Start the fill animation
     */
    start() {
        if (this.isAnimating || !this.problemData) return;

        this.isAnimating = true;
        this.startTime = performance.now();
        this.animate();
    }

    /**
     * Pause the animation
     */
    pause() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    /**
     * Reset animation
     */
    reset() {
        this.pause();
        this.progress = 0;
        this.startTime = null;
        this.clear();
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Main animation loop
     */
    animate() {
        if (!this.isAnimating) return;

        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;

        // Calculate progress (0 to 1) with easing
        const rawProgress = Math.min(elapsed / this.options.duration, 1);
        this.progress = this.easeInOutCubic(rawProgress);

        // Draw current frame
        this.drawShape(this.progress);

        // Fire progress callback
        if (this.options.onProgress) {
            this.options.onProgress(this.progress, this.calculateCurrentArea());
        }

        // Continue animation or complete
        if (this.progress < 1) {
            this.animationFrame = requestAnimationFrame(() => this.animate());
        } else {
            this.complete();
        }
    }

    /**
     * Easing function for smooth animation
     */
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Draw shape with fill progress
     */
    drawShape(fillProgress) {
        this.clear();

        const shape = this.problemData.shape;
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Draw grid if enabled
        if (this.options.showGrid) {
            this.drawGrid();
        }

        // Draw based on shape type
        switch (shape) {
            case 'rectangle':
                this.drawRectangle(centerX, centerY, fillProgress);
                break;
            case 'square':
                this.drawSquare(centerX, centerY, fillProgress);
                break;
            case 'triangle':
                this.drawTriangle(centerX, centerY, fillProgress);
                break;
            case 'parallelogram':
                this.drawParallelogram(centerX, centerY, fillProgress);
                break;
            default:
                this.drawRectangle(centerX, centerY, fillProgress);
        }
    }

    /**
     * Draw grid background
     */
    drawGrid() {
        const gridSize = 20;
        this.ctx.strokeStyle = this.options.gridColor;
        this.ctx.lineWidth = 0.5;

        // Vertical lines
        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw rectangle with fill animation
     */
    drawRectangle(centerX, centerY, fillProgress) {
        const width = this.problemData.width * 15; // Scale for display
        const height = this.problemData.height * 15;
        const x = centerX - width / 2;
        const y = centerY - height / 2;

        // Draw filled portion
        if (fillProgress > 0) {
            this.ctx.fillStyle = this.options.fillColor;
            this.ctx.globalAlpha = 0.6;

            // Fill from bottom to top
            const fillHeight = height * fillProgress;
            this.ctx.fillRect(x, y + height - fillHeight, width, fillHeight);
            this.ctx.globalAlpha = 1.0;
        }

        // Draw outline
        this.ctx.strokeStyle = this.options.strokeColor;
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.strokeRect(x, y, width, height);

        // Draw dimensions
        this.drawDimensionLabel(x + width / 2, y - 10, `${this.problemData.width}cm`);
        this.drawDimensionLabel(x - 20, y + height / 2, `${this.problemData.height}cm`, 90);
    }

    /**
     * Draw square with fill animation
     */
    drawSquare(centerX, centerY, fillProgress) {
        const side = this.problemData.side * 15;
        const x = centerX - side / 2;
        const y = centerY - side / 2;

        // Draw filled portion
        if (fillProgress > 0) {
            this.ctx.fillStyle = this.options.fillColor;
            this.ctx.globalAlpha = 0.6;

            const fillHeight = side * fillProgress;
            this.ctx.fillRect(x, y + side - fillHeight, side, fillHeight);
            this.ctx.globalAlpha = 1.0;
        }

        // Draw outline
        this.ctx.strokeStyle = this.options.strokeColor;
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.strokeRect(x, y, side, side);

        // Draw dimensions
        this.drawDimensionLabel(x + side / 2, y - 10, `${this.problemData.side}cm`);
        this.drawDimensionLabel(x - 20, y + side / 2, `${this.problemData.side}cm`, 90);
    }

    /**
     * Draw triangle with fill animation
     */
    drawTriangle(centerX, centerY, fillProgress) {
        const base = this.problemData.base * 15;
        const height = this.problemData.height * 15;

        const x1 = centerX - base / 2;
        const y1 = centerY + height / 2;
        const x2 = centerX + base / 2;
        const y2 = centerY + height / 2;
        const x3 = centerX;
        const y3 = centerY - height / 2;

        // Draw filled portion (bottom to top)
        if (fillProgress > 0) {
            this.ctx.fillStyle = this.options.fillColor;
            this.ctx.globalAlpha = 0.6;

            const fillHeight = height * fillProgress;
            const currentY = y1 - fillHeight;
            const currentBase = base * (1 - fillProgress);

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.lineTo(centerX + currentBase / 2, currentY);
            this.ctx.lineTo(centerX - currentBase / 2, currentY);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }

        // Draw outline
        this.ctx.strokeStyle = this.options.strokeColor;
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.lineTo(x3, y3);
        this.ctx.closePath();
        this.ctx.stroke();

        // Draw height line
        this.ctx.strokeStyle = '#999';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x3, y3);
        this.ctx.lineTo(x3, y1);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw dimensions
        this.drawDimensionLabel(centerX, y1 + 20, `${this.problemData.base}cm`);
        this.drawDimensionLabel(x3 + 25, centerY, `${this.problemData.height}cm`, 90);
    }

    /**
     * Draw parallelogram with fill animation
     */
    drawParallelogram(centerX, centerY, fillProgress) {
        const base = this.problemData.base * 15;
        const height = this.problemData.height * 15;
        const skew = 30; // Skew angle in pixels

        const x = centerX - base / 2;
        const y = centerY - height / 2;

        // Draw filled portion
        if (fillProgress > 0) {
            this.ctx.fillStyle = this.options.fillColor;
            this.ctx.globalAlpha = 0.6;

            const fillHeight = height * fillProgress;

            this.ctx.beginPath();
            this.ctx.moveTo(x + skew, y + height);
            this.ctx.lineTo(x + skew + base, y + height);
            this.ctx.lineTo(x + skew + base * (1 - fillProgress), y + height - fillHeight);
            this.ctx.lineTo(x + skew * (1 - fillProgress), y + height - fillHeight);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }

        // Draw outline
        this.ctx.strokeStyle = this.options.strokeColor;
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x + skew, y + height);
        this.ctx.lineTo(x + skew + base, y + height);
        this.ctx.lineTo(x + base, y);
        this.ctx.lineTo(x, y);
        this.ctx.closePath();
        this.ctx.stroke();

        // Draw height line
        this.ctx.strokeStyle = '#999';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x + skew, y + height);
        this.ctx.lineTo(x + skew, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw dimensions
        this.drawDimensionLabel(x + skew + base / 2, y + height + 20, `${this.problemData.base}cm`);
        this.drawDimensionLabel(x + skew - 25, centerY, `${this.problemData.height}cm`, 90);
    }

    /**
     * Draw dimension label
     */
    drawDimensionLabel(x, y, text, rotation = 0) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate((rotation * Math.PI) / 180);

        this.ctx.font = `bold ${this.options.fontSize}px 'Segoe UI', sans-serif`;
        this.ctx.fillStyle = this.options.labelColor;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Background
        const metrics = this.ctx.measureText(text);
        const padding = 6;
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(
            -metrics.width / 2 - padding,
            -this.options.fontSize / 2 - padding,
            metrics.width + padding * 2,
            this.options.fontSize + padding * 2
        );

        // Text
        this.ctx.fillStyle = this.options.labelColor;
        this.ctx.fillText(text, 0, 0);

        this.ctx.restore();
    }

    /**
     * Calculate current area based on progress
     */
    calculateCurrentArea() {
        return Math.round(this.problemData.answer * this.progress * 100) / 100;
    }

    /**
     * Complete animation
     */
    complete() {
        this.isAnimating = false;
        this.progress = 1;

        if (this.options.onComplete) {
            this.options.onComplete(this.problemData.answer);
        }
    }
}

/**
 * App Controller
 */
class AreaFillApp {
    constructor() {
        this.animation = null;
        this.currentProblem = null;
        this.apiEndpoint = 'api/get_problem.php';

        this.init();
    }

    /**
     * Initialize app
     */
    init() {
        // Initialize canvas
        this.animation = new AreaFillAnimation('animationCanvas', {
            duration: 3000,
            fillColor: '#667eea',
            onProgress: (progress, currentArea) => {
                this.updateProgress(progress, currentArea);
            },
            onComplete: (finalArea) => {
                this.onAnimationComplete(finalArea);
            }
        });

        // Setup event listeners
        this.setupEventListeners();

        // Load initial problem
        this.loadNewProblem();
    }

    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        document.getElementById('startBtn')?.addEventListener('click', () => {
            this.animation.start();
        });

        document.getElementById('pauseBtn')?.addEventListener('click', () => {
            this.animation.pause();
        });

        document.getElementById('resetBtn')?.addEventListener('click', () => {
            this.animation.reset();
            this.animation.drawShape(0);
            this.hideAnswer();
        });

        document.getElementById('newProblemBtn')?.addEventListener('click', () => {
            this.loadNewProblem();
        });
    }

    /**
     * Load new problem from API
     */
    async loadNewProblem() {
        try {
            const response = await fetch(`${this.apiEndpoint}?mode=sample`);
            const data = await response.json();

            if (data.success && data.data) {
                this.currentProblem = data.data;
                this.displayProblem(data.data);
                this.animation.loadProblem(data.data);
                this.hideAnswer();
            } else {
                console.error('Failed to load problem:', data.message);
            }
        } catch (error) {
            console.error('Error fetching problem:', error);
        }
    }

    /**
     * Display problem information
     */
    displayProblem(problem) {
        const titleEl = document.getElementById('problemTitle');
        const textEl = document.getElementById('problemText');

        if (titleEl) titleEl.textContent = problem.name;
        if (textEl) textEl.textContent = problem.questiontext;
    }

    /**
     * Update progress display
     */
    updateProgress(progress, currentArea) {
        const progressEl = document.getElementById('progressValue');
        const areaEl = document.getElementById('currentArea');

        if (progressEl) {
            progressEl.textContent = `${Math.round(progress * 100)}%`;
        }

        if (areaEl) {
            areaEl.textContent = `${currentArea}${this.currentProblem.unit}`;
        }
    }

    /**
     * Handle animation completion
     */
    onAnimationComplete(finalArea) {
        this.showAnswer(finalArea);
    }

    /**
     * Show answer
     */
    showAnswer(area) {
        const answerEl = document.getElementById('answerDisplay');
        if (answerEl) {
            answerEl.textContent = `정답: ${area}${this.currentProblem.unit}`;
            answerEl.classList.add('show');
        }
    }

    /**
     * Hide answer
     */
    hideAnswer() {
        const answerEl = document.getElementById('answerDisplay');
        if (answerEl) {
            answerEl.classList.remove('show');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AreaFillApp();
});
