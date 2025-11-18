/**
 * Shape Drawing Engine with Auto Guide Lines Generator
 * Canvas-based geometry rendering with parallel and perpendicular lines
 */

class ShapeEngine {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.vertices = [];
        this.guideLines = [];
        this.tempVertices = []; // For custom drawing mode

        // Default settings
        this.settings = {
            showParallel: true,
            showPerpendicular: true,
            showLabels: true,
            parallelColor: '#4ECDC4',
            perpendicularColor: '#FF6B6B',
            shapeColor: '#2c3e50',
            vertexColor: '#667eea',
            lineThickness: 2,
            vertexRadius: 6,
            parallelOffset: 40,
            perpendicularLength: 60,
            ...options
        };

        this.animationFrame = null;
    }

    /**
     * Update settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.regenerateGuideLines();
        this.render();
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Reset everything
     */
    reset() {
        this.vertices = [];
        this.guideLines = [];
        this.tempVertices = [];
        this.clear();
    }

    /**
     * Set vertices and regenerate guide lines
     */
    setVertices(vertices) {
        if (!Array.isArray(vertices) || vertices.length < 2) {
            console.warn('Invalid vertices array');
            return false;
        }

        this.vertices = vertices.map(v => ({ x: v.x, y: v.y }));
        this.regenerateGuideLines();
        return true;
    }

    /**
     * Get current vertices
     */
    getVertices() {
        return [...this.vertices];
    }

    /**
     * Add vertex
     */
    addVertex(x, y) {
        this.vertices.push({ x, y });
        this.regenerateGuideLines();
    }

    /**
     * Create predefined shape
     */
    createShape(type, centerX, centerY, size = 80) {
        this.vertices = [];

        switch (type) {
            case 'triangle':
                this.vertices = this.createTriangle(centerX, centerY, size);
                break;

            case 'square':
                this.vertices = this.createSquare(centerX, centerY, size);
                break;

            case 'rectangle':
                this.vertices = this.createRectangle(centerX, centerY, size * 1.5, size);
                break;

            case 'pentagon':
                this.vertices = this.createPolygon(centerX, centerY, size, 5);
                break;

            case 'hexagon':
                this.vertices = this.createPolygon(centerX, centerY, size, 6);
                break;

            default:
                console.warn(`Unknown shape type: ${type}`);
                return false;
        }

        this.regenerateGuideLines();
        return true;
    }

    /**
     * Create equilateral triangle
     */
    createTriangle(cx, cy, size) {
        const height = size * Math.sqrt(3) / 2;
        return [
            { x: cx, y: cy - height * 0.67 },
            { x: cx - size / 2, y: cy + height * 0.33 },
            { x: cx + size / 2, y: cy + height * 0.33 }
        ];
    }

    /**
     * Create square
     */
    createSquare(cx, cy, size) {
        const half = size / 2;
        return [
            { x: cx - half, y: cy - half },
            { x: cx + half, y: cy - half },
            { x: cx + half, y: cy + half },
            { x: cx - half, y: cy + half }
        ];
    }

    /**
     * Create rectangle
     */
    createRectangle(cx, cy, width, height) {
        const hw = width / 2;
        const hh = height / 2;
        return [
            { x: cx - hw, y: cy - hh },
            { x: cx + hw, y: cy - hh },
            { x: cx + hw, y: cy + hh },
            { x: cx - hw, y: cy + hh }
        ];
    }

    /**
     * Create regular polygon
     */
    createPolygon(cx, cy, radius, sides) {
        const vertices = [];
        const angleStep = (Math.PI * 2) / sides;
        const startAngle = -Math.PI / 2; // Start from top

        for (let i = 0; i < sides; i++) {
            const angle = startAngle + i * angleStep;
            vertices.push({
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            });
        }

        return vertices;
    }

    /**
     * Generate parallel and perpendicular guide lines
     */
    regenerateGuideLines() {
        this.guideLines = [];

        if (this.vertices.length < 2) {
            return;
        }

        const count = this.vertices.length;

        for (let i = 0; i < count; i++) {
            const p1 = this.vertices[i];
            const p2 = this.vertices[(i + 1) % count];

            // Calculate edge vector
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);

            if (length < 0.1) continue; // Skip very short edges

            // Normalize
            const ux = dx / length;
            const uy = dy / length;

            // Perpendicular unit vector (90° rotation)
            const perpX = -uy;
            const perpY = ux;

            // Generate parallel line
            if (this.settings.showParallel) {
                const offset = this.settings.parallelOffset;
                this.guideLines.push({
                    type: 'parallel',
                    referenceEdge: i,
                    start: {
                        x: p1.x + perpX * offset,
                        y: p1.y + perpY * offset
                    },
                    end: {
                        x: p2.x + perpX * offset,
                        y: p2.y + perpY * offset
                    },
                    color: this.settings.parallelColor
                });
            }

            // Generate perpendicular line at vertex
            if (this.settings.showPerpendicular) {
                const perpLen = this.settings.perpendicularLength;
                this.guideLines.push({
                    type: 'perpendicular',
                    referenceEdge: i,
                    referenceVertex: i,
                    start: {
                        x: p1.x - perpX * perpLen / 2,
                        y: p1.y - perpY * perpLen / 2
                    },
                    end: {
                        x: p1.x + perpX * perpLen / 2,
                        y: p1.y + perpY * perpLen / 2
                    },
                    color: this.settings.perpendicularColor
                });
            }
        }
    }

    /**
     * Draw shape outline
     */
    drawShape() {
        if (this.vertices.length < 2) return;

        this.ctx.strokeStyle = this.settings.shapeColor;
        this.ctx.lineWidth = this.settings.lineThickness + 1;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(this.vertices[0].x, this.vertices[0].y);

        for (let i = 1; i < this.vertices.length; i++) {
            this.ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }

        if (this.vertices.length >= 3) {
            this.ctx.closePath();
        }

        this.ctx.stroke();
    }

    /**
     * Draw guide lines
     */
    drawGuideLines() {
        this.ctx.lineWidth = this.settings.lineThickness;
        this.ctx.lineCap = 'round';
        this.ctx.setLineDash([8, 4]);

        this.guideLines.forEach((line, index) => {
            this.ctx.strokeStyle = line.color;
            this.ctx.globalAlpha = 0.7;

            this.ctx.beginPath();
            this.ctx.moveTo(line.start.x, line.start.y);
            this.ctx.lineTo(line.end.x, line.end.y);
            this.ctx.stroke();

            // Draw label
            if (this.settings.showLabels) {
                const midX = (line.start.x + line.end.x) / 2;
                const midY = (line.start.y + line.end.y) / 2;

                this.ctx.globalAlpha = 1;
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                const label = line.type === 'parallel' ? '∥' : '⊥';

                // Background circle
                this.ctx.fillStyle = 'white';
                this.ctx.beginPath();
                this.ctx.arc(midX, midY, 12, 0, Math.PI * 2);
                this.ctx.fill();

                // Text
                this.ctx.fillStyle = line.color;
                this.ctx.fillText(label, midX, midY);
            }
        });

        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw vertices
     */
    drawVertices() {
        this.vertices.forEach((vertex, index) => {
            // Draw vertex circle
            this.ctx.fillStyle = this.settings.vertexColor;
            this.ctx.beginPath();
            this.ctx.arc(vertex.x, vertex.y, this.settings.vertexRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw border
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw label
            if (this.settings.showLabels) {
                this.ctx.fillStyle = this.settings.shapeColor;
                this.ctx.font = 'bold 13px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'bottom';
                this.ctx.fillText(
                    String.fromCharCode(65 + index), // A, B, C, ...
                    vertex.x,
                    vertex.y - this.settings.vertexRadius - 8
                );
            }
        });
    }

    /**
     * Render complete scene
     */
    render() {
        this.clear();
        this.drawGuideLines();
        this.drawShape();
        this.drawVertices();
    }

    /**
     * Scale to fit canvas
     */
    scaleToFit(padding = 50) {
        if (this.vertices.length === 0) return;

        // Find bounding box
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        this.vertices.forEach(v => {
            minX = Math.min(minX, v.x);
            minY = Math.min(minY, v.y);
            maxX = Math.max(maxX, v.x);
            maxY = Math.max(maxY, v.y);
        });

        const width = maxX - minX;
        const height = maxY - minY;

        if (width === 0 || height === 0) return;

        // Calculate scale
        const scaleX = (this.canvas.width - padding * 2) / width;
        const scaleY = (this.canvas.height - padding * 2) / height;
        const scale = Math.min(scaleX, scaleY);

        // Calculate center offset
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const shapeCenterX = (minX + maxX) / 2;
        const shapeCenterY = (minY + maxY) / 2;

        // Transform vertices
        this.vertices = this.vertices.map(v => ({
            x: (v.x - shapeCenterX) * scale + centerX,
            y: (v.y - shapeCenterY) * scale + centerY
        }));

        this.regenerateGuideLines();
    }

    /**
     * Export shape data
     */
    exportData() {
        return {
            vertices: this.vertices,
            guideLines: this.guideLines,
            settings: this.settings
        };
    }

    /**
     * Import shape data
     */
    importData(data) {
        if (data.vertices) {
            this.setVertices(data.vertices);
        }
        if (data.settings) {
            this.updateSettings(data.settings);
        }
        this.render();
    }

    /**
     * Get canvas as image
     */
    toDataURL(type = 'image/png') {
        return this.canvas.toDataURL(type);
    }

    /**
     * Download canvas as image
     */
    downloadImage(filename = 'shape.png') {
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.toDataURL();
        link.click();
    }
}

// Geometry Utility Functions
const GeometryUtils = {
    /**
     * Calculate distance between two points
     */
    distance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Calculate angle between three points (in degrees)
     */
    angle(p1, vertex, p2) {
        const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
        const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
        let angle = Math.abs(angle2 - angle1) * 180 / Math.PI;

        if (angle > 180) angle = 360 - angle;

        return angle;
    },

    /**
     * Check if two lines are parallel
     */
    areParallel(line1, line2, tolerance = 0.01) {
        const slope1 = (line1.end.y - line1.start.y) / (line1.end.x - line1.start.x);
        const slope2 = (line2.end.y - line2.start.y) / (line2.end.x - line2.start.x);
        return Math.abs(slope1 - slope2) < tolerance;
    },

    /**
     * Check if two lines are perpendicular
     */
    arePerpendicular(line1, line2, tolerance = 0.01) {
        const slope1 = (line1.end.y - line1.start.y) / (line1.end.x - line1.start.x);
        const slope2 = (line2.end.y - line2.start.y) / (line2.end.x - line2.start.x);
        return Math.abs(slope1 * slope2 + 1) < tolerance;
    },

    /**
     * Calculate perimeter of polygon
     */
    perimeter(vertices) {
        let total = 0;
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % vertices.length];
            total += this.distance(p1, p2);
        }
        return total;
    },

    /**
     * Calculate area of polygon using shoelace formula
     */
    area(vertices) {
        let total = 0;
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % vertices.length];
            total += p1.x * p2.y - p2.x * p1.y;
        }
        return Math.abs(total / 2);
    },

    /**
     * Get center point of polygon
     */
    center(vertices) {
        const sum = vertices.reduce((acc, v) => ({
            x: acc.x + v.x,
            y: acc.y + v.y
        }), { x: 0, y: 0 });

        return {
            x: sum.x / vertices.length,
            y: sum.y / vertices.length
        };
    }
};

console.log('✅ Shape Engine loaded');
