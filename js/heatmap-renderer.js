/**
 * Heat Map Renderer
 *
 * Renders slope heat map visualization on canvas
 */

class HeatMapRenderer {
    constructor(canvasId, slopeEngine) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.slopeEngine = slopeEngine;
        this.data = [];
        this.selectedIndex = -1;

        // Set canvas size
        this.resize();

        // Add mouse interaction
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    /**
     * Resize canvas to fit container
     */
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    /**
     * Set data for visualization
     * @param {Array} data - Array of question objects with slope values
     */
    setData(data) {
        this.data = data;
        this.render();
    }

    /**
     * Render heat map visualization
     */
    render() {
        if (!this.data || this.data.length === 0) {
            this.renderEmpty();
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate layout
        const padding = 40;
        const width = this.canvas.width - padding * 2;
        const height = this.canvas.height - padding * 2;
        const barWidth = Math.max(20, Math.min(60, width / this.data.length - 5));
        const maxBarHeight = height - 60;

        // Find max slope for scaling
        const maxSlope = Math.max(...this.data.map(d => d.slope));

        // Render bars
        this.data.forEach((item, index) => {
            const x = padding + index * (barWidth + 5);
            const barHeight = (item.slope / maxSlope) * maxBarHeight;
            const y = padding + maxBarHeight - barHeight;

            // Get color based on slope
            const color = this.slopeEngine.getColor(item.slope);

            // Draw bar
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, barWidth, barHeight);

            // Highlight selected
            if (index === this.selectedIndex) {
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
            }

            // Draw slope value
            this.ctx.fillStyle = '#333';
            this.ctx.font = '11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.slope.toFixed(1), x + barWidth / 2, y - 5);

            // Draw position label
            this.ctx.fillText(`#${item.position}`, x + barWidth / 2, padding + maxBarHeight + 20);
        });

        // Render legend
        this.renderLegend();

        // Render info panel
        if (this.selectedIndex >= 0) {
            this.renderInfoPanel(this.data[this.selectedIndex]);
        }
    }

    /**
     * Render empty state
     */
    renderEmpty() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#999';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Moodle에서 데이터를 불러오는 중...',
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    }

    /**
     * Render color legend
     */
    renderLegend() {
        const legendX = this.canvas.width - 200;
        const legendY = 20;
        const legendWidth = 180;
        const legendHeight = 20;

        // Draw gradient
        const gradient = this.ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0);
        gradient.addColorStop(0, this.slopeEngine.getColor(0));
        gradient.addColorStop(0.25, this.slopeEngine.getColor(5));
        gradient.addColorStop(0.5, this.slopeEngine.getColor(10));
        gradient.addColorStop(0.75, this.slopeEngine.getColor(15));
        gradient.addColorStop(1, this.slopeEngine.getColor(20));

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

        // Draw border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

        // Draw labels
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('완만', legendX, legendY + legendHeight + 15);
        this.ctx.textAlign = 'right';
        this.ctx.fillText('가파름', legendX + legendWidth, legendY + legendHeight + 15);
    }

    /**
     * Render info panel for selected item
     * @param {Object} item - Selected question item
     */
    renderInfoPanel(item) {
        const panelX = 10;
        const panelY = 10;
        const panelWidth = 250;
        const panelHeight = 120;

        // Draw background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Draw content
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`문제 #${item.position}`, panelX + 10, panelY + 25);

        this.ctx.font = '12px Arial';
        this.ctx.fillText(`기울기: ${item.slope.toFixed(2)}`, panelX + 10, panelY + 45);
        this.ctx.fillText(`성공률: ${item.successRate}%`, panelX + 10, panelY + 65);
        this.ctx.fillText(`시도 횟수: ${item.attemptCount}`, panelX + 10, panelY + 85);
        this.ctx.fillText(`배점: ${item.defaultMark}점`, panelX + 10, panelY + 105);
    }

    /**
     * Handle canvas click
     * @param {MouseEvent} e - Mouse event
     */
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const index = this.getBarIndex(x, y);
        this.selectedIndex = index;
        this.render();
    }

    /**
     * Handle mouse move
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const index = this.getBarIndex(x, y);
        this.canvas.style.cursor = index >= 0 ? 'pointer' : 'default';
    }

    /**
     * Get bar index at coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @return {number} Bar index or -1
     */
    getBarIndex(x, y) {
        const padding = 40;
        const width = this.canvas.width - padding * 2;
        const barWidth = Math.max(20, Math.min(60, width / this.data.length - 5));

        for (let i = 0; i < this.data.length; i++) {
            const barX = padding + i * (barWidth + 5);
            if (x >= barX && x <= barX + barWidth) {
                return i;
            }
        }

        return -1;
    }
}
