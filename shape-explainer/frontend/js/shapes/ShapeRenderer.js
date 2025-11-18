/**
 * Shape Renderer
 * Handles rendering of geometric shapes on canvas
 */

class ShapeRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        this.scale = 1.0;
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw triangle
     */
    drawTriangle(x, y, size, options = {}) {
        const {
            color = CONFIG.CANVAS.DEFAULT_SHAPE_COLOR,
            strokeColor = '#000',
            strokeWidth = 2,
            fill = true
        } = options;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x - size * Math.sqrt(3) / 2, y + size / 2);
        this.ctx.lineTo(x + size * Math.sqrt(3) / 2, y + size / 2);
        this.ctx.closePath();

        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }

        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.stroke();

        return this.getTriangleVertices(x, y, size);
    }

    /**
     * Get triangle vertices
     */
    getTriangleVertices(x, y, size) {
        return [
            { x: x, y: y - size },
            { x: x - size * Math.sqrt(3) / 2, y: y + size / 2 },
            { x: x + size * Math.sqrt(3) / 2, y: y + size / 2 }
        ];
    }

    /**
     * Draw rectangle
     */
    drawRectangle(x, y, width, height, options = {}) {
        const {
            color = CONFIG.CANVAS.DEFAULT_SHAPE_COLOR,
            strokeColor = '#000',
            strokeWidth = 2,
            fill = true
        } = options;

        const startX = x - width / 2;
        const startY = y - height / 2;

        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(startX, startY, width, height);
        }

        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.strokeRect(startX, startY, width, height);

        return this.getRectangleVertices(startX, startY, width, height);
    }

    /**
     * Get rectangle vertices
     */
    getRectangleVertices(x, y, width, height) {
        return [
            { x: x, y: y },
            { x: x + width, y: y },
            { x: x + width, y: y + height },
            { x: x, y: y + height }
        ];
    }

    /**
     * Draw square
     */
    drawSquare(x, y, size, options = {}) {
        return this.drawRectangle(x, y, size, size, options);
    }

    /**
     * Draw circle
     */
    drawCircle(x, y, radius, options = {}) {
        const {
            color = CONFIG.CANVAS.DEFAULT_SHAPE_COLOR,
            strokeColor = '#000',
            strokeWidth = 2,
            fill = true
        } = options;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);

        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }

        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.stroke();
    }

    /**
     * Draw polygon
     */
    drawPolygon(x, y, sides, radius, options = {}) {
        const {
            color = CONFIG.CANVAS.DEFAULT_SHAPE_COLOR,
            strokeColor = '#000',
            strokeWidth = 2,
            fill = true
        } = options;

        const vertices = this.getPolygonVertices(x, y, sides, radius);

        this.ctx.beginPath();
        this.ctx.moveTo(vertices[0].x, vertices[0].y);

        for (let i = 1; i < vertices.length; i++) {
            this.ctx.lineTo(vertices[i].x, vertices[i].y);
        }

        this.ctx.closePath();

        if (fill) {
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }

        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = strokeWidth;
        this.ctx.stroke();

        return vertices;
    }

    /**
     * Get polygon vertices
     */
    getPolygonVertices(x, y, sides, radius) {
        const vertices = [];
        const angleStep = (Math.PI * 2) / sides;
        const startAngle = -Math.PI / 2;

        for (let i = 0; i < sides; i++) {
            const angle = startAngle + angleStep * i;
            vertices.push({
                x: x + radius * Math.cos(angle),
                y: y + radius * Math.sin(angle)
            });
        }

        return vertices;
    }

    /**
     * Highlight vertex
     */
    highlightVertex(x, y, radius = 5) {
        this.ctx.fillStyle = CONFIG.CANVAS.HIGHLIGHT_COLOR;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Add label
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.fillText('●', x - 3, y + 4);
    }

    /**
     * Highlight edge
     */
    highlightEdge(x1, y1, x2, y2) {
        this.ctx.strokeStyle = CONFIG.CANVAS.EDGE_COLOR;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    /**
     * Draw text
     */
    drawText(text, x, y, options = {}) {
        const {
            color = '#000',
            fontSize = 14,
            fontFamily = 'sans-serif',
            align = 'center',
            baseline = 'middle'
        } = options;

        this.ctx.fillStyle = color;
        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        this.ctx.fillText(text, x, y);
    }

    /**
     * Draw shape by name
     */
    drawShapeByName(shapeName, x, y, size) {
        const shapeMap = {
            '삼각형': () => this.drawTriangle(x, y, size),
            'triangle': () => this.drawTriangle(x, y, size),
            '사각형': () => this.drawRectangle(x, y, size, size * 0.7),
            'rectangle': () => this.drawRectangle(x, y, size, size * 0.7),
            '정사각형': () => this.drawSquare(x, y, size),
            'square': () => this.drawSquare(x, y, size),
            '원': () => this.drawCircle(x, y, size),
            'circle': () => this.drawCircle(x, y, size),
            '오각형': () => this.drawPolygon(x, y, 5, size),
            'pentagon': () => this.drawPolygon(x, y, 5, size),
            '육각형': () => this.drawPolygon(x, y, 6, size),
            'hexagon': () => this.drawPolygon(x, y, 6, size)
        };

        const drawFunction = shapeMap[shapeName.toLowerCase()];

        if (drawFunction) {
            return drawFunction();
        } else {
            console.error('Unknown shape:', shapeName);
            return null;
        }
    }
}
