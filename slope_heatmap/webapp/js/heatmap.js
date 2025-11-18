/**
 * Slope Heatmap Visualization Module
 * Visualizes slope data as a heatmap
 */

class SlopeHeatmap {
    constructor() {
        this.canvas = document.getElementById('heatmap-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('heatmap-container');

        // Heatmap dimensions
        this.width = 400;
        this.height = 300;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Data ranges
        this.betaMin = -180;
        this.betaMax = 180;
        this.gammaMin = -90;
        this.gammaMax = 90;

        // Grid configuration
        this.gridSize = 5; // 5 degree bins
        this.betaBins = Math.ceil((this.betaMax - this.betaMin) / this.gridSize);
        this.gammaBins = Math.ceil((this.gammaMax - this.gammaMin) / this.gridSize);

        // Heatmap data
        this.heatmapData = [];
        this.maxValue = 1;

        // Color scheme
        this.colorStops = [
            { stop: 0.0, color: [0, 0, 255, 77] },      // Blue (low)
            { stop: 0.25, color: [0, 255, 255, 128] },  // Cyan
            { stop: 0.5, color: [0, 255, 0, 179] },     // Green
            { stop: 0.75, color: [255, 255, 0, 204] },  // Yellow
            { stop: 1.0, color: [255, 0, 0, 255] }      // Red (high)
        ];

        this.initializeGrid();
    }

    /**
     * Initialize empty grid
     */
    initializeGrid() {
        this.heatmapData = [];
        for (let i = 0; i < this.betaBins; i++) {
            this.heatmapData[i] = [];
            for (let j = 0; j < this.gammaBins; j++) {
                this.heatmapData[i][j] = {
                    count: 0,
                    duration: 0,
                    value: 0
                };
            }
        }
    }

    /**
     * Load heatmap data from API
     */
    async loadData(sessionId) {
        try {
            const result = await window.slopeAPI.getHeatmapData(sessionId);

            if (result.success && result.heatmap) {
                this.processData(result.heatmap);
                this.render();
                this.show();
            }
        } catch (error) {
            console.error('Failed to load heatmap data:', error);
        }
    }

    /**
     * Process raw data into grid
     */
    processData(data) {
        this.initializeGrid();
        this.maxValue = 1;

        data.forEach(point => {
            // Calculate grid position
            const betaIndex = Math.floor((point.beta_start - this.betaMin) / this.gridSize);
            const gammaIndex = Math.floor((point.gamma_start - this.gammaMin) / this.gridSize);

            // Ensure indices are within bounds
            if (betaIndex >= 0 && betaIndex < this.betaBins &&
                gammaIndex >= 0 && gammaIndex < this.gammaBins) {

                this.heatmapData[betaIndex][gammaIndex].count = point.count;
                this.heatmapData[betaIndex][gammaIndex].duration = point.duration_ms;
                this.heatmapData[betaIndex][gammaIndex].value = point.count;

                // Update max value for normalization
                if (point.count > this.maxValue) {
                    this.maxValue = point.count;
                }
            }
        });
    }

    /**
     * Update heatmap with live data
     */
    updateLive(beta, gamma) {
        // Calculate grid position
        const betaIndex = Math.floor((beta - this.betaMin) / this.gridSize);
        const gammaIndex = Math.floor((gamma - this.gammaMin) / this.gridSize);

        // Ensure indices are within bounds
        if (betaIndex >= 0 && betaIndex < this.betaBins &&
            gammaIndex >= 0 && gammaIndex < this.gammaBins) {

            this.heatmapData[betaIndex][gammaIndex].count++;
            this.heatmapData[betaIndex][gammaIndex].value =
                this.heatmapData[betaIndex][gammaIndex].count;

            // Update max value
            if (this.heatmapData[betaIndex][gammaIndex].count > this.maxValue) {
                this.maxValue = this.heatmapData[betaIndex][gammaIndex].count;
            }
        }
    }

    /**
     * Get color for a value (0-1 normalized)
     */
    getColor(normalizedValue) {
        if (normalizedValue <= 0) {
            return this.colorStops[0].color;
        }
        if (normalizedValue >= 1) {
            return this.colorStops[this.colorStops.length - 1].color;
        }

        // Find the two color stops to interpolate between
        let lowerStop = this.colorStops[0];
        let upperStop = this.colorStops[1];

        for (let i = 0; i < this.colorStops.length - 1; i++) {
            if (normalizedValue >= this.colorStops[i].stop &&
                normalizedValue <= this.colorStops[i + 1].stop) {
                lowerStop = this.colorStops[i];
                upperStop = this.colorStops[i + 1];
                break;
            }
        }

        // Interpolate between the two colors
        const range = upperStop.stop - lowerStop.stop;
        const rangeValue = normalizedValue - lowerStop.stop;
        const ratio = rangeValue / range;

        const r = Math.round(lowerStop.color[0] + ratio * (upperStop.color[0] - lowerStop.color[0]));
        const g = Math.round(lowerStop.color[1] + ratio * (upperStop.color[1] - lowerStop.color[1]));
        const b = Math.round(lowerStop.color[2] + ratio * (upperStop.color[2] - lowerStop.color[2]));
        const a = Math.round(lowerStop.color[3] + ratio * (upperStop.color[3] - lowerStop.color[3]));

        return [r, g, b, a];
    }

    /**
     * Render the heatmap
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#fafafa';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Calculate cell dimensions
        const cellWidth = this.width / this.gammaBins;
        const cellHeight = this.height / this.betaBins;

        // Draw heatmap cells
        for (let i = 0; i < this.betaBins; i++) {
            for (let j = 0; j < this.gammaBins; j++) {
                const value = this.heatmapData[i][j].value;
                const normalizedValue = this.maxValue > 0 ? value / this.maxValue : 0;

                if (normalizedValue > 0) {
                    const color = this.getColor(normalizedValue);
                    this.ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;

                    const x = j * cellWidth;
                    const y = this.height - ((i + 1) * cellHeight); // Flip Y axis

                    this.ctx.fillRect(x, y, cellWidth, cellHeight);
                }
            }
        }

        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let j = 0; j <= this.gammaBins; j++) {
            const x = j * cellWidth;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let i = 0; i <= this.betaBins; i++) {
            const y = i * cellHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Draw axes labels
        this.drawAxes(cellWidth, cellHeight);
    }

    /**
     * Draw axis labels
     */
    drawAxes(cellWidth, cellHeight) {
        this.ctx.fillStyle = '#666';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';

        // X-axis (Gamma) labels - every 30 degrees
        for (let gamma = this.gammaMin; gamma <= this.gammaMax; gamma += 30) {
            const j = (gamma - this.gammaMin) / this.gridSize;
            const x = j * cellWidth;

            this.ctx.fillText(`${gamma}°`, x, this.height - 5);
        }

        // Y-axis (Beta) labels - every 45 degrees
        this.ctx.textAlign = 'right';
        for (let beta = this.betaMin; beta <= this.betaMax; beta += 45) {
            const i = (beta - this.betaMin) / this.gridSize;
            const y = this.height - (i * cellHeight);

            this.ctx.fillText(`${beta}°`, this.width - 5, y);
        }

        // Axis titles
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#667eea';

        // X-axis title
        this.ctx.fillText('Gamma (좌우 기울기)', this.width / 2, this.height - 20);

        // Y-axis title (rotated)
        this.ctx.save();
        this.ctx.translate(15, this.height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('Beta (앞뒤 기울기)', 0, 0);
        this.ctx.restore();
    }

    /**
     * Render live (called frequently during recording)
     */
    renderLive() {
        this.render();
    }

    /**
     * Show the heatmap container
     */
    show() {
        this.container.style.display = 'block';
    }

    /**
     * Hide the heatmap container
     */
    hide() {
        this.container.style.display = 'none';
    }

    /**
     * Clear the heatmap
     */
    clear() {
        this.initializeGrid();
        this.render();
    }

    /**
     * Get statistics from heatmap data
     */
    getStats() {
        let totalCount = 0;
        let maxCount = 0;
        let hotspotCount = 0;

        for (let i = 0; i < this.betaBins; i++) {
            for (let j = 0; j < this.gammaBins; j++) {
                const count = this.heatmapData[i][j].count;
                totalCount += count;
                if (count > maxCount) maxCount = count;
                if (count > this.maxValue * 0.7) hotspotCount++;
            }
        }

        return {
            totalPoints: totalCount,
            maxIntensity: maxCount,
            hotspots: hotspotCount,
            coverage: this.getCoverage()
        };
    }

    /**
     * Calculate coverage percentage
     */
    getCoverage() {
        let coveredCells = 0;
        const totalCells = this.betaBins * this.gammaBins;

        for (let i = 0; i < this.betaBins; i++) {
            for (let j = 0; j < this.gammaBins; j++) {
                if (this.heatmapData[i][j].count > 0) {
                    coveredCells++;
                }
            }
        }

        return ((coveredCells / totalCells) * 100).toFixed(1);
    }
}

// Create global heatmap instance
window.slopeHeatmap = new SlopeHeatmap();
