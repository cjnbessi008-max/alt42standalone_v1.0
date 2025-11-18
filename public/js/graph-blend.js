/**
 * Graph Blend - Range Visualization with Smooth Blending
 * Canvas-based graph rendering for mathematical ranges
 */

class GraphBlend {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Graph settings
        this.padding = 40;
        this.graphWidth = this.width - 2 * this.padding;
        this.graphHeight = this.height - 2 * this.padding;

        // Range settings
        this.rangeStart = -10;
        this.rangeEnd = 10;
        this.gridStep = 1;
        this.showBlend = true;

        // Problem data
        this.currentProblem = null;
        this.ranges = [];
    }

    setRange(start, end, step = 1) {
        this.rangeStart = parseFloat(start);
        this.rangeEnd = parseFloat(end);
        this.gridStep = parseFloat(step);
    }

    setBlendMode(enabled) {
        this.showBlend = enabled;
    }

    setProblem(problem, ranges = []) {
        this.currentProblem = problem;
        this.ranges = ranges;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    render() {
        this.clear();
        this.drawBackground();
        this.drawGrid();
        this.drawAxis();
        this.drawRanges();
        this.drawLabels();
    }

    drawBackground() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = '#dee2e6';
        this.ctx.lineWidth = 1;

        const step = this.gridStep;
        const numSteps = Math.ceil((this.rangeEnd - this.rangeStart) / step);

        // Vertical grid lines
        for (let i = 0; i <= numSteps; i++) {
            const x = this.padding + (i / numSteps) * this.graphWidth;

            this.ctx.beginPath();
            this.ctx.moveTo(x, this.padding);
            this.ctx.lineTo(x, this.height - this.padding);
            this.ctx.stroke();
        }

        // Horizontal center line
        const centerY = this.height / 2;
        this.ctx.strokeStyle = '#adb5bd';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, centerY);
        this.ctx.lineTo(this.width - this.padding, centerY);
        this.ctx.stroke();
    }

    drawAxis() {
        const centerY = this.height / 2;

        // X-axis (number line)
        this.ctx.strokeStyle = '#495057';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.padding, centerY);
        this.ctx.lineTo(this.width - this.padding, centerY);
        this.ctx.stroke();

        // Arrow
        this.ctx.fillStyle = '#495057';
        this.ctx.beginPath();
        this.ctx.moveTo(this.width - this.padding, centerY);
        this.ctx.lineTo(this.width - this.padding - 10, centerY - 5);
        this.ctx.lineTo(this.width - this.padding - 10, centerY + 5);
        this.ctx.fill();
    }

    drawRanges() {
        if (!this.ranges || this.ranges.length === 0) return;

        const centerY = this.height / 2;

        this.ranges.forEach((range, index) => {
            const startX = this.valueToX(range.range_start);
            const endX = this.valueToX(range.range_end);
            const color = range.color || '#2196F3';
            const opacity = range.opacity || 0.5;

            // Draw range background with blend effect
            if (this.showBlend) {
                this.drawBlendedRange(startX, endX, centerY, color, opacity);
            } else {
                this.drawSolidRange(startX, endX, centerY, color, opacity);
            }

            // Draw range markers
            this.drawRangeMarker(startX, centerY, range.range_type, color);
            this.drawRangeMarker(endX, centerY, range.range_type, color, true);

            // Draw range label
            this.drawRangeLabel(startX, endX, centerY - 60, range, index);
        });
    }

    drawBlendedRange(startX, endX, centerY, color, opacity) {
        const rangeHeight = 40;

        // Create gradient for smooth blending
        const gradient = this.ctx.createLinearGradient(startX, 0, endX, 0);

        // Parse color to RGB
        const rgb = this.hexToRgb(color);

        // Blend from transparent to solid to transparent
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        gradient.addColorStop(0.1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`);
        gradient.addColorStop(0.9, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(startX, centerY - rangeHeight/2, endX - startX, rangeHeight);

        // Draw border
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(startX, centerY - rangeHeight/2, endX - startX, rangeHeight);
    }

    drawSolidRange(startX, endX, centerY, color, opacity) {
        const rangeHeight = 40;
        const rgb = this.hexToRgb(color);

        this.ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
        this.ctx.fillRect(startX, centerY - rangeHeight/2, endX - startX, rangeHeight);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(startX, centerY - rangeHeight/2, endX - startX, rangeHeight);
    }

    drawRangeMarker(x, y, rangeType, color, isEnd = false) {
        const markerSize = 8;

        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;

        // Determine if this endpoint is included in the range
        let isIncluded = false;
        if (rangeType === 'closed') {
            isIncluded = true;
        } else if (rangeType === 'open') {
            isIncluded = false;
        } else if (rangeType === 'half_open_left') {
            isIncluded = isEnd; // Right is closed, left is open
        } else if (rangeType === 'half_open_right') {
            isIncluded = !isEnd; // Left is closed, right is open
        }

        if (isIncluded) {
            // Filled circle for included endpoint
            this.ctx.beginPath();
            this.ctx.arc(x, y, markerSize, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Open circle for excluded endpoint
            this.ctx.beginPath();
            this.ctx.arc(x, y, markerSize, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.fillStyle = 'white';
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    drawRangeLabel(startX, endX, y, range, index) {
        const midX = (startX + endX) / 2;
        const label = this.getRangeNotation(range);

        this.ctx.fillStyle = '#495057';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, midX, y);
    }

    getRangeNotation(range) {
        const start = range.range_start;
        const end = range.range_end;
        const type = range.range_type;

        let leftBracket, rightBracket;

        if (type === 'closed') {
            leftBracket = '[';
            rightBracket = ']';
        } else if (type === 'open') {
            leftBracket = '(';
            rightBracket = ')';
        } else if (type === 'half_open_left') {
            leftBracket = '(';
            rightBracket = ']';
        } else if (type === 'half_open_right') {
            leftBracket = '[';
            rightBracket = ')';
        }

        return `${leftBracket}${start}, ${end}${rightBracket}`;
    }

    drawLabels() {
        const centerY = this.height / 2;
        const step = this.gridStep;
        const numSteps = Math.ceil((this.rangeEnd - this.rangeStart) / step);

        this.ctx.fillStyle = '#495057';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';

        for (let i = 0; i <= numSteps; i++) {
            const value = this.rangeStart + i * step;
            const x = this.padding + (i / numSteps) * this.graphWidth;

            // Draw tick mark
            this.ctx.strokeStyle = '#495057';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, centerY - 5);
            this.ctx.lineTo(x, centerY + 5);
            this.ctx.stroke();

            // Draw label
            this.ctx.fillText(value.toFixed(1), x, centerY + 25);
        }
    }

    valueToX(value) {
        const ratio = (value - this.rangeStart) / (this.rangeEnd - this.rangeStart);
        return this.padding + ratio * this.graphWidth;
    }

    xToValue(x) {
        const ratio = (x - this.padding) / this.graphWidth;
        return this.rangeStart + ratio * (this.rangeEnd - this.rangeStart);
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    generateLegend() {
        const legendDiv = document.getElementById('graph-legend');

        if (!this.ranges || this.ranges.length === 0) {
            legendDiv.innerHTML = '<p class="placeholder">범위 정보 없음</p>';
            return;
        }

        legendDiv.innerHTML = '<h3 style="margin-bottom: 10px; font-size: 14px;">범위 범례</h3>' +
            this.ranges.map((range, index) => {
                const notation = this.getRangeNotation(range);
                return `
                    <div class="legend-item">
                        <div class="legend-color" style="background: ${range.color};"></div>
                        <div class="legend-text">${notation}</div>
                    </div>
                `;
            }).join('');
    }
}

// Global graph instance
let graphBlend = null;

function renderGraph(problem) {
    if (!graphBlend) {
        graphBlend = new GraphBlend('graph-canvas');
    }

    // Get settings from controls
    const rangeStart = parseFloat(document.getElementById('range-start').value);
    const rangeEnd = parseFloat(document.getElementById('range-end').value);
    const gridStep = parseFloat(document.getElementById('grid-step').value);
    const showBlend = document.getElementById('show-blend').checked;

    graphBlend.setRange(rangeStart, rangeEnd, gridStep);
    graphBlend.setBlendMode(showBlend);

    // Set problem data and ranges
    graphBlend.setProblem(problem, problem.ranges || []);

    // Render the graph
    graphBlend.render();

    // Generate legend
    graphBlend.generateLegend();
}
