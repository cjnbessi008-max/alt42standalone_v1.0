/**
 * Feature Spotlight - Main Component
 *
 * Coordinates mathematical analysis and visualization
 * Highlights key features: extrema, inflection points, monotonic intervals
 */

class FeatureSpotlight {
    constructor(options = {}) {
        this.canvasId = options.canvasId || 'spotlight-canvas';
        this.canvas = null;
        this.ctx = null;
        this.analyzer = null;
        this.currentFunction = null;
        this.analysisResults = null;
        this.plotData = null;

        // Visual settings
        this.colors = {
            background: '#ffffff',
            axes: '#333333',
            grid: '#eeeeee',
            function: '#000000',
            local_maximum: '#FF4444',
            local_minimum: '#4444FF',
            inflection_point: '#44FF44',
            increasing_interval: 'rgba(255, 170, 0, 0.2)',
            decreasing_interval: 'rgba(170, 0, 255, 0.2)'
        };

        this.featureLabels = {
            local_maximum: { en: 'Local Max', ko: '극대' },
            local_minimum: { en: 'Local Min', ko: '극소' },
            inflection_point: { en: 'Inflection', ko: '변곡점' },
            increasing_interval: { en: 'Increasing', ko: '증가' },
            decreasing_interval: { en: 'Decreasing', ko: '감소' }
        };

        this.language = options.language || 'ko';
        this.showLabels = options.showLabels !== false;
        this.pointSize = options.pointSize || 6;

        this.init();
    }

    /**
     * Initialize the spotlight component
     */
    init() {
        // Create canvas if it doesn't exist
        this.canvas = document.getElementById(this.canvasId);

        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = this.canvasId;
            this.canvas.width = 800;
            this.canvas.height = 600;
        }

        this.ctx = this.canvas.getContext('2d');

        // Initialize math analyzer
        this.analyzer = new MathAnalyzer({
            xMin: -10,
            xMax: 10,
            samplePoints: 1000
        });

        // Setup click handler for feature interaction
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        console.log('Feature Spotlight initialized');
    }

    /**
     * Analyze and visualize a mathematical function
     *
     * @param {string} functionExpr - Mathematical function expression
     * @param {Object} options - Analysis options
     * @returns {Object} Analysis results
     */
    async analyze(functionExpr, options = {}) {
        this.currentFunction = functionExpr;

        // Update analyzer range if provided
        if (options.xMin !== undefined) this.analyzer.xMin = options.xMin;
        if (options.xMax !== undefined) this.analyzer.xMax = options.xMax;

        // Perform analysis
        this.analysisResults = this.analyzer.analyzeFunction(functionExpr);
        this.plotData = this.analyzer.generatePlotData(functionExpr, 200);

        // Draw visualization
        this.draw();

        return this.analysisResults;
    }

    /**
     * Draw the complete visualization
     */
    draw() {
        if (!this.plotData || !this.analysisResults) {
            console.warn('No data to draw');
            return;
        }

        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate coordinate transformation
        const padding = 60;
        const plotWidth = this.canvas.width - 2 * padding;
        const plotHeight = this.canvas.height - 2 * padding;

        const xMin = this.analyzer.xMin;
        const xMax = this.analyzer.xMax;

        // Find y range from plot data
        const yValues = this.plotData.map(pt => pt.y);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        const yRange = yMax - yMin;
        const yPadding = yRange * 0.1;

        const yMinPadded = yMin - yPadding;
        const yMaxPadded = yMax + yPadding;

        // Transform functions
        const toCanvasX = (x) => padding + ((x - xMin) / (xMax - xMin)) * plotWidth;
        const toCanvasY = (y) => padding + plotHeight - ((y - yMinPadded) / (yMaxPadded - yMinPadded)) * plotHeight;

        // Draw grid
        this.drawGrid(toCanvasX, toCanvasY, xMin, xMax, yMinPadded, yMaxPadded, padding);

        // Draw axes
        this.drawAxes(toCanvasX, toCanvasY, padding, plotWidth, plotHeight);

        // Highlight intervals
        this.drawIntervals(toCanvasX, toCanvasY, padding, plotHeight);

        // Draw function curve
        this.drawFunction(toCanvasX, toCanvasY);

        // Highlight features
        this.drawFeatures(toCanvasX, toCanvasY);

        // Draw legend
        this.drawLegend();
    }

    /**
     * Draw grid lines
     */
    drawGrid(toCanvasX, toCanvasY, xMin, xMax, yMin, yMax, padding) {
        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        // Vertical grid lines
        const xStep = (xMax - xMin) / 10;
        for (let x = Math.ceil(xMin); x <= xMax; x += xStep) {
            const canvasX = toCanvasX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, padding);
            this.ctx.lineTo(canvasX, this.canvas.height - padding);
            this.ctx.stroke();
        }

        // Horizontal grid lines
        const yStep = (yMax - yMin) / 10;
        for (let y = Math.ceil(yMin); y <= yMax; y += yStep) {
            const canvasY = toCanvasY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(padding, canvasY);
            this.ctx.lineTo(this.canvas.width - padding, canvasY);
            this.ctx.stroke();
        }
    }

    /**
     * Draw x and y axes
     */
    drawAxes(toCanvasX, toCanvasY, padding, plotWidth, plotHeight) {
        this.ctx.strokeStyle = this.colors.axes;
        this.ctx.lineWidth = 2;

        // X-axis
        const xAxisY = toCanvasY(0);
        this.ctx.beginPath();
        this.ctx.moveTo(padding, xAxisY);
        this.ctx.lineTo(padding + plotWidth, xAxisY);
        this.ctx.stroke();

        // Y-axis
        const yAxisX = toCanvasX(0);
        this.ctx.beginPath();
        this.ctx.moveTo(yAxisX, padding);
        this.ctx.lineTo(yAxisX, padding + plotHeight);
        this.ctx.stroke();

        // Labels
        this.ctx.fillStyle = this.colors.axes;
        this.ctx.font = '14px Arial';
        this.ctx.fillText('x', padding + plotWidth + 5, xAxisY);
        this.ctx.fillText('y', yAxisX, padding - 10);
    }

    /**
     * Draw increasing/decreasing interval highlights
     */
    drawIntervals(toCanvasX, toCanvasY, padding, plotHeight) {
        const features = this.analysisResults.features;

        // Increasing intervals
        features.increasing_intervals.forEach(interval => {
            const x1 = toCanvasX(interval[0]);
            const x2 = toCanvasX(interval[1]);

            this.ctx.fillStyle = this.colors.increasing_interval;
            this.ctx.fillRect(x1, padding, x2 - x1, plotHeight);
        });

        // Decreasing intervals
        features.decreasing_intervals.forEach(interval => {
            const x1 = toCanvasX(interval[0]);
            const x2 = toCanvasX(interval[1]);

            this.ctx.fillStyle = this.colors.decreasing_interval;
            this.ctx.fillRect(x1, padding, x2 - x1, plotHeight);
        });
    }

    /**
     * Draw the function curve
     */
    drawFunction(toCanvasX, toCanvasY) {
        this.ctx.strokeStyle = this.colors.function;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        let firstPoint = true;
        this.plotData.forEach(pt => {
            const canvasX = toCanvasX(pt.x);
            const canvasY = toCanvasY(pt.y);

            if (firstPoint) {
                this.ctx.moveTo(canvasX, canvasY);
                firstPoint = false;
            } else {
                this.ctx.lineTo(canvasX, canvasY);
            }
        });

        this.ctx.stroke();
    }

    /**
     * Draw feature highlights (maxima, minima, inflection points)
     */
    drawFeatures(toCanvasX, toCanvasY) {
        const features = this.analysisResults.features;

        // Draw local maxima
        features.local_maxima.forEach(pt => {
            this.drawPoint(toCanvasX(pt.x), toCanvasY(pt.y), this.colors.local_maximum, 'local_maximum');
            if (this.showLabels) {
                this.drawLabel(toCanvasX(pt.x), toCanvasY(pt.y), 'local_maximum', `(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`);
            }
        });

        // Draw local minima
        features.local_minima.forEach(pt => {
            this.drawPoint(toCanvasX(pt.x), toCanvasY(pt.y), this.colors.local_minimum, 'local_minimum');
            if (this.showLabels) {
                this.drawLabel(toCanvasX(pt.x), toCanvasY(pt.y), 'local_minimum', `(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`);
            }
        });

        // Draw inflection points
        features.inflection_points.forEach(pt => {
            this.drawPoint(toCanvasX(pt.x), toCanvasY(pt.y), this.colors.inflection_point, 'inflection_point');
            if (this.showLabels) {
                this.drawLabel(toCanvasX(pt.x), toCanvasY(pt.y), 'inflection_point', `(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`);
            }
        });
    }

    /**
     * Draw a highlighted point
     */
    drawPoint(x, y, color, type) {
        // Outer circle (glow effect)
        this.ctx.fillStyle = color + '40';
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.pointSize + 4, 0, 2 * Math.PI);
        this.ctx.fill();

        // Inner circle
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.pointSize, 0, 2 * Math.PI);
        this.ctx.fill();

        // White center
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.pointSize / 2, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Draw a label for a feature
     */
    drawLabel(x, y, type, coordinates) {
        const label = this.featureLabels[type][this.language];

        this.ctx.fillStyle = this.colors[type];
        this.ctx.font = 'bold 12px Arial';

        const labelY = y - this.pointSize - 10;
        this.ctx.fillText(label, x + 10, labelY);

        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#666666';
        this.ctx.fillText(coordinates, x + 10, labelY + 12);
    }

    /**
     * Draw legend
     */
    drawLegend() {
        const legendX = 10;
        const legendY = 10;
        const lineHeight = 25;
        let y = legendY;

        // Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(legendX, legendY, 150, 160);
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.strokeRect(legendX, legendY, 150, 160);

        // Title
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('Features (주요 특징)', legendX + 10, y + 20);
        y += 30;

        // Feature items
        const features = [
            ['local_maximum', '극대값'],
            ['local_minimum', '극소값'],
            ['inflection_point', '변곡점'],
            ['increasing_interval', '증가 구간'],
            ['decreasing_interval', '감소 구간']
        ];

        features.forEach(([type, label]) => {
            // Color indicator
            this.ctx.fillStyle = this.colors[type];
            if (type.includes('interval')) {
                this.ctx.fillRect(legendX + 10, y, 15, 15);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(legendX + 17, y + 7, 7, 0, 2 * Math.PI);
                this.ctx.fill();
            }

            // Label
            this.ctx.fillStyle = '#000000';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(label, legendX + 35, y + 12);

            y += lineHeight;
        });
    }

    /**
     * Handle canvas click to show feature details
     */
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Check if click is near any feature point
        // Implementation would check proximity to each feature and show details
        console.log('Canvas clicked at:', clickX, clickY);
    }

    /**
     * Get analysis results
     */
    getResults() {
        return this.analysisResults;
    }

    /**
     * Update visualization settings
     */
    updateSettings(settings) {
        if (settings.language) this.language = settings.language;
        if (settings.showLabels !== undefined) this.showLabels = settings.showLabels;
        if (settings.pointSize) this.pointSize = settings.pointSize;

        this.draw();
    }

    /**
     * Export canvas as image
     */
    exportImage(format = 'png') {
        return this.canvas.toDataURL(`image/${format}`);
    }

    /**
     * Clear the visualization
     */
    clear() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentFunction = null;
        this.analysisResults = null;
        this.plotData = null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeatureSpotlight;
}
