/**
 * Canvas Renderer for Riemann Sum Visualization
 * Handles all drawing on the smartphone screen canvas
 */

class CanvasRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.padding = 40;
        this.animationFrame = null;

        // Animation state
        this.currentAnimationProgress = 0;
        this.targetSubdivisions = 0;
        this.isAnimating = false;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Transform x coordinate from data space to canvas space
     * @param {number} x - Data x coordinate
     * @param {number} a - Lower bound
     * @param {number} b - Upper bound
     * @returns {number} Canvas x coordinate
     */
    toCanvasX(x, a, b) {
        const width = this.canvas.width - 2 * this.padding;
        return this.padding + ((x - a) / (b - a)) * width;
    }

    /**
     * Transform y coordinate from data space to canvas space
     * @param {number} y - Data y coordinate
     * @param {number} minY - Minimum y value
     * @param {number} maxY - Maximum y value
     * @returns {number} Canvas y coordinate
     */
    toCanvasY(y, minY, maxY) {
        const height = this.canvas.height - 2 * this.padding;
        const range = maxY - minY;
        return this.canvas.height - this.padding - ((y - minY) / range) * height;
    }

    /**
     * Draw coordinate axes
     * @param {number} a - Lower bound
     * @param {number} b - Upper bound
     * @param {number} minY - Minimum y value
     * @param {number} maxY - Maximum y value
     */
    drawAxes(a, b, minY, maxY) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666';

        // X-axis
        const y0 = this.toCanvasY(0, minY, maxY);
        ctx.beginPath();
        ctx.moveTo(this.padding, y0);
        ctx.lineTo(this.canvas.width - this.padding, y0);
        ctx.stroke();

        // Y-axis
        const x0 = this.toCanvasX(0, a, b);
        ctx.beginPath();
        ctx.moveTo(x0, this.padding);
        ctx.lineTo(x0, this.canvas.height - this.padding);
        ctx.stroke();

        // X-axis labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const xLabels = [a, (a + b) / 2, b];
        xLabels.forEach(x => {
            const canvasX = this.toCanvasX(x, a, b);
            ctx.fillText(x.toFixed(1), canvasX, y0 + 5);

            // Tick marks
            ctx.beginPath();
            ctx.moveTo(canvasX, y0 - 5);
            ctx.lineTo(canvasX, y0 + 5);
            ctx.stroke();
        });

        // Y-axis labels
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const yLabels = [minY, (minY + maxY) / 2, maxY];
        yLabels.forEach(y => {
            const canvasY = this.toCanvasY(y, minY, maxY);
            ctx.fillText(y.toFixed(1), x0 - 10, canvasY);

            // Tick marks
            ctx.beginPath();
            ctx.moveTo(x0 - 5, canvasY);
            ctx.lineTo(x0 + 5, canvasY);
            ctx.stroke();
        });

        // Axis labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#333';
        ctx.fillText('x', this.canvas.width - this.padding + 10, y0);

        ctx.save();
        ctx.translate(x0, this.padding - 10);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('y', 0, 0);
        ctx.restore();
    }

    /**
     * Draw the function curve
     * @param {Array} points - Array of {x, y} points
     * @param {number} a - Lower bound
     * @param {number} b - Upper bound
     * @param {number} minY - Minimum y value
     * @param {number} maxY - Maximum y value
     */
    drawCurve(points, a, b, minY, maxY) {
        if (points.length === 0) return;

        const ctx = this.ctx;
        ctx.strokeStyle = '#764ba2';
        ctx.lineWidth = 3;
        ctx.beginPath();

        points.forEach((point, index) => {
            const x = this.toCanvasX(point.x, a, b);
            const y = this.toCanvasY(point.y, minY, maxY);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }

    /**
     * Draw Riemann sum rectangles
     * @param {Array} rectangles - Array of rectangle objects
     * @param {number} a - Lower bound
     * @param {number} b - Upper bound
     * @param {number} minY - Minimum y value
     * @param {number} maxY - Maximum y value
     * @param {number} opacity - Opacity for animation (0-1)
     */
    drawRectangles(rectangles, a, b, minY, maxY, opacity = 1) {
        const ctx = this.ctx;
        const y0 = this.toCanvasY(0, minY, maxY);

        rectangles.forEach((rect, index) => {
            const x = this.toCanvasX(rect.x, a, b);
            const width = this.toCanvasX(rect.x + rect.width, a, b) - x;
            const height = this.toCanvasY(rect.height, minY, maxY);

            // Alternating colors for visual distinction
            const hue = (index % 2 === 0) ? 220 : 260;

            // Fill rectangle
            ctx.fillStyle = `hsla(${hue}, 70%, 65%, ${0.3 * opacity})`;
            ctx.fillRect(x, height, width, y0 - height);

            // Rectangle border
            ctx.strokeStyle = `hsla(${hue}, 70%, 45%, ${0.7 * opacity})`;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x, height, width, y0 - height);

            // Draw sample point
            const sampleX = this.toCanvasX(rect.samplePoint, a, b);
            const sampleY = this.toCanvasY(rect.height, minY, maxY);

            ctx.fillStyle = `hsla(${hue}, 80%, 40%, ${opacity})`;
            ctx.beginPath();
            ctx.arc(sampleX, sampleY, 4, 0, Math.PI * 2);
            ctx.fill();

            // Dashed line from sample point to x-axis
            ctx.strokeStyle = `hsla(${hue}, 70%, 45%, ${0.4 * opacity})`;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(sampleX, sampleY);
            ctx.lineTo(sampleX, y0);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }

    /**
     * Draw the complete Riemann sum visualization
     * @param {RiemannCalculator} calculator - The calculator instance
     */
    draw(calculator) {
        this.clear();

        const a = calculator.a;
        const b = calculator.b;
        const minY = Math.min(0, calculator.getMinValue());
        const maxY = Math.max(calculator.getMaxValue() * 1.1, 1);

        // Draw axes
        this.drawAxes(a, b, minY, maxY);

        // Draw rectangles
        const rectangles = calculator.getRectangles();
        this.drawRectangles(rectangles, a, b, minY, maxY);

        // Draw function curve (on top)
        const curvePoints = calculator.getFunctionPoints();
        this.drawCurve(curvePoints, a, b, minY, maxY);

        // Draw subdivision count
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#667eea';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`n = ${calculator.n}`, 10, 10);
    }

    /**
     * Animate densification of Riemann sum
     * @param {RiemannCalculator} calculator - The calculator instance
     * @param {number} targetN - Target number of subdivisions
     * @param {Function} onProgress - Callback for progress updates (0-100)
     * @param {Function} onComplete - Callback when animation completes
     */
    animateDensify(calculator, targetN, onProgress, onComplete) {
        if (this.isAnimating) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.isAnimating = true;
        const startN = calculator.n;
        const duration = 5000; // 5 seconds
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-in-out)
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // Calculate current n
            const currentN = Math.round(startN + (targetN - startN) * easeProgress);
            calculator.setSubdivisions(currentN);

            // Draw
            this.draw(calculator);

            // Update progress
            if (onProgress) {
                onProgress(Math.floor(progress * 100));
            }

            // Continue or complete
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                if (onComplete) {
                    onComplete();
                }
            }
        };

        animate();
    }

    /**
     * Stop any ongoing animation
     */
    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.isAnimating = false;
    }
}
