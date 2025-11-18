/**
 * Overlap Field Renderer
 * Core visualization engine for rendering inequality intersections
 * with smooth color gradients
 */

class OverlapFieldRenderer {
    constructor(canvasId, config = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.parser = new InequalityParser();

        // Configuration
        this.config = {
            xMin: config.xMin || -5,
            xMax: config.xMax || 5,
            yMin: config.yMin || -5,
            yMax: config.yMax || 5,
            gridSize: config.gridSize || 100,
            showGrid: config.showGrid !== false,
            showAxes: config.showAxes !== false,
            colorIntensity: config.colorIntensity || 0.7,
            animationEnabled: false,
            ...config
        };

        this.inequalities = [];
        this.animationFrame = null;
        this.animationPhase = 0;

        this.setupCanvas();
    }

    /**
     * Setup canvas dimensions
     */
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        this.width = rect.width;
        this.height = rect.height;
    }

    /**
     * Load inequalities
     * @param {Array<string>} inequalities - Array of inequality strings
     */
    loadInequalities(inequalities) {
        this.inequalities = this.parser.parseMultiple(inequalities);
        this.render();
    }

    /**
     * Update configuration
     * @param {Object} newConfig - New configuration values
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.render();
    }

    /**
     * Convert canvas coordinates to mathematical coordinates
     * @param {number} canvasX - Canvas X coordinate
     * @param {number} canvasY - Canvas Y coordinate
     * @returns {Object} {x, y} Mathematical coordinates
     */
    canvasToMath(canvasX, canvasY) {
        const x = this.config.xMin + (canvasX / this.width) * (this.config.xMax - this.config.xMin);
        const y = this.config.yMax - (canvasY / this.height) * (this.config.yMax - this.config.yMin);
        return { x, y };
    }

    /**
     * Convert mathematical coordinates to canvas coordinates
     * @param {number} mathX - Mathematical X coordinate
     * @param {number} mathY - Mathematical Y coordinate
     * @returns {Object} {x, y} Canvas coordinates
     */
    mathToCanvas(mathX, mathY) {
        const x = ((mathX - this.config.xMin) / (this.config.xMax - this.config.xMin)) * this.width;
        const y = ((this.config.yMax - mathY) / (this.config.yMax - this.config.yMin)) * this.height;
        return { x, y };
    }

    /**
     * Main render function
     */
    render() {
        this.clear();

        if (this.config.showGrid) {
            this.drawGrid();
        }

        if (this.config.showAxes) {
            this.drawAxes();
        }

        this.drawOverlapField();

        if (this.config.animationEnabled) {
            this.animate();
        }
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Draw coordinate grid
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        this.ctx.lineWidth = 1;

        const { xMin, xMax, yMin, yMax } = this.config;

        // Vertical grid lines
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
            const canvasX = this.mathToCanvas(x, 0).x;
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, 0);
            this.ctx.lineTo(canvasX, this.height);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
            const canvasY = this.mathToCanvas(0, y).y;
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
        this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.8)';
        this.ctx.lineWidth = 2;

        // X-axis
        const yZero = this.mathToCanvas(0, 0).y;
        if (yZero >= 0 && yZero <= this.height) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, yZero);
            this.ctx.lineTo(this.width, yZero);
            this.ctx.stroke();

            // X-axis arrow
            this.drawArrow(this.width - 10, yZero, this.width, yZero);
        }

        // Y-axis
        const xZero = this.mathToCanvas(0, 0).x;
        if (xZero >= 0 && xZero <= this.width) {
            this.ctx.beginPath();
            this.ctx.moveTo(xZero, 0);
            this.ctx.lineTo(xZero, this.height);
            this.ctx.stroke();

            // Y-axis arrow
            this.drawArrow(xZero, 10, xZero, 0);
        }

        // Draw tick marks and labels
        this.drawAxisLabels();
    }

    /**
     * Draw an arrow
     * @param {number} fromX - Start X
     * @param {number} fromY - Start Y
     * @param {number} toX - End X
     * @param {number} toY - End Y
     */
    drawArrow(fromX, fromY, toX, toY) {
        const headLength = 8;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }

    /**
     * Draw axis labels
     */
    drawAxisLabels() {
        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
        this.ctx.font = '11px sans-serif';
        this.ctx.textAlign = 'center';

        const { xMin, xMax, yMin, yMax } = this.config;
        const yZero = this.mathToCanvas(0, 0).y;
        const xZero = this.mathToCanvas(0, 0).x;

        // X-axis labels
        for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
            if (x === 0) continue;
            const pos = this.mathToCanvas(x, 0);
            const labelY = yZero >= 0 && yZero <= this.height ? yZero + 15 : this.height - 5;
            this.ctx.fillText(x.toString(), pos.x, labelY);
        }

        // Y-axis labels
        this.ctx.textAlign = 'right';
        for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
            if (y === 0) continue;
            const pos = this.mathToCanvas(0, y);
            const labelX = xZero >= 0 && xZero <= this.width ? xZero - 5 : 25;
            this.ctx.fillText(y.toString(), labelX, pos.y + 4);
        }
    }

    /**
     * Draw the overlap field (main visualization)
     */
    drawOverlapField() {
        if (this.inequalities.length === 0) {
            this.drawNoDataMessage();
            return;
        }

        const gridSize = this.config.gridSize;
        const pixelWidth = this.width / gridSize;
        const pixelHeight = this.height / gridSize;

        // Create image data for efficient rendering
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        // Sample each pixel
        for (let py = 0; py < this.height; py++) {
            for (let px = 0; px < this.width; px++) {
                const mathCoords = this.canvasToMath(px, py);
                const satisfiedInequalities = [];

                // Check which inequalities are satisfied at this point
                for (const ineq of this.inequalities) {
                    if (ineq.evaluate(mathCoords.x, mathCoords.y)) {
                        satisfiedInequalities.push(ineq.color);
                    }
                }

                // Blend colors based on overlap
                const color = this.getPixelColor(satisfiedInequalities);
                const index = (py * this.width + px) * 4;

                data[index] = color.r;
                data[index + 1] = color.g;
                data[index + 2] = color.b;
                data[index + 3] = color.a;
            }
        }

        this.ctx.putImageData(imageData, 0, 0);

        // Draw inequality boundaries
        this.drawBoundaries();
    }

    /**
     * Get pixel color based on satisfied inequalities
     * @param {Array<Array<number>>} colors - Array of RGB colors
     * @returns {Object} {r, g, b, a} color object
     */
    getPixelColor(colors) {
        if (colors.length === 0) {
            return { r: 255, g: 255, b: 255, a: 0 };
        }

        // Use smooth color blending
        const colorString = ColorUtils.blendColors(colors, this.config.colorIntensity);

        // Parse RGBA string
        const match = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: Math.round((parseFloat(match[4]) || 1) * 255)
            };
        }

        return { r: 255, g: 255, b: 255, a: 0 };
    }

    /**
     * Draw inequality boundaries
     */
    drawBoundaries() {
        this.ctx.lineWidth = 2;

        for (const ineq of this.inequalities) {
            this.ctx.strokeStyle = `rgb(${ineq.color[0]}, ${ineq.color[1]}, ${ineq.color[2]})`;
            this.drawInequalityBoundary(ineq);
        }
    }

    /**
     * Draw single inequality boundary
     * @param {Object} inequality - Parsed inequality
     */
    drawInequalityBoundary(inequality) {
        this.ctx.beginPath();

        let firstPoint = true;
        const step = this.width / 200;

        for (let px = 0; px <= this.width; px += step) {
            const mathCoords = this.canvasToMath(px, 0);

            // Try to solve for y at this x
            const y = this.solveForY(inequality, mathCoords.x);

            if (y !== null) {
                const canvasCoords = this.mathToCanvas(mathCoords.x, y);

                if (canvasCoords.y >= 0 && canvasCoords.y <= this.height) {
                    if (firstPoint) {
                        this.ctx.moveTo(canvasCoords.x, canvasCoords.y);
                        firstPoint = false;
                    } else {
                        this.ctx.lineTo(canvasCoords.x, canvasCoords.y);
                    }
                }
            }
        }

        this.ctx.stroke();
    }

    /**
     * Solve inequality for y given x
     * @param {Object} inequality - Parsed inequality
     * @param {number} x - X value
     * @returns {number|null} Y value or null
     */
    solveForY(inequality, x) {
        // Simple linear solver for common cases
        // This is a simplified implementation
        const { leftSide, rightSide, operator } = inequality;

        if (leftSide === 'y') {
            return this.parser.evaluateExpression(rightSide, x, 0);
        }

        if (rightSide === 'y') {
            return this.parser.evaluateExpression(leftSide, x, 0);
        }

        // Try to find y by sampling
        for (let y = this.config.yMin; y <= this.config.yMax; y += 0.1) {
            const leftVal = this.parser.evaluateExpression(leftSide, x, y);
            const rightVal = this.parser.evaluateExpression(rightSide, x, y);

            if (Math.abs(leftVal - rightVal) < 0.1) {
                return y;
            }
        }

        return null;
    }

    /**
     * Draw "No Data" message
     */
    drawNoDataMessage() {
        this.ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
        this.ctx.font = '16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('부등식이 로드되지 않았습니다', this.width / 2, this.height / 2);
    }

    /**
     * Animate the visualization
     */
    animate() {
        if (!this.config.animationEnabled) {
            return;
        }

        this.animationPhase += 0.02;
        this.config.colorIntensity = 0.5 + 0.3 * Math.sin(this.animationPhase);

        this.render();

        this.animationFrame = requestAnimationFrame(() => this.animate());
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
     * Toggle animation
     */
    toggleAnimation() {
        this.config.animationEnabled = !this.config.animationEnabled;

        if (this.config.animationEnabled) {
            this.animate();
        } else {
            this.stopAnimation();
            this.config.colorIntensity = 0.7;
            this.render();
        }

        return this.config.animationEnabled;
    }

    /**
     * Reset view to default
     */
    reset() {
        this.config.xMin = -5;
        this.config.xMax = 5;
        this.config.yMin = -5;
        this.config.yMax = 5;
        this.config.gridSize = 100;
        this.config.colorIntensity = 0.7;
        this.config.animationEnabled = false;
        this.stopAnimation();
        this.render();
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OverlapFieldRenderer;
}
