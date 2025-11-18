/**
 * Inverse Reflection Visualization Engine
 * Renders function graphs with mirror reflection animation
 */

class InverseReflectionVisualizer {
    constructor(canvasId, overlayId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById(overlayId);

        // Coordinate system settings
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        this.padding = 30;

        // Visual settings
        this.colors = {
            original: '#2196F3',
            inverse: '#F44336',
            reflectionLine: '#4CAF50',
            grid: '#e0e0e0',
            axis: '#333',
            point: '#FF9800'
        };

        this.showGrid = true;
        this.showReflectionLine = true;
        this.animationEnabled = true;

        // Function data
        this.originalFunction = null;
        this.inverseFunction = null;
        this.originalPoints = [];
        this.inversePoints = [];

        // Initialize
        this.setupCanvas();
        this.bindEvents();
    }

    /**
     * Setup canvas with proper dimensions
     */
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.draw();
    }

    /**
     * Bind mouse events for interactive points
     */
    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('resize', () => this.setupCanvas());
    }

    /**
     * Set functions to visualize
     */
    setFunctions(originalFunc, inverseFunc, domainMin = -10, domainMax = 10) {
        this.originalFunction = originalFunc;
        this.inverseFunction = inverseFunc;
        this.xMin = domainMin;
        this.xMax = domainMax;
        this.yMin = domainMin;
        this.yMax = domainMax;

        // Generate function points
        this.originalPoints = MathUtils.generateFunctionPoints(
            originalFunc, this.xMin, this.xMax, 100
        );
        this.inversePoints = MathUtils.generateFunctionPoints(
            inverseFunc, this.xMin, this.xMax, 100
        );

        this.draw();
    }

    /**
     * Convert canvas coordinates to mathematical coordinates
     */
    canvasToMath(canvasX, canvasY) {
        const width = this.canvas.width - 2 * this.padding;
        const height = this.canvas.height - 2 * this.padding;

        const x = this.xMin + (canvasX - this.padding) * (this.xMax - this.xMin) / width;
        const y = this.yMax - (canvasY - this.padding) * (this.yMax - this.yMin) / height;

        return { x, y };
    }

    /**
     * Convert mathematical coordinates to canvas coordinates
     */
    mathToCanvas(x, y) {
        const width = this.canvas.width - 2 * this.padding;
        const height = this.canvas.height - 2 * this.padding;

        const canvasX = this.padding + (x - this.xMin) * width / (this.xMax - this.xMin);
        const canvasY = this.padding + (this.yMax - y) * height / (this.yMax - this.yMin);

        return { x: canvasX, y: canvasY };
    }

    /**
     * Main draw function
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }

        // Draw axes
        this.drawAxes();

        // Draw reflection line (y=x)
        if (this.showReflectionLine) {
            this.drawReflectionLine();
        }

        // Draw functions
        this.drawFunction(this.originalPoints, this.colors.original, 3);
        this.drawFunction(this.inversePoints, this.colors.inverse, 3);

        // Draw labels
        this.drawLabels();
    }

    /**
     * Draw grid lines
     */
    drawGrid() {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = Math.ceil(this.xMin); x <= Math.floor(this.xMax); x++) {
            const pos = this.mathToCanvas(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, this.padding);
            this.ctx.lineTo(pos.x, this.canvas.height - this.padding);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = Math.ceil(this.yMin); y <= Math.floor(this.yMax); y++) {
            const pos = this.mathToCanvas(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, pos.y);
            this.ctx.lineTo(this.canvas.width - this.padding, pos.y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw coordinate axes
     */
    drawAxes() {
        this.ctx.strokeStyle = this.colors.axis;
        this.ctx.lineWidth = 2;

        // X-axis
        const xAxisY = this.mathToCanvas(0, 0).y;
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, xAxisY);
        this.ctx.lineTo(this.canvas.width - this.padding, xAxisY);
        this.ctx.stroke();

        // Y-axis
        const yAxisX = this.mathToCanvas(0, 0).x;
        this.ctx.beginPath();
        this.ctx.moveTo(yAxisX, this.padding);
        this.ctx.lineTo(yAxisX, this.canvas.height - this.padding);
        this.ctx.stroke();

        // Axis labels
        this.ctx.fillStyle = this.colors.axis;
        this.ctx.font = '12px Arial';
        this.ctx.fillText('x', this.canvas.width - this.padding + 5, xAxisY);
        this.ctx.fillText('y', yAxisX, this.padding - 5);
    }

    /**
     * Draw reflection line (y=x)
     */
    drawReflectionLine() {
        this.ctx.strokeStyle = this.colors.reflectionLine;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        const start = this.mathToCanvas(this.xMin, this.xMin);
        const end = this.mathToCanvas(this.xMax, this.xMax);

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Label
        this.ctx.fillStyle = this.colors.reflectionLine;
        this.ctx.font = 'bold 14px Arial';
        const labelPos = this.mathToCanvas(
            (this.xMin + this.xMax) / 2,
            (this.xMin + this.xMax) / 2
        );
        this.ctx.fillText('y = x', labelPos.x + 10, labelPos.y - 10);
    }

    /**
     * Draw function curve
     */
    drawFunction(points, color, lineWidth = 2) {
        if (points.length === 0) return;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();

        let firstPoint = true;
        for (const point of points) {
            const canvasPos = this.mathToCanvas(point.x, point.y);

            if (firstPoint) {
                this.ctx.moveTo(canvasPos.x, canvasPos.y);
                firstPoint = false;
            } else {
                this.ctx.lineTo(canvasPos.x, canvasPos.y);
            }
        }

        this.ctx.stroke();
    }

    /**
     * Draw function labels
     */
    drawLabels() {
        this.ctx.font = 'bold 14px Arial';

        // Original function label
        if (this.originalPoints.length > 0) {
            const point = this.originalPoints[Math.floor(this.originalPoints.length * 0.7)];
            const pos = this.mathToCanvas(point.x, point.y);
            this.ctx.fillStyle = this.colors.original;
            this.ctx.fillText('f(x)', pos.x + 10, pos.y - 10);
        }

        // Inverse function label
        if (this.inversePoints.length > 0) {
            const point = this.inversePoints[Math.floor(this.inversePoints.length * 0.7)];
            const pos = this.mathToCanvas(point.x, point.y);
            this.ctx.fillStyle = this.colors.inverse;
            this.ctx.fillText('f⁻¹(x)', pos.x + 10, pos.y + 20);
        }
    }

    /**
     * Draw a point on canvas
     */
    drawPoint(x, y, color = this.colors.point, radius = 6) {
        const pos = this.mathToCanvas(x, y);

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
        this.ctx.fill();

        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * Animate reflection of a point
     */
    async animateReflection(startPoint) {
        if (!this.animationEnabled) {
            this.showReflection(startPoint);
            return;
        }

        const endPoint = MathUtils.reflectPointAcrossYX(startPoint);
        const projectionPoint = MathUtils.projectOntoYXLine(startPoint);
        const steps = 30;
        const delay = 20;

        // Phase 1: Move from start to projection on y=x
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const currentPoint = {
                x: startPoint.x + (projectionPoint.x - startPoint.x) * t,
                y: startPoint.y + (projectionPoint.y - startPoint.y) * t
            };

            this.draw();
            this.drawPoint(startPoint.x, startPoint.y, this.colors.original, 5);
            this.drawPoint(currentPoint.x, currentPoint.y, this.colors.point, 7);
            this.drawLineWithArrow(startPoint, currentPoint);

            await this.sleep(delay);
        }

        // Phase 2: Move from projection to reflected point
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const currentPoint = {
                x: projectionPoint.x + (endPoint.x - projectionPoint.x) * t,
                y: projectionPoint.y + (endPoint.y - projectionPoint.y) * t
            };

            this.draw();
            this.drawPoint(startPoint.x, startPoint.y, this.colors.original, 5);
            this.drawPoint(currentPoint.x, currentPoint.y, this.colors.point, 7);
            this.drawPoint(endPoint.x, endPoint.y, this.colors.inverse, 5);
            this.drawLineWithArrow(startPoint, currentPoint);

            await this.sleep(delay);
        }

        // Final state
        this.showReflection(startPoint);
    }

    /**
     * Show static reflection
     */
    showReflection(point) {
        const reflected = MathUtils.reflectPointAcrossYX(point);

        this.draw();
        this.drawPoint(point.x, point.y, this.colors.original, 6);
        this.drawPoint(reflected.x, reflected.y, this.colors.inverse, 6);
        this.drawLineWithArrow(point, reflected);

        // Show coordinates
        this.drawCoordinateLabel(point, `(${MathUtils.formatNumber(point.x)}, ${MathUtils.formatNumber(point.y)})`, this.colors.original);
        this.drawCoordinateLabel(reflected, `(${MathUtils.formatNumber(reflected.x)}, ${MathUtils.formatNumber(reflected.y)})`, this.colors.inverse);
    }

    /**
     * Draw line with arrow
     */
    drawLineWithArrow(start, end) {
        const canvasStart = this.mathToCanvas(start.x, start.y);
        const canvasEnd = this.mathToCanvas(end.x, end.y);

        this.ctx.strokeStyle = this.colors.point;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 3]);

        this.ctx.beginPath();
        this.ctx.moveTo(canvasStart.x, canvasStart.y);
        this.ctx.lineTo(canvasEnd.x, canvasEnd.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    /**
     * Draw coordinate label
     */
    drawCoordinateLabel(point, text, color) {
        const pos = this.mathToCanvas(point.x, point.y);

        this.ctx.fillStyle = color;
        this.ctx.font = '12px Arial';
        this.ctx.fillText(text, pos.x + 10, pos.y - 10);
    }

    /**
     * Handle canvas click
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const mathCoords = this.canvasToMath(canvasX, canvasY);

        // Find closest point on original function
        const closestPoint = MathUtils.findClosestPoint(
            this.originalPoints,
            mathCoords.x,
            mathCoords.y
        );

        // Animate reflection
        this.animateReflection(closestPoint);

        // Log interaction
        apiClient.logInteraction('point_click', {
            original_point: closestPoint,
            reflected_point: MathUtils.reflectPointAcrossYX(closestPoint)
        });
    }

    /**
     * Handle mouse move for hover effects
     */
    handleMouseMove(e) {
        // Could add hover effects here
    }

    /**
     * Sleep utility for animation
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear canvas
     */
    clear() {
        this.draw();
    }
}
