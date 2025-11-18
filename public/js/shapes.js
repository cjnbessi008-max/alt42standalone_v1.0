/**
 * Hidden Length - Shape Visualization Module
 * Handles drawing shapes and light beam animations on canvas
 */

class ShapeRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.currentShape = null;
        this.lightBeamEnabled = false;
        this.animationFrame = null;
        this.lightBeamProgress = 0;
        this.animationSpeed = 0.02;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw a shape on the canvas
     */
    drawShape(shapeData, hiddenLengthData) {
        this.currentShape = { shape: shapeData, hidden: hiddenLengthData };
        this.clear();

        const shape = shapeData;

        switch (shape.shape_type || shapeData.type) {
            case 'triangle':
                this.drawTriangle(shape);
                break;
            case 'rectangle':
                this.drawRectangle(shape);
                break;
            case 'square':
                this.drawSquare(shape);
                break;
            case 'circle':
                this.drawCircle(shape);
                break;
            default:
                this.drawGenericShape(shape);
        }

        // Draw labels
        this.drawLabels(shape, hiddenLengthData);
    }

    /**
     * Draw a triangle
     */
    drawTriangle(data) {
        const vertices = data.vertices || [
            { x: 100, y: 300 },
            { x: 100, y: 100 },
            { x: 300, y: 300 }
        ];

        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);

        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }

        this.ctx.closePath();

        // Fill
        this.ctx.fillStyle = 'rgba(74, 144, 226, 0.2)';
        this.ctx.fill();

        // Stroke
        this.ctx.strokeStyle = '#4A90E2';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Draw right angle indicator if exists
        if (data.rightAngle) {
            this.drawRightAngleIndicator(data.rightAngle);
        }
    }

    /**
     * Draw right angle indicator
     */
    drawRightAngleIndicator(point) {
        const size = 15;
        this.ctx.strokeStyle = '#4A90E2';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(point.x, point.y - size, size, size);
    }

    /**
     * Draw a rectangle
     */
    drawRectangle(data) {
        const vertices = data.vertices || [
            { x: 100, y: 100 },
            { x: 300, y: 100 },
            { x: 300, y: 250 },
            { x: 100, y: 250 }
        ];

        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);

        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }

        this.ctx.closePath();

        this.ctx.fillStyle = 'rgba(80, 200, 120, 0.2)';
        this.ctx.fill();

        this.ctx.strokeStyle = '#50C878';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    /**
     * Draw a square
     */
    drawSquare(data) {
        this.drawRectangle(data); // Same as rectangle
    }

    /**
     * Draw a circle
     */
    drawCircle(data) {
        const center = data.center || { x: 200, y: 200 };
        const radius = data.radius || 80;

        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        this.ctx.fill();

        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Draw center point
        this.ctx.beginPath();
        this.ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();
    }

    /**
     * Draw generic shape from vertices
     */
    drawGenericShape(data) {
        if (!data.vertices || data.vertices.length < 3) return;

        this.ctx.beginPath();
        this.ctx.moveTo(data.vertices[0].x, data.vertices[0].y);

        for (let i = 1; i < data.vertices.length; i++) {
            this.ctx.lineTo(data.vertices[i].x, data.vertices[i].y);
        }

        this.ctx.closePath();

        this.ctx.fillStyle = 'rgba(74, 144, 226, 0.2)';
        this.ctx.fill();

        this.ctx.strokeStyle = '#4A90E2';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    /**
     * Draw labels for side lengths
     */
    drawLabels(shapeData, hiddenData) {
        const sides = shapeData.sides;
        const vertices = shapeData.vertices;

        if (!sides || !vertices) return;

        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const hiddenSide = hiddenData.hiddenSide;

        // Label each side
        const sideKeys = Object.keys(sides);
        sideKeys.forEach((key, index) => {
            const value = sides[key];

            if (value === null || key === hiddenSide) {
                // This is the hidden side - draw question mark
                const midPoint = this.getMidPoint(vertices, index);
                this.ctx.fillStyle = '#E74C3C';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.fillText('?', midPoint.x, midPoint.y);
            } else {
                // Draw the known length
                const midPoint = this.getMidPoint(vertices, index);
                this.ctx.fillStyle = '#2C3E50';
                this.ctx.font = 'bold 16px Arial';

                // Draw background for better readability
                const text = value.toString();
                const metrics = this.ctx.measureText(text);
                const padding = 4;

                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.fillRect(
                    midPoint.x - metrics.width / 2 - padding,
                    midPoint.y - 10,
                    metrics.width + padding * 2,
                    20
                );

                this.ctx.fillStyle = '#2C3E50';
                this.ctx.fillText(text, midPoint.x, midPoint.y);
            }
        });
    }

    /**
     * Get midpoint of a side
     */
    getMidPoint(vertices, index) {
        if (!vertices || vertices.length < 2) {
            return { x: 200, y: 200 };
        }

        const v1 = vertices[index];
        const v2 = vertices[(index + 1) % vertices.length];

        // Calculate midpoint
        const midX = (v1.x + v2.x) / 2;
        const midY = (v1.y + v2.y) / 2;

        // Offset slightly outward
        const centerX = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
        const centerY = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;

        const dx = midX - centerX;
        const dy = midY - centerY;
        const len = Math.sqrt(dx * dx + dy * dy);

        const offsetX = (dx / len) * 20;
        const offsetY = (dy / len) * 20;

        return {
            x: midX + offsetX,
            y: midY + offsetY
        };
    }

    /**
     * Enable/disable light beam
     */
    setLightBeam(enabled) {
        this.lightBeamEnabled = enabled;

        if (enabled) {
            this.startLightBeamAnimation();
        } else {
            this.stopLightBeamAnimation();
            // Redraw without light beam
            if (this.currentShape) {
                this.drawShape(this.currentShape.shape, this.currentShape.hidden);
            }
        }
    }

    /**
     * Start light beam animation
     */
    startLightBeamAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.lightBeamProgress = 0;

        const animate = () => {
            if (!this.currentShape || !this.lightBeamEnabled) return;

            // Redraw shape
            this.drawShape(this.currentShape.shape, this.currentShape.hidden);

            // Draw light beam
            this.drawLightBeam(this.currentShape.hidden.lightBeam);

            // Update progress
            this.lightBeamProgress += this.animationSpeed;
            if (this.lightBeamProgress > 1) {
                this.lightBeamProgress = 0; // Loop animation
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Stop light beam animation
     */
    stopLightBeamAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /**
     * Draw light beam
     */
    drawLightBeam(lightBeamData) {
        if (!lightBeamData) return;

        const start = lightBeamData.start;
        const end = lightBeamData.end;
        const color = lightBeamData.color || '#FFD700';

        // Calculate current end point based on animation progress
        const currentX = start.x + (end.x - start.x) * this.lightBeamProgress;
        const currentY = start.y + (end.y - start.y) * this.lightBeamProgress;

        // Draw glowing line
        this.ctx.save();

        // Outer glow
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = color;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 8;
        this.ctx.globalAlpha = 0.3;

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();

        // Inner beam
        this.ctx.shadowBlur = 10;
        this.ctx.lineWidth = 4;
        this.ctx.globalAlpha = 0.8;

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();

        // Core beam
        this.ctx.shadowBlur = 5;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 1;

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.stroke();

        this.ctx.restore();

        // Draw sparkles at the end
        if (this.lightBeamProgress > 0.1) {
            this.drawSparkles(currentX, currentY, color);
        }
    }

    /**
     * Draw sparkles effect
     */
    drawSparkles(x, y, color) {
        this.ctx.save();

        const sparkleCount = 5;
        const sparkleRadius = 3;
        const spreadRadius = 15;

        for (let i = 0; i < sparkleCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkleCount + this.lightBeamProgress * Math.PI * 2;
            const distance = spreadRadius * Math.sin(this.lightBeamProgress * Math.PI);

            const sparkleX = x + Math.cos(angle) * distance;
            const sparkleY = y + Math.sin(angle) * distance;

            this.ctx.beginPath();
            this.ctx.arc(sparkleX, sparkleY, sparkleRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = 0.6;
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopLightBeamAnimation();
        this.clear();
    }
}

// Export for use in app.js
window.ShapeRenderer = ShapeRenderer;
