/**
 * Shift Trail Module
 *
 * Handles vector translation visualization with trail tracking
 * - Records vector movement as user drags
 * - Displays animated line trail showing the path
 * - Calculates translation vectors and distance
 * - Syncs trail data to backend
 */

class ShiftTrail {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Configuration
        this.config = {
            trailColor: options.trailColor || '#3498db',
            trailWidth: options.trailWidth || 3,
            vectorColor: options.vectorColor || '#e74c3c',
            vectorWidth: options.vectorWidth || 2,
            gridSize: options.gridSize || 20,
            animationDuration: options.animationDuration || 1000,
            samplingInterval: options.samplingInterval || 50, // ms between trail samples
            enableTrailRecording: options.enableTrailRecording !== false,
            showGrid: options.showGrid !== false,
            onTrailCreate: options.onTrailCreate || null,
            onTrailUpdate: options.onTrailUpdate || null
        };

        // State
        this.vector = {
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            length: 0,
            angle: 0
        };

        this.trail = {
            points: [],
            isRecording: false,
            startTime: null,
            color: this.config.trailColor,
            width: this.config.trailWidth
        };

        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.animationFrame = null;
        this.lastSampleTime = 0;

        // Initialize
        this.init();
    }

    /**
     * Initialize canvas and event listeners
     */
    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.render();

        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
        });
    }

    /**
     * Resize canvas to container dimensions
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Set default vector if not set
        if (this.vector.endX === 0 && this.vector.endY === 0) {
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;

            this.setVector(
                centerX - 50,
                centerY - 50,
                centerX + 50,
                centerY + 50
            );
        }
    }

    /**
     * Set vector coordinates
     */
    setVector(x1, y1, x2, y2) {
        this.vector.startX = x1;
        this.vector.startY = y1;
        this.vector.endX = x2;
        this.vector.endY = y2;
        this.updateVectorMetrics();
    }

    /**
     * Update vector length and angle
     */
    updateVectorMetrics() {
        const dx = this.vector.endX - this.vector.startX;
        const dy = this.vector.endY - this.vector.startY;

        this.vector.length = Math.sqrt(dx * dx + dy * dy);
        this.vector.angle = Math.atan2(dy, dx) * (180 / Math.PI);
    }

    /**
     * Setup mouse and touch event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleDragStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleDragMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleDragEnd(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleDragEnd(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleDragStart(touch);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleDragMove(touch);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleDragEnd(e);
        });
    }

    /**
     * Handle drag start
     */
    handleDragStart(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking near vector (within 10px of arrow line or head)
        if (this.isNearVector(x, y)) {
            this.isDragging = true;

            // Calculate offset from vector start
            this.dragOffset.x = x - this.vector.startX;
            this.dragOffset.y = y - this.vector.startY;

            // Start trail recording
            if (this.config.enableTrailRecording) {
                this.startTrailRecording();
            }

            this.canvas.style.cursor = 'grabbing';
        }
    }

    /**
     * Handle drag move
     */
    handleDragMove(e) {
        if (!this.isDragging) {
            // Update cursor if hovering over vector
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.canvas.style.cursor = this.isNearVector(x, y) ? 'grab' : 'default';
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate translation (maintaining vector shape)
        const dx = this.vector.endX - this.vector.startX;
        const dy = this.vector.endY - this.vector.startY;

        const newStartX = x - this.dragOffset.x;
        const newStartY = y - this.dragOffset.y;

        this.vector.startX = newStartX;
        this.vector.startY = newStartY;
        this.vector.endX = newStartX + dx;
        this.vector.endY = newStartY + dy;

        this.updateVectorMetrics();

        // Record trail point
        if (this.trail.isRecording) {
            const now = Date.now();
            if (now - this.lastSampleTime >= this.config.samplingInterval) {
                this.addTrailPoint(this.vector.startX, this.vector.startY);
                this.lastSampleTime = now;
            }
        }

        this.render();

        // Callback
        if (this.config.onTrailUpdate) {
            this.config.onTrailUpdate(this.getTrailData());
        }
    }

    /**
     * Handle drag end
     */
    handleDragEnd(e) {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.canvas.style.cursor = 'default';

        // Stop trail recording
        if (this.trail.isRecording) {
            this.stopTrailRecording();
        }

        // Callback
        if (this.config.onTrailCreate && this.trail.points.length > 0) {
            this.config.onTrailCreate(this.getTrailData());
        }
    }

    /**
     * Check if point is near vector
     */
    isNearVector(x, y) {
        const threshold = 10;

        // Check distance to line segment
        const dx = this.vector.endX - this.vector.startX;
        const dy = this.vector.endY - this.vector.startY;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) {
            // Vector is a point
            const dist = Math.sqrt(
                Math.pow(x - this.vector.startX, 2) +
                Math.pow(y - this.vector.startY, 2)
            );
            return dist <= threshold;
        }

        // Project point onto line
        const t = Math.max(0, Math.min(1,
            ((x - this.vector.startX) * dx + (y - this.vector.startY) * dy) / lengthSq
        ));

        const projX = this.vector.startX + t * dx;
        const projY = this.vector.startY + t * dy;

        const dist = Math.sqrt(
            Math.pow(x - projX, 2) +
            Math.pow(y - projY, 2)
        );

        return dist <= threshold;
    }

    /**
     * Start trail recording
     */
    startTrailRecording() {
        this.trail.isRecording = true;
        this.trail.startTime = Date.now();
        this.trail.points = [];
        this.lastSampleTime = Date.now();

        // Add initial point
        this.addTrailPoint(this.vector.startX, this.vector.startY);
    }

    /**
     * Add point to trail
     */
    addTrailPoint(x, y) {
        const elapsed = Date.now() - this.trail.startTime;

        this.trail.points.push({
            x: Math.round(x * 100) / 100,
            y: Math.round(y * 100) / 100,
            timestamp: elapsed
        });
    }

    /**
     * Stop trail recording
     */
    stopTrailRecording() {
        this.trail.isRecording = false;

        // Add final point
        if (this.trail.points.length > 0) {
            const lastPoint = this.trail.points[this.trail.points.length - 1];
            if (lastPoint.x !== this.vector.startX || lastPoint.y !== this.vector.startY) {
                this.addTrailPoint(this.vector.startX, this.vector.startY);
            }
        }
    }

    /**
     * Get trail data for export
     */
    getTrailData() {
        return {
            vector: {
                startX: this.vector.startX,
                startY: this.vector.startY,
                endX: this.vector.endX,
                endY: this.vector.endY,
                length: this.vector.length,
                angle: this.vector.angle
            },
            trail: {
                points: this.trail.points,
                color: this.trail.color,
                width: this.trail.width,
                duration: this.trail.points.length > 0
                    ? this.trail.points[this.trail.points.length - 1].timestamp
                    : 0
            },
            translation: this.getTranslationVector()
        };
    }

    /**
     * Calculate translation vector from trail
     */
    getTranslationVector() {
        if (this.trail.points.length < 2) {
            return { dx: 0, dy: 0, distance: 0, angle: 0 };
        }

        const firstPoint = this.trail.points[0];
        const lastPoint = this.trail.points[this.trail.points.length - 1];

        const dx = lastPoint.x - firstPoint.x;
        const dy = lastPoint.y - firstPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return {
            dx: Math.round(dx * 100) / 100,
            dy: Math.round(dy * 100) / 100,
            distance: Math.round(distance * 100) / 100,
            angle: Math.round(angle * 100) / 100
        };
    }

    /**
     * Clear trail
     */
    clearTrail() {
        this.trail.points = [];
        this.trail.isRecording = false;
        this.render();
    }

    /**
     * Render canvas
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        if (this.config.showGrid) {
            this.drawGrid();
        }

        // Draw trail
        if (this.trail.points.length > 0) {
            this.drawTrail();
        }

        // Draw vector
        this.drawVector();
    }

    /**
     * Draw grid
     */
    drawGrid() {
        const { width, height } = this.canvas;
        const { gridSize } = this.config;

        this.ctx.strokeStyle = '#ecf0f1';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        // Draw axes
        this.ctx.strokeStyle = '#bdc3c7';
        this.ctx.lineWidth = 2;

        // X-axis
        const centerY = height / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(width, centerY);
        this.ctx.stroke();

        // Y-axis
        const centerX = width / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, height);
        this.ctx.stroke();
    }

    /**
     * Draw trail line
     */
    drawTrail() {
        if (this.trail.points.length < 2) return;

        this.ctx.strokeStyle = this.trail.color;
        this.ctx.lineWidth = this.trail.width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw trail path
        this.ctx.beginPath();
        this.ctx.moveTo(this.trail.points[0].x, this.trail.points[0].y);

        for (let i = 1; i < this.trail.points.length; i++) {
            this.ctx.lineTo(this.trail.points[i].x, this.trail.points[i].y);
        }

        this.ctx.stroke();

        // Draw trail markers at key points
        this.ctx.fillStyle = this.trail.color;

        // Start point
        this.ctx.beginPath();
        this.ctx.arc(this.trail.points[0].x, this.trail.points[0].y, 5, 0, 2 * Math.PI);
        this.ctx.fill();

        // End point
        const lastPoint = this.trail.points[this.trail.points.length - 1];
        this.ctx.beginPath();
        this.ctx.arc(lastPoint.x, lastPoint.y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Draw vector arrow
     */
    drawVector() {
        const { startX, startY, endX, endY } = this.vector;

        // Draw vector line
        this.ctx.strokeStyle = this.config.vectorColor;
        this.ctx.lineWidth = this.config.vectorWidth;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;

        this.ctx.fillStyle = this.config.vectorColor;
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - arrowLength * Math.cos(angle - arrowAngle),
            endY - arrowLength * Math.sin(angle - arrowAngle)
        );
        this.ctx.lineTo(
            endX - arrowLength * Math.cos(angle + arrowAngle),
            endY - arrowLength * Math.sin(angle + arrowAngle)
        );
        this.ctx.closePath();
        this.ctx.fill();

        // Draw vector endpoints
        this.ctx.fillStyle = this.config.vectorColor;

        // Start point
        this.ctx.beginPath();
        this.ctx.arc(startX, startY, 6, 0, 2 * Math.PI);
        this.ctx.fill();

        // Add white border for visibility
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * Animate trail playback
     */
    async animateTrail() {
        if (this.trail.points.length < 2) return;

        const duration = this.config.animationDuration;
        const points = this.trail.points;
        const totalTime = points[points.length - 1].timestamp;

        return new Promise((resolve) => {
            let startTime = null;

            const animate = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Find current point in trail based on progress
                const targetTime = progress * totalTime;
                let currentIndex = 0;

                for (let i = 0; i < points.length; i++) {
                    if (points[i].timestamp <= targetTime) {
                        currentIndex = i;
                    } else {
                        break;
                    }
                }

                // Render trail up to current point
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                if (this.config.showGrid) {
                    this.drawGrid();
                }

                // Draw partial trail
                if (currentIndex > 0) {
                    this.ctx.strokeStyle = this.trail.color;
                    this.ctx.lineWidth = this.trail.width;
                    this.ctx.lineCap = 'round';
                    this.ctx.lineJoin = 'round';

                    this.ctx.beginPath();
                    this.ctx.moveTo(points[0].x, points[0].y);

                    for (let i = 1; i <= currentIndex; i++) {
                        this.ctx.lineTo(points[i].x, points[i].y);
                    }

                    this.ctx.stroke();
                }

                // Draw vector at current position
                const currentPoint = points[currentIndex];
                const dx = this.vector.endX - points[0].x;
                const dy = this.vector.endY - points[0].y;

                const tempVector = {
                    startX: currentPoint.x,
                    startY: currentPoint.y,
                    endX: currentPoint.x + dx,
                    endY: currentPoint.y + dy
                };

                const originalVector = { ...this.vector };
                this.vector = tempVector;
                this.drawVector();
                this.vector = originalVector;

                if (progress < 1) {
                    this.animationFrame = requestAnimationFrame(animate);
                } else {
                    this.render();
                    resolve();
                }
            };

            this.animationFrame = requestAnimationFrame(animate);
        });
    }

    /**
     * Stop animation
     */
    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.stopAnimation();
        this.clearTrail();
        this.isDragging = false;

        // Reset vector to center
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.setVector(
            centerX - 50,
            centerY - 50,
            centerX + 50,
            centerY + 50
        );

        this.render();
    }

    /**
     * Destroy instance
     */
    destroy() {
        this.stopAnimation();

        // Remove event listeners (would need to store bound functions)
        // For now, just clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShiftTrail;
}
