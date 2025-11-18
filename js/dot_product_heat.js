/**
 * Dot Product Heat Visualization Engine
 * Calculates dot product and visualizes as heat/temperature
 */

class DotProductHeat {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.scale = 40; // pixels per unit

        this.vector1 = { x: 0, y: 0 };
        this.vector2 = { x: 0, y: 0 };
        this.dotProduct = 0;
        this.heatColor = '#FFFFFF';

        this.init();
    }

    init() {
        this.drawGrid();
        this.drawAxes();
    }

    /**
     * Set vectors and calculate dot product
     */
    setVectors(v1, v2) {
        this.vector1 = v1;
        this.vector2 = v2;
        this.dotProduct = this.calculateDotProduct(v1, v2);
        this.heatColor = this.calculateHeatColor(this.dotProduct);
        this.draw();
        return {
            dotProduct: this.dotProduct,
            heatColor: this.heatColor
        };
    }

    /**
     * Calculate dot product: v1 · v2 = x1*x2 + y1*y2
     */
    calculateDotProduct(v1, v2) {
        return (v1.x * v2.x) + (v1.y * v2.y);
    }

    /**
     * Calculate heat color based on dot product
     * Positive = warm (red), Negative = cold (blue), Zero = neutral (white)
     */
    calculateHeatColor(dotProduct) {
        // Determine max magnitude for normalization
        const magnitude1 = Math.sqrt(this.vector1.x ** 2 + this.vector1.y ** 2);
        const magnitude2 = Math.sqrt(this.vector2.x ** 2 + this.vector2.y ** 2);
        const maxPossible = magnitude1 * magnitude2;

        // Normalize to -1 to 1
        const normalized = maxPossible !== 0 ? dotProduct / maxPossible : 0;

        // Map to 0-1 scale (for color interpolation)
        const heatValue = (normalized + 1) / 2;

        let r, g, b;

        if (heatValue < 0.5) {
            // Blue to White (cold to neutral)
            const ratio = heatValue * 2;
            r = Math.round(0 + (255 * ratio));
            g = Math.round(0 + (255 * ratio));
            b = 255;
        } else {
            // White to Red (neutral to warm)
            const ratio = (heatValue - 0.5) * 2;
            r = 255;
            g = Math.round(255 - (255 * ratio));
            b = Math.round(255 - (255 * ratio));
        }

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Draw the entire visualization
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background with heat color
        this.drawHeatBackground();

        // Draw grid and axes
        this.drawGrid();
        this.drawAxes();

        // Draw vectors
        this.drawVector(this.vector1, '#FF6B6B', 'v₁');
        this.drawVector(this.vector2, '#4ECDC4', 'v₂');

        // Draw angle arc
        this.drawAngleArc();

        // Draw dot product info
        this.drawDotProductInfo();
    }

    /**
     * Draw heat-colored background
     */
    drawHeatBackground() {
        // Create gradient background
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 0,
            this.centerX, this.centerY, this.width / 2
        );

        gradient.addColorStop(0, this.heatColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Draw grid
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.width; x += this.scale) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.height; y += this.scale) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw coordinate axes
     */
    drawAxes() {
        this.ctx.strokeStyle = '#374151';
        this.ctx.lineWidth = 2;

        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.centerY);
        this.ctx.lineTo(this.width, this.centerY);
        this.ctx.stroke();

        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, 0);
        this.ctx.lineTo(this.centerX, this.height);
        this.ctx.stroke();

        // Arrows
        this.drawArrow(this.width - 10, this.centerY, this.width - 5, this.centerY);
        this.drawArrow(this.centerX, 10, this.centerX, 5);

        // Labels
        this.ctx.fillStyle = '#374151';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText('x', this.width - 15, this.centerY + 15);
        this.ctx.fillText('y', this.centerX + 5, 15);
    }

    /**
     * Draw arrow head
     */
    drawArrow(fromX, fromY, toX, toY) {
        const headLength = 8;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
    }

    /**
     * Draw a vector
     */
    drawVector(vector, color, label) {
        const endX = this.centerX + (vector.x * this.scale);
        const endY = this.centerY - (vector.y * this.scale);

        // Draw vector line
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, this.centerY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Draw arrow head
        this.drawArrowHead(this.centerX, this.centerY, endX, endY, color);

        // Draw label
        this.ctx.fillStyle = color;
        this.ctx.font = 'bold 14px Arial';
        const labelX = endX + (vector.x > 0 ? 10 : -25);
        const labelY = endY - (vector.y > 0 ? 10 : -10);
        this.ctx.fillText(`${label} (${vector.x}, ${vector.y})`, labelX, labelY);
    }

    /**
     * Draw arrow head for vector
     */
    drawArrowHead(fromX, fromY, toX, toY, color) {
        const headLength = 12;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 7),
            toY - headLength * Math.sin(angle - Math.PI / 7)
        );
        this.ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 7),
            toY - headLength * Math.sin(angle + Math.PI / 7)
        );
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Draw angle arc between vectors
     */
    drawAngleArc() {
        const angle1 = Math.atan2(this.vector1.y, this.vector1.x);
        const angle2 = Math.atan2(this.vector2.y, this.vector2.x);
        const arcRadius = 30;

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, arcRadius, -angle1, -angle2, angle1 > angle2);
        this.ctx.stroke();
    }

    /**
     * Draw dot product information
     */
    drawDotProductInfo() {
        const infoX = 10;
        const infoY = this.height - 60;

        // Background box
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(infoX - 5, infoY - 5, 180, 50);
        this.ctx.strokeStyle = '#374151';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(infoX - 5, infoY - 5, 180, 50);

        // Dot product formula
        this.ctx.fillStyle = '#374151';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(
            `v₁ · v₂ = (${this.vector1.x})(${this.vector2.x}) + (${this.vector1.y})(${this.vector2.y})`,
            infoX,
            infoY + 10
        );

        // Result
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(
            `= ${this.dotProduct.toFixed(2)}`,
            infoX,
            infoY + 30
        );
    }

    /**
     * Update heat indicator bar position
     */
    updateHeatBar(dotProduct) {
        const heatBar = document.getElementById('heatBar');
        if (!heatBar) return;

        // Calculate normalized position (0 to 100%)
        const magnitude1 = Math.sqrt(this.vector1.x ** 2 + this.vector1.y ** 2);
        const magnitude2 = Math.sqrt(this.vector2.x ** 2 + this.vector2.y ** 2);
        const maxPossible = magnitude1 * magnitude2;

        const normalized = maxPossible !== 0 ? dotProduct / maxPossible : 0;
        const position = ((normalized + 1) / 2) * 100; // 0-100%

        // Update indicator position
        heatBar.style.setProperty('--indicator-position', `${position}%`);
    }
}
