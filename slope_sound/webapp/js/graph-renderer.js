/**
 * Slope Sound - Graph Renderer
 * Handles canvas drawing and visualization
 */

class GraphRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Coordinate system
        this.xRange = { min: -10, max: 10 };
        this.yRange = { min: -10, max: 10 };

        // Drawing settings
        this.gridColor = '#e9ecef';
        this.axisColor = '#495057';
        this.curveColor = '#667eea';
        this.pointColor = '#764ba2';
        this.tangentColor = '#f59e0b';

        this.padding = 40;
        this.points = [];
        this.currentPoint = null;
    }

    /**
     * Set coordinate ranges
     */
    setRanges(xMin, xMax, yMin, yMax) {
        this.xRange = { min: xMin, max: xMax };
        this.yRange = { min: yMin, max: yMax };
    }

    /**
     * Convert data coordinates to canvas coordinates
     */
    dataToCanvas(x, y) {
        const canvasX = this.padding +
            ((x - this.xRange.min) / (this.xRange.max - this.xRange.min)) *
            (this.width - 2 * this.padding);

        const canvasY = this.height - this.padding -
            ((y - this.yRange.min) / (this.yRange.max - this.yRange.min)) *
            (this.height - 2 * this.padding);

        return { x: canvasX, y: canvasY };
    }

    /**
     * Convert canvas coordinates to data coordinates
     */
    canvasToData(canvasX, canvasY) {
        const x = this.xRange.min +
            ((canvasX - this.padding) / (this.width - 2 * this.padding)) *
            (this.xRange.max - this.xRange.min);

        const y = this.yRange.min +
            ((this.height - this.padding - canvasY) / (this.height - 2 * this.padding)) *
            (this.yRange.max - this.yRange.min);

        return { x, y };
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Draw grid
     */
    drawGrid() {
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 1;

        // Vertical lines
        const xStep = (this.xRange.max - this.xRange.min) / 10;
        for (let i = 0; i <= 10; i++) {
            const x = this.xRange.min + i * xStep;
            const canvasPos = this.dataToCanvas(x, 0);

            this.ctx.beginPath();
            this.ctx.moveTo(canvasPos.x, this.padding);
            this.ctx.lineTo(canvasPos.x, this.height - this.padding);
            this.ctx.stroke();
        }

        // Horizontal lines
        const yStep = (this.yRange.max - this.yRange.min) / 10;
        for (let i = 0; i <= 10; i++) {
            const y = this.yRange.min + i * yStep;
            const canvasPos = this.dataToCanvas(0, y);

            this.ctx.beginPath();
            this.ctx.moveTo(this.padding, canvasPos.y);
            this.ctx.lineTo(this.width - this.padding, canvasPos.y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw coordinate axes
     */
    drawAxes() {
        this.ctx.strokeStyle = this.axisColor;
        this.ctx.lineWidth = 2;

        // X-axis
        const xAxisY = this.dataToCanvas(0, 0).y;
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, xAxisY);
        this.ctx.lineTo(this.width - this.padding, xAxisY);
        this.ctx.stroke();

        // Y-axis
        const yAxisX = this.dataToCanvas(0, 0).x;
        this.ctx.beginPath();
        this.ctx.moveTo(yAxisX, this.padding);
        this.ctx.lineTo(yAxisX, this.height - this.padding);
        this.ctx.stroke();

        // Labels
        this.ctx.fillStyle = this.axisColor;
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';

        // X-axis labels
        for (let x = Math.ceil(this.xRange.min); x <= Math.floor(this.xRange.max); x += 2) {
            if (x === 0) continue;
            const pos = this.dataToCanvas(x, 0);
            this.ctx.fillText(x.toString(), pos.x, pos.y + 20);
        }

        // Y-axis labels
        this.ctx.textAlign = 'right';
        for (let y = Math.ceil(this.yRange.min); y <= Math.floor(this.yRange.max); y += 2) {
            if (y === 0) continue;
            const pos = this.dataToCanvas(0, y);
            this.ctx.fillText(y.toString(), pos.x - 10, pos.y + 5);
        }
    }

    /**
     * Draw function curve
     */
    drawCurve(points) {
        if (points.length < 2) return;

        this.points = points;
        this.ctx.strokeStyle = this.curveColor;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        const firstPoint = this.dataToCanvas(points[0].x, points[0].y);
        this.ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < points.length; i++) {
            const point = this.dataToCanvas(points[i].x, points[i].y);
            this.ctx.lineTo(point.x, point.y);
        }

        this.ctx.stroke();
    }

    /**
     * Draw current point and tangent line
     */
    drawPoint(x, y, slope) {
        this.currentPoint = { x, y, slope };

        const canvasPos = this.dataToCanvas(x, y);

        // Draw point
        this.ctx.fillStyle = this.pointColor;
        this.ctx.beginPath();
        this.ctx.arc(canvasPos.x, canvasPos.y, 8, 0, 2 * Math.PI);
        this.ctx.fill();

        // Draw tangent line
        if (slope !== null && isFinite(slope)) {
            this.ctx.strokeStyle = this.tangentColor;
            this.ctx.lineWidth = 2;

            // Calculate tangent line endpoints
            const dx = 1; // Length in data coordinates
            const dy = slope * dx;

            const start = this.dataToCanvas(x - dx, y - dy);
            const end = this.dataToCanvas(x + dx, y + dy);

            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();

            // Draw slope label
            this.ctx.fillStyle = this.tangentColor;
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(
                `기울기: ${slope.toFixed(2)}`,
                canvasPos.x + 15,
                canvasPos.y - 10
            );
        }
    }

    /**
     * Render complete graph
     */
    render(points, currentPoint = null) {
        this.clear();
        this.drawGrid();
        this.drawAxes();
        this.drawCurve(points);

        if (currentPoint) {
            this.drawPoint(currentPoint.x, currentPoint.y, currentPoint.slope);
        }
    }

    /**
     * Find nearest point on curve to given x coordinate
     */
    findNearestPoint(x) {
        if (this.points.length === 0) return null;

        let nearest = this.points[0];
        let minDist = Math.abs(this.points[0].x - x);

        for (let i = 1; i < this.points.length; i++) {
            const dist = Math.abs(this.points[i].x - x);
            if (dist < minDist) {
                minDist = dist;
                nearest = this.points[i];
            }
        }

        return nearest;
    }

    /**
     * Check if canvas point is within drawing area
     */
    isWithinBounds(canvasX, canvasY) {
        return canvasX >= this.padding &&
               canvasX <= this.width - this.padding &&
               canvasY >= this.padding &&
               canvasY <= this.height - this.padding;
    }
}

// Export for use in other modules
window.GraphRenderer = GraphRenderer;
