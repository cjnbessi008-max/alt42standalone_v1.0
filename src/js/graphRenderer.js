/**
 * Graph Renderer with Extrema Tremor Fix
 *
 * This module handles graph rendering with special algorithms to prevent
 * trembling/shaking at extrema points (local maxima/minima)
 */

class GraphRenderer {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Configuration options
        this.options = {
            backgroundColor: options.backgroundColor || '#FFFFFF',
            lineColor: options.lineColor || '#2196F3',
            lineWidth: options.lineWidth || 2,
            gridColor: options.gridColor || '#E0E0E0',
            extremaPointColor: options.extremaPointColor || '#FF5722',
            extremaPointRadius: options.extremaPointRadius || 4,
            smoothingFactor: options.smoothingFactor || 0.3, // Key for tremor fix
            derivativeThreshold: options.derivativeThreshold || 0.001, // For extrema detection
            samplingRate: options.samplingRate || 200, // Points per graph
            useAdaptiveSampling: options.useAdaptiveSampling !== false,
            enableAntiTremor: options.enableAntiTremor !== false // Main tremor fix flag
        };

        // Graph data
        this.functionExpression = null;
        this.xMin = -10;
        this.xMax = 10;
        this.yMin = -10;
        this.yMax = 10;
        this.points = [];
        this.extremaPoints = [];

        // Animation state
        this.animationId = null;
        this.lastFrameTime = 0;
        this.frameBuffer = []; // For temporal smoothing

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;

        if (this.functionExpression) {
            this.render();
        }
    }

    /**
     * Set function to plot
     * @param {string|Function} func - Function expression or callable
     */
    setFunction(func) {
        if (typeof func === 'string') {
            this.functionExpression = this.parseFunction(func);
        } else if (typeof func === 'function') {
            this.functionExpression = func;
        } else {
            throw new Error('Function must be a string or callable');
        }

        this.calculatePoints();
        this.detectExtrema();
        this.render();
    }

    /**
     * Parse mathematical function expression
     */
    parseFunction(expr) {
        // Safe evaluation with limited scope
        return (x) => {
            try {
                const math = {
                    sin: Math.sin,
                    cos: Math.cos,
                    tan: Math.tan,
                    sqrt: Math.sqrt,
                    abs: Math.abs,
                    pow: Math.pow,
                    exp: Math.exp,
                    log: Math.log,
                    PI: Math.PI,
                    E: Math.E
                };

                const func = new Function('x', 'math', `
                    with (math) {
                        return ${expr};
                    }
                `);

                return func(x, math);
            } catch (e) {
                console.error('Function evaluation error:', e);
                return NaN;
            }
        };
    }

    /**
     * Calculate function points with adaptive sampling
     * This is crucial for preventing tremor at extrema
     */
    calculatePoints() {
        this.points = [];

        if (this.options.useAdaptiveSampling) {
            this.calculateAdaptivePoints();
        } else {
            this.calculateUniformPoints();
        }
    }

    /**
     * Uniform sampling - simpler but may cause tremor
     */
    calculateUniformPoints() {
        const step = (this.xMax - this.xMin) / this.options.samplingRate;

        for (let x = this.xMin; x <= this.xMax; x += step) {
            const y = this.functionExpression(x);
            if (!isNaN(y) && isFinite(y)) {
                this.points.push({ x, y });
            }
        }
    }

    /**
     * Adaptive sampling - more points near extrema to reduce tremor
     * This is a key technique for the Extrema Tremor fix
     */
    calculateAdaptivePoints() {
        const baseStep = (this.xMax - this.xMin) / this.options.samplingRate;
        let x = this.xMin;

        while (x <= this.xMax) {
            const y = this.functionExpression(x);

            if (!isNaN(y) && isFinite(y)) {
                // Calculate derivative approximation
                const h = baseStep * 0.01;
                const derivative = (this.functionExpression(x + h) - this.functionExpression(x - h)) / (2 * h);
                const secondDerivative = (
                    this.functionExpression(x + h) - 2 * y + this.functionExpression(x - h)
                ) / (h * h);

                this.points.push({
                    x,
                    y,
                    derivative,
                    secondDerivative,
                    curvature: Math.abs(secondDerivative)
                });

                // Adaptive step: smaller near extrema (where |derivative| is small)
                const adaptiveFactor = 1 / (1 + 10 * Math.abs(derivative));
                const step = baseStep * (0.2 + 0.8 * (1 - adaptiveFactor));
                x += step;
            } else {
                x += baseStep;
            }
        }
    }

    /**
     * Detect extrema points with numerical stability
     * Uses multiple criteria to avoid false positives that cause tremor
     */
    detectExtrema() {
        this.extremaPoints = [];

        if (this.points.length < 3) return;

        for (let i = 1; i < this.points.length - 1; i++) {
            const prev = this.points[i - 1];
            const curr = this.points[i];
            const next = this.points[i + 1];

            // Method 1: Check if derivative crosses zero
            if (curr.derivative !== undefined) {
                const derivativeCrossing =
                    (prev.derivative > 0 && next.derivative < 0) ||
                    (prev.derivative < 0 && next.derivative > 0);

                const derivativeNearZero = Math.abs(curr.derivative) < this.options.derivativeThreshold;

                if ((derivativeCrossing || derivativeNearZero) && Math.abs(curr.secondDerivative) > 0.01) {
                    const type = curr.secondDerivative < 0 ? 'maximum' : 'minimum';
                    this.extremaPoints.push({ ...curr, type, index: i });
                }
            } else {
                // Method 2: Simple comparison (fallback)
                const isMaximum = curr.y > prev.y && curr.y > next.y;
                const isMinimum = curr.y < prev.y && curr.y < next.y;

                // Additional check: ensure it's a significant extremum
                const prominence = Math.min(
                    Math.abs(curr.y - prev.y),
                    Math.abs(curr.y - next.y)
                );

                if ((isMaximum || isMinimum) && prominence > 0.1) {
                    const type = isMaximum ? 'maximum' : 'minimum';
                    this.extremaPoints.push({ ...curr, type, index: i });
                }
            }
        }

        // Apply smoothing to extrema positions to prevent tremor
        if (this.options.enableAntiTremor) {
            this.smoothExtremaPositions();
        }
    }

    /**
     * Smooth extrema positions using moving average
     * This prevents the visual tremor effect
     */
    smoothExtremaPositions() {
        if (this.extremaPoints.length === 0) return;

        // Refine extrema positions using local quadratic interpolation
        this.extremaPoints = this.extremaPoints.map(extrema => {
            const idx = extrema.index;
            if (idx > 0 && idx < this.points.length - 1) {
                const p1 = this.points[idx - 1];
                const p2 = this.points[idx];
                const p3 = this.points[idx + 1];

                // Quadratic interpolation to find exact extremum
                const denom = (p1.x - p2.x) * (p1.x - p3.x) * (p2.x - p3.x);
                if (Math.abs(denom) > 1e-10) {
                    const A = (p3.x * (p2.y - p1.y) + p2.x * (p1.y - p3.y) + p1.x * (p3.y - p2.y)) / denom;

                    if (Math.abs(A) > 1e-10) {
                        const B = (p3.x * p3.x * (p1.y - p2.y) + p2.x * p2.x * (p3.y - p1.y) + p1.x * p1.x * (p2.y - p3.y)) / denom;
                        const xExtrema = -B / (2 * A);

                        // Only use interpolated value if it's close to original
                        if (Math.abs(xExtrema - p2.x) < (p3.x - p1.x)) {
                            const yExtrema = this.functionExpression(xExtrema);
                            return { ...extrema, x: xExtrema, y: yExtrema };
                        }
                    }
                }
            }
            return extrema;
        });
    }

    /**
     * Set viewport bounds
     */
    setViewport(xMin, xMax, yMin, yMax) {
        this.xMin = xMin;
        this.xMax = xMax;
        this.yMin = yMin;
        this.yMax = yMax;

        if (this.functionExpression) {
            this.calculatePoints();
            this.detectExtrema();
            this.render();
        }
    }

    /**
     * Convert graph coordinates to canvas coordinates
     */
    graphToCanvas(x, y) {
        const padding = 40;
        const plotWidth = this.width - 2 * padding;
        const plotHeight = this.height - 2 * padding;

        const canvasX = padding + ((x - this.xMin) / (this.xMax - this.xMin)) * plotWidth;
        const canvasY = padding + (1 - (y - this.yMin) / (this.yMax - this.yMin)) * plotHeight;

        return { x: canvasX, y: canvasY };
    }

    /**
     * Main render function
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        this.drawGrid();

        // Draw axes
        this.drawAxes();

        // Draw function curve with anti-tremor smoothing
        this.drawCurve();

        // Draw extrema points
        this.drawExtremaPoints();

        // Draw labels
        this.drawLabels();
    }

    drawGrid() {
        this.ctx.strokeStyle = this.options.gridColor;
        this.ctx.lineWidth = 0.5;
        this.ctx.setLineDash([2, 2]);

        const xStep = (this.xMax - this.xMin) / 10;
        const yStep = (this.yMax - this.yMin) / 10;

        // Vertical lines
        for (let x = this.xMin; x <= this.xMax; x += xStep) {
            const p1 = this.graphToCanvas(x, this.yMin);
            const p2 = this.graphToCanvas(x, this.yMax);
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = this.yMin; y <= this.yMax; y += yStep) {
            const p1 = this.graphToCanvas(this.xMin, y);
            const p2 = this.graphToCanvas(this.xMax, y);
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);
    }

    drawAxes() {
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1.5;

        // X-axis
        if (this.yMin <= 0 && this.yMax >= 0) {
            const p1 = this.graphToCanvas(this.xMin, 0);
            const p2 = this.graphToCanvas(this.xMax, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }

        // Y-axis
        if (this.xMin <= 0 && this.xMax >= 0) {
            const p1 = this.graphToCanvas(0, this.yMin);
            const p2 = this.graphToCanvas(0, this.yMax);
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw curve with Catmull-Rom spline for smooth rendering
     * This is critical for preventing visual tremor
     */
    drawCurve() {
        if (this.points.length < 2) return;

        this.ctx.strokeStyle = this.options.lineColor;
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();

        // Apply Catmull-Rom spline for smooth curves
        if (this.options.enableAntiTremor && this.points.length >= 4) {
            this.drawSmoothCurve();
        } else {
            this.drawLinearCurve();
        }

        this.ctx.stroke();
    }

    drawLinearCurve() {
        const firstPoint = this.graphToCanvas(this.points[0].x, this.points[0].y);
        this.ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < this.points.length; i++) {
            const point = this.graphToCanvas(this.points[i].x, this.points[i].y);
            this.ctx.lineTo(point.x, point.y);
        }
    }

    /**
     * Catmull-Rom spline interpolation for ultra-smooth curves
     * Eliminates tremor by using smooth interpolation
     */
    drawSmoothCurve() {
        const tension = 0.5; // Catmull-Rom tension

        let p0 = this.graphToCanvas(this.points[0].x, this.points[0].y);
        this.ctx.moveTo(p0.x, p0.y);

        for (let i = 0; i < this.points.length - 1; i++) {
            const p0_idx = Math.max(0, i - 1);
            const p1_idx = i;
            const p2_idx = i + 1;
            const p3_idx = Math.min(this.points.length - 1, i + 2);

            const cp0 = this.graphToCanvas(this.points[p0_idx].x, this.points[p0_idx].y);
            const cp1 = this.graphToCanvas(this.points[p1_idx].x, this.points[p1_idx].y);
            const cp2 = this.graphToCanvas(this.points[p2_idx].x, this.points[p2_idx].y);
            const cp3 = this.graphToCanvas(this.points[p3_idx].x, this.points[p3_idx].y);

            // Calculate control points for Bezier curve
            const cp1x = cp1.x + (cp2.x - cp0.x) / 6 * tension;
            const cp1y = cp1.y + (cp2.y - cp0.y) / 6 * tension;
            const cp2x = cp2.x - (cp3.x - cp1.x) / 6 * tension;
            const cp2y = cp2.y - (cp3.y - cp1.y) / 6 * tension;

            this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cp2.x, cp2.y);
        }
    }

    drawExtremaPoints() {
        this.extremaPoints.forEach(extrema => {
            const point = this.graphToCanvas(extrema.x, extrema.y);

            // Draw point
            this.ctx.fillStyle = this.options.extremaPointColor;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, this.options.extremaPointRadius, 0, 2 * Math.PI);
            this.ctx.fill();

            // Draw border
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw label
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '12px Arial';
            const label = extrema.type === 'maximum' ? 'Max' : 'Min';
            const coords = `(${extrema.x.toFixed(2)}, ${extrema.y.toFixed(2)})`;

            const offsetY = extrema.type === 'maximum' ? -15 : 20;
            this.ctx.fillText(label, point.x + 8, point.y + offsetY);
            this.ctx.font = '10px Arial';
            this.ctx.fillStyle = '#666666';
            this.ctx.fillText(coords, point.x + 8, point.y + offsetY + 12);
        });
    }

    drawLabels() {
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '12px Arial';

        // X-axis label
        this.ctx.fillText('x', this.width - 20, this.height / 2 + 20);

        // Y-axis label
        this.ctx.fillText('y', this.width / 2 + 10, 20);
    }

    /**
     * Clear the graph
     */
    clear() {
        this.points = [];
        this.extremaPoints = [];
        this.functionExpression = null;
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Export graph as image
     */
    exportImage(format = 'png') {
        return this.canvas.toDataURL(`image/${format}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphRenderer;
}
