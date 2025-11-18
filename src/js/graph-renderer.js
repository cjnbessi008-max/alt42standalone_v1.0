/**
 * graph-renderer.js
 * Canvas-based graph rendering engine with coordinate system
 */

class GraphRenderer {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;

        // Graph bounds (in mathematical coordinates)
        this.xMin = options.xMin || -10;
        this.xMax = options.xMax || 10;
        this.yMin = options.yMin || -10;
        this.yMax = options.yMax || 10;

        // Grid settings
        this.gridSpacing = options.gridSpacing || 1;
        this.showGrid = options.showGrid !== false;
        this.showAxes = options.showAxes !== false;

        // Colors
        this.colors = {
            background: '#fafbfc',
            grid: '#e1e8ed',
            axes: '#2c3e50',
            function: '#004098',
            point: '#E31837',
            secant: '#00A9CE',
            text: '#2c3e50'
        };

        this.setupCanvas();
    }

    /**
     * Set up canvas with proper resolution
     */
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);

        this.width = rect.width;
        this.height = rect.height;
    }

    /**
     * Convert mathematical coordinates to canvas pixel coordinates
     */
    toCanvasX(x) {
        return ((x - this.xMin) / (this.xMax - this.xMin)) * this.width;
    }

    toCanvasY(y) {
        return this.height - ((y - this.yMin) / (this.yMax - this.yMin)) * this.height;
    }

    /**
     * Convert canvas pixel coordinates to mathematical coordinates
     */
    toMathX(canvasX) {
        return this.xMin + (canvasX / this.width) * (this.xMax - this.xMin);
    }

    toMathY(canvasY) {
        return this.yMin + ((this.height - canvasY) / this.height) * (this.yMax - this.yMin);
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw coordinate grid
     */
    drawGrid() {
        if (!this.showGrid) return;

        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 0.5;

        // Vertical grid lines
        for (let x = Math.ceil(this.xMin / this.gridSpacing) * this.gridSpacing; x <= this.xMax; x += this.gridSpacing) {
            const canvasX = this.toCanvasX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, 0);
            this.ctx.lineTo(canvasX, this.height);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        for (let y = Math.ceil(this.yMin / this.gridSpacing) * this.gridSpacing; y <= this.yMax; y += this.gridSpacing) {
            const canvasY = this.toCanvasY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, canvasY);
            this.ctx.lineTo(this.width, canvasY);
            this.ctx.stroke();
        }
    }

    /**
     * Draw coordinate axes
     */
    drawAxes() {
        if (!this.showAxes) return;

        this.ctx.strokeStyle = this.colors.axes;
        this.ctx.lineWidth = 2;

        // X-axis
        if (this.yMin <= 0 && this.yMax >= 0) {
            const y0 = this.toCanvasY(0);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y0);
            this.ctx.lineTo(this.width, y0);
            this.ctx.stroke();

            // X-axis arrow
            this.ctx.beginPath();
            this.ctx.moveTo(this.width - 10, y0 - 5);
            this.ctx.lineTo(this.width, y0);
            this.ctx.lineTo(this.width - 10, y0 + 5);
            this.ctx.stroke();
        }

        // Y-axis
        if (this.xMin <= 0 && this.xMax >= 0) {
            const x0 = this.toCanvasX(0);
            this.ctx.beginPath();
            this.ctx.moveTo(x0, 0);
            this.ctx.lineTo(x0, this.height);
            this.ctx.stroke();

            // Y-axis arrow
            this.ctx.beginPath();
            this.ctx.moveTo(x0 - 5, 10);
            this.ctx.lineTo(x0, 0);
            this.ctx.lineTo(x0 + 5, 10);
            this.ctx.stroke();
        }

        // Axis labels
        this.ctx.fillStyle = this.colors.text;
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';

        // X-axis tick marks and labels
        for (let x = Math.ceil(this.xMin); x <= Math.floor(this.xMax); x++) {
            if (x === 0) continue;
            const canvasX = this.toCanvasX(x);
            const y0 = this.toCanvasY(0);

            // Tick mark
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, y0 - 5);
            this.ctx.lineTo(canvasX, y0 + 5);
            this.ctx.stroke();

            // Label
            this.ctx.fillText(x.toString(), canvasX, y0 + 8);
        }

        // Y-axis tick marks and labels
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';
        for (let y = Math.ceil(this.yMin); y <= Math.floor(this.yMax); y++) {
            if (y === 0) continue;
            const canvasY = this.toCanvasY(y);
            const x0 = this.toCanvasX(0);

            // Tick mark
            this.ctx.beginPath();
            this.ctx.moveTo(x0 - 5, canvasY);
            this.ctx.lineTo(x0 + 5, canvasY);
            this.ctx.stroke();

            // Label
            this.ctx.fillText(y.toString(), x0 - 8, canvasY);
        }
    }

    /**
     * Draw a mathematical function
     */
    drawFunction(fn, color = null, lineWidth = 2) {
        const points = MathFunctions.generateFunctionPoints(fn, this.xMin, this.xMax, 300);

        this.ctx.strokeStyle = color || this.colors.function;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();

        let isFirstPoint = true;

        for (const point of points) {
            if (point === null) {
                // Discontinuity - start new path
                isFirstPoint = true;
                continue;
            }

            const canvasX = this.toCanvasX(point.x);
            const canvasY = this.toCanvasY(point.y);

            // Skip points outside canvas bounds
            if (canvasY < -100 || canvasY > this.height + 100) {
                isFirstPoint = true;
                continue;
            }

            if (isFirstPoint) {
                this.ctx.moveTo(canvasX, canvasY);
                isFirstPoint = false;
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }
        }

        this.ctx.stroke();
    }

    /**
     * Draw a point on the graph
     */
    drawPoint(x, y, label = '', color = null, radius = 5) {
        const canvasX = this.toCanvasX(x);
        const canvasY = this.toCanvasY(y);

        // Draw outer circle (white outline)
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(canvasX, canvasY, radius + 2, 0, 2 * Math.PI);
        this.ctx.fill();

        // Draw inner circle
        this.ctx.fillStyle = color || this.colors.point;
        this.ctx.beginPath();
        this.ctx.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
        this.ctx.fill();

        // Draw label if provided
        if (label) {
            this.ctx.fillStyle = this.colors.text;
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(label, canvasX, canvasY - radius - 5);

            // Coordinates
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText(`(${x.toFixed(2)}, ${y.toFixed(2)})`, canvasX, canvasY - radius - 20);
        }
    }

    /**
     * Draw a line between two points
     */
    drawLine(point1, point2, color = null, lineWidth = 2) {
        const x1 = this.toCanvasX(point1.x);
        const y1 = this.toCanvasY(point1.y);
        const x2 = this.toCanvasX(point2.x);
        const y2 = this.toCanvasY(point2.y);

        this.ctx.strokeStyle = color || this.colors.secant;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    /**
     * Update graph bounds
     */
    setBounds(xMin, xMax, yMin, yMax) {
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;
    }

    /**
     * Check if point is within canvas bounds
     */
    isInBounds(x, y) {
        return x >= this.xMin && x <= this.xMax && y >= this.yMin && y <= this.yMax;
    }

    /**
     * Get mouse position in mathematical coordinates
     */
    getMousePosition(event) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = event.clientX - rect.left;
        const canvasY = event.clientY - rect.top;

        return {
            x: this.toMathX(canvasX),
            y: this.toMathY(canvasY)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphRenderer;
}
