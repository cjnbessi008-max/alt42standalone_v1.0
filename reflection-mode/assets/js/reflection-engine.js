/**
 * Reflection Engine
 * Handles y=x reflection calculations and visualization
 * Shows overlapping areas when shapes are reflected across y=x line
 */

class ReflectionEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id "${canvasId}" not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.reflectedPoints = [];
        this.isDrawing = false;
        this.selectedPoint = null;

        // Settings
        this.settings = {
            showOriginal: true,
            showReflected: true,
            showOverlap: true,
            showAxis: true,
            showGrid: false,
            overlapOpacity: 0.7,
            shapeType: 'polygon'
        };

        // Colors
        this.colors = {
            original: 'rgba(102, 126, 234, 0.6)',
            originalStroke: '#667eea',
            reflected: 'rgba(118, 75, 162, 0.6)',
            reflectedStroke: '#764ba2',
            overlap: 'rgba(255, 99, 71, 0.8)',
            overlapStroke: '#ff6347',
            axis: '#667eea',
            grid: '#e0e0e0'
        };

        // Canvas dimensions
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;

        // Scale factor (pixels per unit)
        this.scale = 30;

        // Animation
        this.animationFrame = null;
        this.isAnimating = false;
        this.animationProgress = 0;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Prevent default touch behavior
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    }

    // Coordinate transformation: Canvas to Mathematical
    canvasToMath(canvasX, canvasY) {
        const mathX = (canvasX - this.centerX) / this.scale;
        const mathY = (this.centerY - canvasY) / this.scale;
        return { x: mathX, y: mathY };
    }

    // Coordinate transformation: Mathematical to Canvas
    mathToCanvas(mathX, mathY) {
        const canvasX = this.centerX + mathX * this.scale;
        const canvasY = this.centerY - mathY * this.scale;
        return { x: canvasX, y: canvasY };
    }

    // Reflect a point across y=x line
    reflectPoint(point) {
        // Reflection across y=x: swap x and y coordinates
        return { x: point.y, y: point.x };
    }

    // Calculate reflected points
    calculateReflectedPoints() {
        this.reflectedPoints = this.points.map(p => this.reflectPoint(p));
    }

    // Add a point
    addPoint(mathX, mathY) {
        this.points.push({ x: mathX, y: mathY });
        this.calculateReflectedPoints();
        this.updateStatistics();
        this.render();
    }

    // Clear all points
    clear() {
        this.points = [];
        this.reflectedPoints = [];
        this.updateStatistics();
        this.render();
    }

    // Reset to default state
    reset() {
        this.clear();
        this.settings.showOriginal = true;
        this.settings.showReflected = true;
        this.settings.showOverlap = true;
        this.settings.showAxis = true;
        this.settings.showGrid = false;
        this.settings.overlapOpacity = 0.7;
    }

    // Draw grid
    drawGrid() {
        if (!this.settings.showGrid) return;

        this.ctx.strokeStyle = this.colors.grid;
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = -this.centerX; x <= this.centerX; x += this.scale) {
            const canvasX = this.centerX + x;
            this.ctx.beginPath();
            this.ctx.moveTo(canvasX, 0);
            this.ctx.lineTo(canvasX, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = -this.centerY; y <= this.centerY; y += this.scale) {
            const canvasY = this.centerY + y;
            this.ctx.beginPath();
            this.ctx.moveTo(0, canvasY);
            this.ctx.lineTo(this.width, canvasY);
            this.ctx.stroke();
        }

        // Draw axes (thicker)
        this.ctx.strokeStyle = '#999';
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
    }

    // Draw y=x axis line
    drawAxisLine() {
        if (!this.settings.showAxis) return;

        this.ctx.strokeStyle = this.colors.axis;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);

        // Draw diagonal line y=x
        // In canvas coordinates, this goes from top-left to bottom-right
        const startMath = this.canvasToMath(0, this.height);
        const endMath = this.canvasToMath(this.width, 0);

        const startCanvas = this.mathToCanvas(startMath.y, startMath.y);
        const endCanvas = this.mathToCanvas(endMath.y, endMath.y);

        this.ctx.beginPath();
        this.ctx.moveTo(startCanvas.x, startCanvas.y);
        this.ctx.lineTo(endCanvas.x, endCanvas.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Draw label
        this.ctx.fillStyle = this.colors.axis;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('y = x', this.centerX + 10, this.centerY - 10);
    }

    // Draw a shape (polygon, circle, etc.)
    drawShape(points, color, strokeColor) {
        if (points.length === 0) return;

        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.lineWidth = 2;

        if (this.settings.shapeType === 'circle' && points.length >= 2) {
            // Draw circle
            const center = points[0];
            const edge = points[1];
            const centerCanvas = this.mathToCanvas(center.x, center.y);
            const edgeCanvas = this.mathToCanvas(edge.x, edge.y);
            const radius = Math.sqrt(
                Math.pow(centerCanvas.x - edgeCanvas.x, 2) +
                Math.pow(centerCanvas.y - edgeCanvas.y, 2)
            );

            this.ctx.beginPath();
            this.ctx.arc(centerCanvas.x, centerCanvas.y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();
        } else if (points.length >= 3) {
            // Draw polygon
            this.ctx.beginPath();
            const firstPoint = this.mathToCanvas(points[0].x, points[0].y);
            this.ctx.moveTo(firstPoint.x, firstPoint.y);

            for (let i = 1; i < points.length; i++) {
                const p = this.mathToCanvas(points[i].x, points[i].y);
                this.ctx.lineTo(p.x, p.y);
            }

            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();
        }
    }

    // Draw points
    drawPoints(points, color) {
        points.forEach((p, index) => {
            const canvasPoint = this.mathToCanvas(p.x, p.y);

            // Draw point
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;

            this.ctx.beginPath();
            this.ctx.arc(canvasPoint.x, canvasPoint.y, 6, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();

            // Draw coordinate label
            this.ctx.fillStyle = '#333';
            this.ctx.font = '10px monospace';
            const label = `(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`;
            this.ctx.fillText(label, canvasPoint.x + 10, canvasPoint.y - 10);
        });
    }

    // Calculate polygon area using Shoelace formula
    calculatePolygonArea(points) {
        if (points.length < 3) return 0;

        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            area += points[i].x * points[j].y;
            area -= points[j].x * points[i].y;
        }

        return Math.abs(area / 2);
    }

    // Calculate circle area
    calculateCircleArea(points) {
        if (points.length < 2) return 0;

        const center = points[0];
        const edge = points[1];
        const radius = Math.sqrt(
            Math.pow(edge.x - center.x, 2) +
            Math.pow(edge.y - center.y, 2)
        );

        return Math.PI * radius * radius;
    }

    // Calculate overlapping area
    calculateOverlapArea() {
        if (this.points.length < 3) return 0;

        // For simple case: calculate intersection of two polygons
        // This is a simplified implementation
        // In a production system, you'd use a library like Martinez polygon clipping

        // For demonstration, we'll use a sampling method
        return this.calculateOverlapBySampling();
    }

    // Calculate overlap using grid sampling method
    calculateOverlapBySampling() {
        if (this.points.length < 3) return 0;

        const sampleSize = 1000;
        let overlapCount = 0;

        // Get bounding box
        const minX = Math.min(...this.points.map(p => p.x), ...this.reflectedPoints.map(p => p.x));
        const maxX = Math.max(...this.points.map(p => p.x), ...this.reflectedPoints.map(p => p.x));
        const minY = Math.min(...this.points.map(p => p.y), ...this.reflectedPoints.map(p => p.y));
        const maxY = Math.max(...this.points.map(p => p.y), ...this.reflectedPoints.map(p => p.y));

        const totalArea = (maxX - minX) * (maxY - minY);

        for (let i = 0; i < sampleSize; i++) {
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);

            const inOriginal = this.pointInPolygon({ x, y }, this.points);
            const inReflected = this.pointInPolygon({ x, y }, this.reflectedPoints);

            if (inOriginal && inReflected) {
                overlapCount++;
            }
        }

        return (overlapCount / sampleSize) * totalArea;
    }

    // Point-in-polygon test using ray casting algorithm
    pointInPolygon(point, polygon) {
        if (polygon.length < 3) return false;

        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    // Draw overlap region
    drawOverlap() {
        if (!this.settings.showOverlap || this.points.length < 3) return;

        // For visualization, we'll highlight the overlapping region
        // using a pixel-by-pixel sampling approach on a temporary canvas

        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        for (let canvasX = 0; canvasX < this.width; canvasX++) {
            for (let canvasY = 0; canvasY < this.height; canvasY++) {
                const mathPoint = this.canvasToMath(canvasX, canvasY);

                const inOriginal = this.pointInPolygon(mathPoint, this.points);
                const inReflected = this.pointInPolygon(mathPoint, this.reflectedPoints);

                if (inOriginal && inReflected) {
                    const index = (canvasY * this.width + canvasX) * 4;
                    data[index] = 255;     // R
                    data[index + 1] = 99;  // G
                    data[index + 2] = 71;  // B
                    data[index + 3] = 255 * this.settings.overlapOpacity; // A
                }
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    // Update statistics display
    updateStatistics() {
        let originalArea = 0;
        let overlapArea = 0;

        if (this.settings.shapeType === 'circle' && this.points.length >= 2) {
            originalArea = this.calculateCircleArea(this.points);
        } else if (this.points.length >= 3) {
            originalArea = this.calculatePolygonArea(this.points);
        }

        if (this.points.length >= 3) {
            overlapArea = this.calculateOverlapArea();
        }

        const overlapRatio = originalArea > 0 ? (overlapArea / originalArea) * 100 : 0;

        // Update DOM elements
        const originalAreaElem = document.getElementById('originalArea');
        const overlapAreaElem = document.getElementById('overlapArea');
        const overlapRatioElem = document.getElementById('overlapRatio');

        if (originalAreaElem) originalAreaElem.textContent = originalArea.toFixed(2);
        if (overlapAreaElem) overlapAreaElem.textContent = overlapArea.toFixed(2);
        if (overlapRatioElem) overlapRatioElem.textContent = overlapRatio.toFixed(1) + '%';
    }

    // Main render function
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw grid
        this.drawGrid();

        // Draw y=x axis
        this.drawAxisLine();

        // Draw reflected shape
        if (this.settings.showReflected && this.reflectedPoints.length > 0) {
            this.drawShape(
                this.reflectedPoints,
                this.colors.reflected,
                this.colors.reflectedStroke
            );
            this.drawPoints(this.reflectedPoints, this.colors.reflectedStroke);
        }

        // Draw original shape
        if (this.settings.showOriginal && this.points.length > 0) {
            this.drawShape(
                this.points,
                this.colors.original,
                this.colors.originalStroke
            );
            this.drawPoints(this.points, this.colors.originalStroke);
        }

        // Draw overlap (must be last to show on top)
        if (this.settings.showOverlap && this.points.length >= 3) {
            this.drawOverlap();
        }
    }

    // Mouse/Touch event handlers
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const mathPoint = this.canvasToMath(canvasX, canvasY);

        // Check if clicking on existing point
        this.selectedPoint = this.findNearestPoint(mathPoint);

        if (!this.selectedPoint) {
            // Add new point
            this.addPoint(mathPoint.x, mathPoint.y);
        }

        this.isDrawing = true;
    }

    handleMouseMove(e) {
        if (!this.isDrawing || !this.selectedPoint) return;

        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        const mathPoint = this.canvasToMath(canvasX, canvasY);

        // Update selected point position
        this.selectedPoint.x = mathPoint.x;
        this.selectedPoint.y = mathPoint.y;

        this.calculateReflectedPoints();
        this.updateStatistics();
        this.render();
    }

    handleMouseUp(e) {
        this.isDrawing = false;
        this.selectedPoint = null;
    }

    handleTouchStart(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseDown(mouseEvent);
        }
    }

    handleTouchMove(e) {
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseMove(mouseEvent);
        }
    }

    handleTouchEnd(e) {
        this.handleMouseUp(e);
    }

    findNearestPoint(mathPoint) {
        const threshold = 0.5; // Math units

        for (let point of this.points) {
            const distance = Math.sqrt(
                Math.pow(point.x - mathPoint.x, 2) +
                Math.pow(point.y - mathPoint.y, 2)
            );

            if (distance < threshold) {
                return point;
            }
        }

        return null;
    }

    // Generate predefined shapes
    generateShape(shapeType) {
        this.clear();

        switch (shapeType) {
            case 'rectangle':
                this.points = [
                    { x: -3, y: -2 },
                    { x: 3, y: -2 },
                    { x: 3, y: 2 },
                    { x: -3, y: 2 }
                ];
                break;

            case 'triangle':
                this.points = [
                    { x: 0, y: 4 },
                    { x: -3, y: -2 },
                    { x: 3, y: -2 }
                ];
                break;

            case 'circle':
                this.settings.shapeType = 'circle';
                this.points = [
                    { x: 0, y: 0 },
                    { x: 3, y: 0 }
                ];
                break;

            default:
                // Default polygon
                this.points = [
                    { x: -2, y: -3 },
                    { x: 2, y: -2 },
                    { x: 3, y: 1 },
                    { x: 0, y: 3 },
                    { x: -3, y: 1 }
                ];
        }

        this.calculateReflectedPoints();
        this.updateStatistics();
        this.render();
    }

    // Animation
    startAnimation() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.animationProgress = 0;
        this.animate();
    }

    animate() {
        if (!this.isAnimating) return;

        this.animationProgress += 0.02;

        if (this.animationProgress >= 1) {
            this.animationProgress = 0;
        }

        // Animate fold effect
        const progress = Math.sin(this.animationProgress * Math.PI * 2);
        this.settings.overlapOpacity = 0.3 + (progress + 1) * 0.25;

        this.render();

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.settings.overlapOpacity = 0.7;
        this.render();
    }

    // Export canvas as image
    exportImage() {
        const link = document.createElement('a');
        link.download = 'reflection-mode.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    // Load problem data from LMS
    loadProblemData(data) {
        try {
            if (data.points && Array.isArray(data.points)) {
                this.points = data.points;
                this.calculateReflectedPoints();
                this.updateStatistics();
                this.render();
            }

            if (data.settings) {
                Object.assign(this.settings, data.settings);
            }
        } catch (error) {
            console.error('Error loading problem data:', error);
        }
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.ReflectionEngine = ReflectionEngine;
}
