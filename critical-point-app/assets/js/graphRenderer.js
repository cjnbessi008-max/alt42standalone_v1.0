/**
 * Graph Renderer for Function Visualization
 * Handles canvas drawing, animation, and critical point highlighting
 */

class GraphRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.xMin = -5;
        this.xMax = 5;
        this.yMin = -10;
        this.yMax = 10;
        this.criticalPoints = [];
        this.showCriticalPoints = false;
        this.blinkPhase = 0;
        this.animationId = null;

        this.initCanvas();
    }

    /**
     * Initialize canvas dimensions
     */
    initCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    /**
     * Convert mathematical coordinates to canvas coordinates
     * @param {number} x - Mathematical x coordinate
     * @param {number} y - Mathematical y coordinate
     * @returns {Object} Canvas coordinates {x, y}
     */
    toCanvasCoords(x, y) {
        const canvasX = ((x - this.xMin) / (this.xMax - this.xMin)) * this.width;
        const canvasY = this.height - ((y - this.yMin) / (this.yMax - this.yMin)) * this.height;
        return { x: canvasX, y: canvasY };
    }

    /**
     * Draw grid and axes
     */
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        // Vertical grid lines
        for (let x = Math.ceil(this.xMin); x <= this.xMax; x++) {
            const coords = this.toCanvasCoords(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(coords.x, 0);
            this.ctx.lineTo(coords.x, this.height);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        for (let y = Math.ceil(this.yMin); y <= this.yMax; y++) {
            const coords = this.toCanvasCoords(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, coords.y);
            this.ctx.lineTo(this.width, coords.y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw coordinate axes
     */
    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;

        // X-axis
        const xAxisY = this.toCanvasCoords(0, 0).y;
        this.ctx.beginPath();
        this.ctx.moveTo(0, xAxisY);
        this.ctx.lineTo(this.width, xAxisY);
        this.ctx.stroke();

        // Y-axis
        const yAxisX = this.toCanvasCoords(0, 0).x;
        this.ctx.beginPath();
        this.ctx.moveTo(yAxisX, 0);
        this.ctx.lineTo(yAxisX, this.height);
        this.ctx.stroke();

        // Draw axis labels
        this.ctx.fillStyle = '#333';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';

        // X-axis labels
        for (let x = Math.ceil(this.xMin); x <= this.xMax; x++) {
            if (x === 0) continue;
            const coords = this.toCanvasCoords(x, 0);
            this.ctx.fillText(x.toString(), coords.x, coords.y + 15);
        }

        // Y-axis labels
        this.ctx.textAlign = 'right';
        for (let y = Math.ceil(this.yMin); y <= this.yMax; y++) {
            if (y === 0) continue;
            const coords = this.toCanvasCoords(0, y);
            this.ctx.fillText(y.toString(), coords.x - 5, coords.y + 3);
        }
    }

    /**
     * Draw a mathematical function
     * @param {Function} func - The function to draw
     * @param {string} color - Line color
     */
    drawFunction(func, color = '#667eea') {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        let firstPoint = true;
        const step = (this.xMax - this.xMin) / (this.width * 2);

        for (let x = this.xMin; x <= this.xMax; x += step) {
            const y = func(x);

            if (isNaN(y) || !isFinite(y)) continue;

            const coords = this.toCanvasCoords(x, y);

            if (firstPoint) {
                this.ctx.moveTo(coords.x, coords.y);
                firstPoint = false;
            } else {
                this.ctx.lineTo(coords.x, coords.y);
            }
        }

        this.ctx.stroke();
    }

    /**
     * Draw critical points with blinking animation
     * @param {number} phase - Animation phase (0 to 1)
     */
    drawCriticalPoints(phase = 0) {
        if (!this.showCriticalPoints || this.criticalPoints.length === 0) return;

        this.criticalPoints.forEach((point, index) => {
            const coords = this.toCanvasCoords(point.x, point.y);

            // Calculate opacity and size based on blink phase
            const offset = (index * Math.PI * 0.3); // Stagger animation
            const blinkValue = Math.sin(phase + offset) * 0.5 + 0.5; // 0 to 1
            const opacity = 0.5 + blinkValue * 0.5; // 0.5 to 1
            const radius = 6 + blinkValue * 4; // 6 to 10

            // Determine color based on type
            const color = point.type === 'maximum' ? '#ff6b6b' : '#4ecdc4';

            // Draw outer glow
            const gradient = this.ctx.createRadialGradient(
                coords.x, coords.y, 0,
                coords.x, coords.y, radius * 2
            );
            gradient.addColorStop(0, color + 'ff');
            gradient.addColorStop(0.5, color + Math.floor(opacity * 128).toString(16));
            gradient.addColorStop(1, color + '00');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(coords.x, coords.y, radius * 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw main point
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = opacity;
            this.ctx.beginPath();
            this.ctx.arc(coords.x, coords.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;

            // Draw inner white dot
            this.ctx.fillStyle = 'white';
            this.ctx.beginPath();
            this.ctx.arc(coords.x, coords.y, radius * 0.4, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw label
            this.ctx.fillStyle = '#333';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            const label = point.type === 'maximum' ? '최댓값' : '최솟값';
            this.ctx.fillText(label, coords.x, coords.y - radius - 8);

            // Draw coordinates
            this.ctx.font = '9px Arial';
            this.ctx.fillText(
                `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
                coords.x,
                coords.y + radius + 12
            );
        });
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Render everything
     * @param {Function} func - Function to draw
     */
    render(func) {
        this.clear();

        // Auto-adjust y-axis range based on function
        if (func) {
            this.autoAdjustRange(func);
        }

        this.drawGrid();
        this.drawAxes();

        if (func) {
            this.drawFunction(func);
        }

        this.drawCriticalPoints(this.blinkPhase);
    }

    /**
     * Auto-adjust y-axis range based on function values
     * @param {Function} func - The function
     */
    autoAdjustRange(func) {
        let yValues = [];
        const step = (this.xMax - this.xMin) / 50;

        for (let x = this.xMin; x <= this.xMax; x += step) {
            const y = func(x);
            if (isFinite(y) && !isNaN(y)) {
                yValues.push(y);
            }
        }

        if (yValues.length > 0) {
            const minY = Math.min(...yValues);
            const maxY = Math.max(...yValues);
            const range = maxY - minY;
            const padding = range * 0.2;

            this.yMin = Math.floor(minY - padding);
            this.yMax = Math.ceil(maxY + padding);
        }
    }

    /**
     * Set critical points to display
     * @param {Array} points - Array of critical points
     */
    setCriticalPoints(points) {
        this.criticalPoints = points;
    }

    /**
     * Show or hide critical points
     * @param {boolean} show - Whether to show critical points
     */
    toggleCriticalPoints(show) {
        this.showCriticalPoints = show;
    }

    /**
     * Start animation loop
     * @param {Function} func - Function to animate
     */
    startAnimation(func) {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const animate = () => {
            this.blinkPhase += 0.05;
            this.render(func);
            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Stop animation
     */
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Reset the graph
     */
    reset() {
        this.stopAnimation();
        this.criticalPoints = [];
        this.showCriticalPoints = false;
        this.blinkPhase = 0;
        this.xMin = -5;
        this.xMax = 5;
        this.yMin = -10;
        this.yMax = 10;
        this.clear();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphRenderer;
}
