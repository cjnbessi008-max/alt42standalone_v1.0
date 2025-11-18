/**
 * Real-time Velocity Graph
 * Displays velocity vs time graph
 */

class VelocityGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Setup canvas
        this.setupCanvas();

        // Data
        this.timeData = [];
        this.velocityData = [];
        this.maxTime = 10;

        // Graph settings
        this.padding = {
            top: 10,
            right: 20,
            bottom: 30,
            left: 40
        };

        this.colors = {
            axis: '#1a1a1a',
            grid: '#e1e8ed',
            line: '#667eea',
            point: '#764ba2',
            text: '#657786'
        };
    }

    setupCanvas() {
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
            this.draw();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }

    /**
     * Set max time for x-axis
     */
    setMaxTime(maxTime) {
        this.maxTime = maxTime;
    }

    /**
     * Add data point
     */
    addPoint(time, velocity) {
        this.timeData.push(time);
        this.velocityData.push(velocity);
        this.draw();
    }

    /**
     * Clear all data
     */
    clear() {
        this.timeData = [];
        this.velocityData = [];
        this.draw();
    }

    /**
     * Get graph dimensions
     */
    getGraphDimensions() {
        return {
            x: this.padding.left,
            y: this.padding.top,
            width: this.canvas.width - this.padding.left - this.padding.right,
            height: this.canvas.height - this.padding.top - this.padding.bottom
        };
    }

    /**
     * Get data ranges
     */
    getDataRanges() {
        let minVelocity = 0;
        let maxVelocity = 10;

        if (this.velocityData.length > 0) {
            minVelocity = Math.min(...this.velocityData, 0);
            maxVelocity = Math.max(...this.velocityData, 10);
        }

        // Add padding to ranges
        const range = maxVelocity - minVelocity;
        minVelocity -= range * 0.1;
        maxVelocity += range * 0.1;

        return {
            minTime: 0,
            maxTime: this.maxTime,
            minVelocity: minVelocity,
            maxVelocity: maxVelocity
        };
    }

    /**
     * Convert data coordinates to screen coordinates
     */
    dataToScreen(time, velocity, dims, ranges) {
        const x = dims.x + (time - ranges.minTime) / (ranges.maxTime - ranges.minTime) * dims.width;
        const y = dims.y + dims.height - (velocity - ranges.minVelocity) / (ranges.maxVelocity - ranges.minVelocity) * dims.height;
        return { x, y };
    }

    /**
     * Draw the graph
     */
    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Get dimensions and ranges
        const dims = this.getGraphDimensions();
        const ranges = this.getDataRanges();

        // Draw grid
        this.drawGrid(dims, ranges);

        // Draw axes
        this.drawAxes(dims, ranges);

        // Draw data
        if (this.timeData.length > 0) {
            this.drawData(dims, ranges);
        }

        // Draw labels
        this.drawLabels(dims, ranges);
    }

    /**
     * Draw grid
     */
    drawGrid(dims, ranges) {
        const ctx = this.ctx;
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;

        // Vertical grid lines (time)
        const timeStep = this.maxTime / 5;
        for (let t = 0; t <= this.maxTime; t += timeStep) {
            const pos = this.dataToScreen(t, 0, dims, ranges);
            ctx.beginPath();
            ctx.moveTo(pos.x, dims.y);
            ctx.lineTo(pos.x, dims.y + dims.height);
            ctx.stroke();
        }

        // Horizontal grid lines (velocity)
        const velocityRange = ranges.maxVelocity - ranges.minVelocity;
        const velocityStep = Math.pow(10, Math.floor(Math.log10(velocityRange / 5)));
        const firstVelocity = Math.ceil(ranges.minVelocity / velocityStep) * velocityStep;

        for (let v = firstVelocity; v <= ranges.maxVelocity; v += velocityStep) {
            const pos = this.dataToScreen(0, v, dims, ranges);
            ctx.beginPath();
            ctx.moveTo(dims.x, pos.y);
            ctx.lineTo(dims.x + dims.width, pos.y);
            ctx.stroke();
        }

        // Zero line (special)
        if (ranges.minVelocity <= 0 && ranges.maxVelocity >= 0) {
            const pos = this.dataToScreen(0, 0, dims, ranges);
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(dims.x, pos.y);
            ctx.lineTo(dims.x + dims.width, pos.y);
            ctx.stroke();
        }
    }

    /**
     * Draw axes
     */
    drawAxes(dims, ranges) {
        const ctx = this.ctx;
        ctx.strokeStyle = this.colors.axis;
        ctx.lineWidth = 2;

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(dims.x, dims.y);
        ctx.lineTo(dims.x, dims.y + dims.height);
        ctx.stroke();

        // X-axis
        ctx.beginPath();
        ctx.moveTo(dims.x, dims.y + dims.height);
        ctx.lineTo(dims.x + dims.width, dims.y + dims.height);
        ctx.stroke();
    }

    /**
     * Draw data line
     */
    drawData(dims, ranges) {
        const ctx = this.ctx;

        // Draw line
        ctx.strokeStyle = this.colors.line;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < this.timeData.length; i++) {
            const pos = this.dataToScreen(this.timeData[i], this.velocityData[i], dims, ranges);

            if (i === 0) {
                ctx.moveTo(pos.x, pos.y);
            } else {
                ctx.lineTo(pos.x, pos.y);
            }
        }

        ctx.stroke();

        // Draw current point (last point)
        if (this.timeData.length > 0) {
            const lastPos = this.dataToScreen(
                this.timeData[this.timeData.length - 1],
                this.velocityData[this.velocityData.length - 1],
                dims,
                ranges
            );

            ctx.beginPath();
            ctx.arc(lastPos.x, lastPos.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = this.colors.point;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    /**
     * Draw axis labels
     */
    drawLabels(dims, ranges) {
        const ctx = this.ctx;
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // X-axis labels (time)
        const timeStep = this.maxTime / 5;
        for (let t = 0; t <= this.maxTime; t += timeStep) {
            const pos = this.dataToScreen(t, 0, dims, ranges);
            ctx.fillText(t.toFixed(1) + 's', pos.x, dims.y + dims.height + 5);
        }

        // Y-axis labels (velocity)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        const velocityRange = ranges.maxVelocity - ranges.minVelocity;
        const velocityStep = Math.pow(10, Math.floor(Math.log10(velocityRange / 5)));
        const firstVelocity = Math.ceil(ranges.minVelocity / velocityStep) * velocityStep;

        for (let v = firstVelocity; v <= ranges.maxVelocity; v += velocityStep) {
            const pos = this.dataToScreen(0, v, dims, ranges);
            ctx.fillText(v.toFixed(1), dims.x - 5, pos.y);
        }

        // Axis titles
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = this.colors.axis;

        // X-axis title
        ctx.fillText('시간 (초)', dims.x + dims.width / 2, dims.y + dims.height + 18);

        // Y-axis title
        ctx.save();
        ctx.translate(dims.x - 30, dims.y + dims.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('속도 (m/s)', 0, 0);
        ctx.restore();
    }
}
