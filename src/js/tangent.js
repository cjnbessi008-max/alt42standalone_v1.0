/**
 * Tangent Calculator and Graph Renderer
 * Handles mathematical calculations and rendering of functions and tangent lines
 */

class TangentCalculator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 40; // pixels per unit
        this.originX = 0;
        this.originY = 0;
        this.currentFunction = null;
        this.tangentPoint = null;
        this.tangentLine = null;

        this.setupCanvas();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.width = rect.width;
        this.height = rect.height;
        this.originX = this.width / 2;
        this.originY = this.height / 2;
    }

    /**
     * Set the function to be graphed
     * @param {Object} funcData - Function configuration
     */
    setFunction(funcData) {
        this.currentFunction = funcData;
        this.tangentPoint = null;
        this.tangentLine = null;
        this.render();
    }

    /**
     * Evaluate function at x
     */
    evaluateFunction(x) {
        if (!this.currentFunction) return 0;

        const { type, coefficients } = this.currentFunction;

        switch (type) {
            case 'polynomial':
                // f(x) = ax^2 + bx + c
                return coefficients.a * x * x + coefficients.b * x + coefficients.c;

            case 'sine':
                // f(x) = a * sin(bx + c)
                return coefficients.a * Math.sin(coefficients.b * x + coefficients.c);

            case 'cosine':
                // f(x) = a * cos(bx + c)
                return coefficients.a * Math.cos(coefficients.b * x + coefficients.c);

            case 'exponential':
                // f(x) = a * e^(bx)
                return coefficients.a * Math.exp(coefficients.b * x);

            default:
                return 0;
        }
    }

    /**
     * Calculate derivative at x using numerical approximation
     */
    calculateDerivative(x) {
        const h = 0.0001;
        const f1 = this.evaluateFunction(x + h);
        const f2 = this.evaluateFunction(x - h);
        return (f1 - f2) / (2 * h);
    }

    /**
     * Calculate tangent line at point
     */
    calculateTangentLine(x) {
        const y = this.evaluateFunction(x);
        const slope = this.calculateDerivative(x);

        this.tangentPoint = { x, y };
        this.tangentLine = {
            slope,
            intercept: y - slope * x,
            x1: -10,
            x2: 10
        };

        return {
            point: this.tangentPoint,
            slope,
            equation: `y = ${slope.toFixed(2)}x + ${this.tangentLine.intercept.toFixed(2)}`
        };
    }

    /**
     * Convert canvas coordinates to graph coordinates
     */
    canvasToGraph(canvasX, canvasY) {
        return {
            x: (canvasX - this.originX) / this.scale,
            y: -(canvasY - this.originY) / this.scale
        };
    }

    /**
     * Convert graph coordinates to canvas coordinates
     */
    graphToCanvas(x, y) {
        return {
            x: this.originX + x * this.scale,
            y: this.originY - y * this.scale
        };
    }

    /**
     * Find nearest point on curve to canvas coordinates
     */
    findNearestPointOnCurve(canvasX, canvasY) {
        const graphPoint = this.canvasToGraph(canvasX, canvasY);
        let nearestX = graphPoint.x;
        let minDistance = Infinity;

        // Search for nearest point on curve
        for (let x = -10; x <= 10; x += 0.1) {
            const y = this.evaluateFunction(x);
            const canvasPoint = this.graphToCanvas(x, y);
            const distance = Math.sqrt(
                Math.pow(canvasPoint.x - canvasX, 2) +
                Math.pow(canvasPoint.y - canvasY, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestX = x;
            }
        }

        return { x: nearestX, y: this.evaluateFunction(nearestX) };
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Draw coordinate axes
     */
    drawAxes() {
        this.ctx.strokeStyle = '#d0d0d0';
        this.ctx.lineWidth = 1;

        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.originY);
        this.ctx.lineTo(this.width, this.originY);
        this.ctx.stroke();

        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.originX, 0);
        this.ctx.lineTo(this.originX, this.height);
        this.ctx.stroke();

        // Grid lines
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 0.5;

        for (let i = -10; i <= 10; i++) {
            if (i === 0) continue;

            // Vertical lines
            const x = this.originX + i * this.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();

            // Horizontal lines
            const y = this.originY + i * this.scale;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw the function curve
     */
    drawFunction() {
        if (!this.currentFunction) return;

        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        let started = false;
        for (let x = -10; x <= 10; x += 0.05) {
            const y = this.evaluateFunction(x);
            const canvasPoint = this.graphToCanvas(x, y);

            // Check if point is within canvas bounds
            if (canvasPoint.y > -100 && canvasPoint.y < this.height + 100) {
                if (!started) {
                    this.ctx.moveTo(canvasPoint.x, canvasPoint.y);
                    started = true;
                } else {
                    this.ctx.lineTo(canvasPoint.x, canvasPoint.y);
                }
            } else if (started) {
                break;
            }
        }

        this.ctx.stroke();
    }

    /**
     * Draw tangent point
     */
    drawTangentPoint() {
        if (!this.tangentPoint) return;

        const canvasPoint = this.graphToCanvas(this.tangentPoint.x, this.tangentPoint.y);

        // Outer glow
        this.ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(canvasPoint.x, canvasPoint.y, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Main point
        this.ctx.fillStyle = '#667eea';
        this.ctx.beginPath();
        this.ctx.arc(canvasPoint.x, canvasPoint.y, 6, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner highlight
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(canvasPoint.x - 2, canvasPoint.y - 2, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw tangent line
     */
    drawTangentLine() {
        if (!this.tangentLine) return;

        const { slope, intercept, x1, x2 } = this.tangentLine;

        const y1 = slope * x1 + intercept;
        const y2 = slope * x2 + intercept;

        const canvas1 = this.graphToCanvas(x1, y1);
        const canvas2 = this.graphToCanvas(x2, y2);

        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(canvas1.x, canvas1.y);
        this.ctx.lineTo(canvas2.x, canvas2.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    /**
     * Render complete graph
     */
    render() {
        this.clear();
        this.drawAxes();
        this.drawFunction();
        this.drawTangentLine();
        this.drawTangentPoint();
    }
}
