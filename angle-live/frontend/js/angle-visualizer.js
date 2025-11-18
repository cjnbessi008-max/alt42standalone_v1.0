/**
 * Angle Live - Angle Visualizer
 * Canvas-based angle drawing
 */

class AngleVisualizer {
    constructor(canvasId, config) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.config = config;
        this.currentAngle = 0;
        this.currentColor = '#2196F3';

        // Set canvas size
        this.canvas.width = config.WIDTH;
        this.canvas.height = config.HEIGHT;
    }

    /**
     * Draw the angle
     */
    draw(angle, color = null) {
        this.currentAngle = angle;
        if (color) {
            this.currentColor = color;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.config.WIDTH, this.config.HEIGHT);

        // Draw base elements
        this.drawGrid();
        this.drawAxes();
        this.drawAngle();
        this.drawAngleArc();
        this.drawAngleLabel();
    }

    /**
     * Draw background grid
     */
    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;

        // Vertical lines
        for (let x = 0; x <= this.config.WIDTH; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.config.HEIGHT);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.config.HEIGHT; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.config.WIDTH, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw coordinate axes
     */
    drawAxes() {
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 1;

        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.config.CENTER_Y);
        this.ctx.lineTo(this.config.WIDTH, this.config.CENTER_Y);
        this.ctx.stroke();

        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.CENTER_X, 0);
        this.ctx.lineTo(this.config.CENTER_X, this.config.HEIGHT);
        this.ctx.stroke();
    }

    /**
     * Draw the angle lines
     */
    drawAngle() {
        const angleRad = (this.currentAngle * Math.PI) / 180;

        // Calculate end points
        const endX = this.config.CENTER_X + this.config.RADIUS * Math.cos(angleRad);
        const endY = this.config.CENTER_Y - this.config.RADIUS * Math.sin(angleRad);

        // Base line (0 degrees - horizontal right)
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = this.config.LINE_WIDTH;
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.CENTER_X, this.config.CENTER_Y);
        this.ctx.lineTo(this.config.CENTER_X + this.config.RADIUS, this.config.CENTER_Y);
        this.ctx.stroke();

        // Angle line
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.config.LINE_WIDTH;
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.CENTER_X, this.config.CENTER_Y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Center dot
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(this.config.CENTER_X, this.config.CENTER_Y, 5, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Draw angle arc
     */
    drawAngleArc() {
        const angleRad = (this.currentAngle * Math.PI) / 180;
        const arcRadius = 50;

        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.arc(
            this.config.CENTER_X,
            this.config.CENTER_Y,
            arcRadius,
            -angleRad,
            0,
            false
        );
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    /**
     * Draw angle label
     */
    drawAngleLabel() {
        const angleRad = (this.currentAngle * Math.PI) / 180;
        const labelRadius = 70;
        const labelX = this.config.CENTER_X + labelRadius * Math.cos(angleRad / 2);
        const labelY = this.config.CENTER_Y - labelRadius * Math.sin(angleRad / 2);

        this.ctx.fillStyle = this.currentColor;
        this.ctx.font = `bold ${this.config.FONT_SIZE}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.currentAngle + '°', labelX, labelY);
    }

    /**
     * Set color
     */
    setColor(colorKey) {
        this.currentColor = CONFIG.COLORS[colorKey] || CONFIG.COLORS['color-default'];
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.config.WIDTH, this.config.HEIGHT);
    }
}

/**
 * Mini Angle Visualizer for smartphone display
 */
class MiniAngleVisualizer extends AngleVisualizer {
    constructor(canvasId, config) {
        super(canvasId, config);
    }

    /**
     * Draw simplified angle (override parent)
     */
    draw(angle, color = null) {
        this.currentAngle = angle;
        if (color) {
            this.currentColor = color;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.config.WIDTH, this.config.HEIGHT);

        // Draw simplified version
        this.drawSimpleAngle();
        this.drawSimpleArc();
        this.drawSimpleLabel();
    }

    /**
     * Draw simple angle without grid
     */
    drawSimpleAngle() {
        const angleRad = (this.currentAngle * Math.PI) / 180;
        const endX = this.config.CENTER_X + this.config.RADIUS * Math.cos(angleRad);
        const endY = this.config.CENTER_Y - this.config.RADIUS * Math.sin(angleRad);

        // Base line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = this.config.LINE_WIDTH;
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.CENTER_X, this.config.CENTER_Y);
        this.ctx.lineTo(this.config.CENTER_X + this.config.RADIUS, this.config.CENTER_Y);
        this.ctx.stroke();

        // Angle line
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = this.config.LINE_WIDTH + 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.config.CENTER_X, this.config.CENTER_Y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Center dot
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(this.config.CENTER_X, this.config.CENTER_Y, 4, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Draw simple arc
     */
    drawSimpleArc() {
        const angleRad = (this.currentAngle * Math.PI) / 180;
        const arcRadius = 40;

        this.ctx.strokeStyle = this.currentColor;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.7;

        this.ctx.beginPath();
        this.ctx.arc(
            this.config.CENTER_X,
            this.config.CENTER_Y,
            arcRadius,
            -angleRad,
            0,
            false
        );
        this.ctx.stroke();

        this.ctx.globalAlpha = 1.0;
    }

    /**
     * Draw simple label
     */
    drawSimpleLabel() {
        const angleRad = (this.currentAngle * Math.PI) / 180;
        const labelRadius = 55;
        const labelX = this.config.CENTER_X + labelRadius * Math.cos(angleRad / 2);
        const labelY = this.config.CENTER_Y - labelRadius * Math.sin(angleRad / 2);

        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${this.config.FONT_SIZE}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.fillText(this.currentAngle + '°', labelX, labelY);
        this.ctx.shadowBlur = 0;
    }
}
