/**
 * Shape Drawing Engine with Auto Guide Lines Generator
 * Supports parallel and perpendicular line generation
 */

class ShapeEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.vertices = [];
        this.guideLines = [];
        this.isDragging = false;
        this.selectedVertex = null;

        // Settings
        this.settings = {
            showParallel: true,
            showPerpendicular: true,
            showLabels: true,
            parallelColor: '#4ECDC4',
            perpendicularColor: '#FF6B6B',
            shapeColor: '#2c3e50',
            vertexColor: '#667eea',
            lineThickness: 2
        };
    }

    /**
     * Set rendering settings
     */
    setSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Add vertex to shape
     */
    addVertex(x, y) {
        this.vertices.push({ x, y });
    }

    /**
     * Set vertices directly
     */
    setVertices(vertices) {
        this.vertices = vertices.map(v => ({ x: v.x, y: v.y }));
        this.generateGuideLines();
    }

    /**
     * Get vertices
     */
    getVertices() {
        return this.vertices;
    }

    /**
     * Clear all vertices and guide lines
     */
    reset() {
        this.vertices = [];
        this.guideLines = [];
        this.clear();
    }

    /**
     * Generate parallel and perpendicular guide lines
     */
    generateGuideLines() {
        this.guideLines = [];

        if (this.vertices.length < 2) {
            return;
        }

        const count = this.vertices.length;

        // Generate guide lines for each edge
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

            // Perpendicular unit vector (90-degree rotation)
            const perpX = -uy;
            const perpY = ux;

            // Generate parallel line (offset from the edge)
            if (this.settings.showParallel) {
                const offset = 40; // pixels
                const parallelStart = {
                    x: p1.x + perpX * offset,
                    y: p1.y + perpY * offset
                };
                const parallelEnd = {
                    x: p2.x + perpX * offset,
                    y: p2.y + perpY * offset
                };

                this.guideLines.push({
                    type: 'parallel',
                    referenceEdge: i,
                    start: parallelStart,
                    end: parallelEnd,
                    color: this.settings.parallelColor
                });
            }

            // Generate perpendicular lines at each vertex
            if (this.settings.showPerpendicular) {
                const perpLength = 60; // pixels
                const perpStart = {
                    x: p1.x - perpX * perpLength / 2,
                    y: p1.y - perpY * perpLength / 2
                };
                const perpEnd = {
                    x: p1.x + perpX * perpLength / 2,
                    y: p1.y + perpY * perpLength / 2
                };

                this.guideLines.push({
                    type: 'perpendicular',
                    referenceEdge: i,
                    referenceVertex: i,
                    start: perpStart,
                    end: perpEnd,
                    color: this.settings.perpendicularColor
                });
            }
        }
    }

    /**
     * Draw the shape
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

        // Close the shape if we have at least 3 vertices
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
        this.ctx.setLineDash([5, 5]); // Dashed line

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
                this.ctx.fillStyle = line.color;
                this.ctx.font = 'bold 11px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                const label = line.type === 'parallel' ? '∥' : '⊥';

                // Draw background for label
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(midX - 10, midY - 10, 20, 20);

                this.ctx.fillStyle = line.color;
                this.ctx.fillText(label, midX, midY);
            }
        });

        this.ctx.setLineDash([]); // Reset line dash
        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw vertices
     */
    drawVertices() {
        this.vertices.forEach((vertex, index) => {
            this.ctx.fillStyle = this.settings.vertexColor;
            this.ctx.beginPath();
            this.ctx.arc(vertex.x, vertex.y, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw vertex label
            if (this.settings.showLabels) {
                this.ctx.fillStyle = '#2c3e50';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'bottom';
                this.ctx.fillText(String.fromCharCode(65 + index), vertex.x, vertex.y - 10);
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
     * Create a predefined shape
     */
    createPredefinedShape(type, centerX, centerY, size) {
        this.vertices = [];

        switch (type) {
            case 'triangle':
                this.vertices = [
                    { x: centerX, y: centerY - size },
                    { x: centerX - size * Math.cos(Math.PI / 6), y: centerY + size * Math.sin(Math.PI / 6) },
                    { x: centerX + size * Math.cos(Math.PI / 6), y: centerY + size * Math.sin(Math.PI / 6) }
                ];
                break;

            case 'quadrilateral':
                this.vertices = [
                    { x: centerX - size, y: centerY - size },
                    { x: centerX + size, y: centerY - size },
                    { x: centerX + size, y: centerY + size },
                    { x: centerX - size, y: centerY + size }
                ];
                break;

            case 'polygon':
                const sides = 6;
                for (let i = 0; i < sides; i++) {
                    const angle = (Math.PI * 2 * i) / sides - Math.PI / 2;
                    this.vertices.push({
                        x: centerX + size * Math.cos(angle),
                        y: centerY + size * Math.sin(angle)
                    });
                }
                break;
        }

        this.generateGuideLines();
    }

    /**
     * Scale vertices to fit canvas
     */
    scaleToFit(targetWidth, targetHeight, padding = 40) {
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

        // Calculate scale factor
        const scaleX = (targetWidth - padding * 2) / width;
        const scaleY = (targetHeight - padding * 2) / height;
        const scale = Math.min(scaleX, scaleY);

        // Calculate center offset
        const centerX = targetWidth / 2;
        const centerY = targetHeight / 2;
        const shapeWidth = width * scale;
        const shapeHeight = height * scale;

        // Transform vertices
        this.vertices = this.vertices.map(v => ({
            x: (v.x - minX) * scale - shapeWidth / 2 + centerX,
            y: (v.y - minY) * scale - shapeHeight / 2 + centerY
        }));

        this.generateGuideLines();
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
            this.vertices = data.vertices;
        }
        if (data.settings) {
            this.settings = { ...this.settings, ...data.settings };
        }
        this.generateGuideLines();
        this.render();
    }
}

// Geometry utility functions
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
     * Calculate angle between three points
     */
    angle(p1, vertex, p2) {
        const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
        const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
        let angle = angle2 - angle1;

        if (angle < 0) angle += Math.PI * 2;
        if (angle > Math.PI) angle = Math.PI * 2 - angle;

        return angle * 180 / Math.PI;
    }
};
