/**
 * Reflection Pair Visualizer
 * Displays exponential and logarithmic functions as mirror reflections
 * Compatible with modern browsers and ES5+
 */

class ReflectionPairVisualizer {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas element not found:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.options = Object.assign({
            baseNumber: Math.E,  // e by default
            xMin: -3,
            xMax: 3,
            showReflectionLine: true,
            showGrid: true,
            showAxes: true,
            colors: {
                exponential: '#ff6b6b',
                logarithmic: '#4ecdc4',
                reflectionLine: '#ffd93d',
                axes: '#666',
                grid: '#e0e0e0',
                background: '#ffffff'
            },
            lineWidth: 2.5,
            gridLineWidth: 0.5,
            axesLineWidth: 1.5
        }, options);

        this.scale = 50;  // pixels per unit
        this.centerX = 0;
        this.centerY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.draw();
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        this.width = rect.width;
        this.height = rect.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    setupEventListeners() {
        // Mouse events for pan
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

        // Wheel for zoom
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));

        // Resize handler
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.draw();
        });
    }

    // Mouse event handlers
    onMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.offsetX;
        this.lastMouseY = e.offsetY;
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const dx = e.offsetX - this.lastMouseX;
        const dy = e.offsetY - this.lastMouseY;

        this.centerX += dx;
        this.centerY += dy;

        this.lastMouseX = e.offsetX;
        this.lastMouseY = e.offsetY;

        this.draw();
    }

    onMouseUp() {
        this.isDragging = false;
    }

    // Touch event handlers
    onTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.isDragging = true;
        this.lastMouseX = touch.clientX - rect.left;
        this.lastMouseY = touch.clientY - rect.top;
    }

    onTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging) return;

        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const dx = x - this.lastMouseX;
        const dy = y - this.lastMouseY;

        this.centerX += dx;
        this.centerY += dy;

        this.lastMouseX = x;
        this.lastMouseY = y;

        this.draw();
    }

    onTouchEnd() {
        this.isDragging = false;
    }

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.scale *= delta;
        this.scale = Math.max(10, Math.min(200, this.scale));
        this.draw();
    }

    // Drawing methods
    draw() {
        this.clear();
        if (this.options.showGrid) this.drawGrid();
        if (this.options.showAxes) this.drawAxes();
        if (this.options.showReflectionLine) this.drawReflectionLine();
        this.drawExponential();
        this.drawLogarithmic();
    }

    clear() {
        this.ctx.fillStyle = this.options.colors.background;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = this.options.colors.grid;
        this.ctx.lineWidth = this.options.gridLineWidth;
        this.ctx.beginPath();

        // Vertical lines
        const startX = Math.floor((-this.centerX) / this.scale);
        const endX = Math.ceil((this.width - this.centerX) / this.scale);
        for (let x = startX; x <= endX; x++) {
            const screenX = this.toScreenX(x);
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.height);
        }

        // Horizontal lines
        const startY = Math.floor((-this.centerY) / this.scale);
        const endY = Math.ceil((this.height - this.centerY) / this.scale);
        for (let y = startY; y <= endY; y++) {
            const screenY = this.toScreenY(y);
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.width, screenY);
        }

        this.ctx.stroke();
    }

    drawAxes() {
        this.ctx.strokeStyle = this.options.colors.axes;
        this.ctx.lineWidth = this.options.axesLineWidth;

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

        // Labels
        this.ctx.fillStyle = this.options.colors.axes;
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('x', this.width - 15, this.centerY - 10);
        this.ctx.fillText('y', this.centerX + 15, 15);
    }

    drawReflectionLine() {
        // Draw y = x line (the reflection line)
        this.ctx.strokeStyle = this.options.colors.reflectionLine;
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();

        const xMin = (-this.centerX) / this.scale;
        const xMax = (this.width - this.centerX) / this.scale;

        this.ctx.moveTo(this.toScreenX(xMin), this.toScreenY(xMin));
        this.ctx.lineTo(this.toScreenX(xMax), this.toScreenY(xMax));
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawExponential() {
        // Draw y = base^x
        this.ctx.strokeStyle = this.options.colors.exponential;
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.beginPath();

        let started = false;
        const step = 0.05;

        for (let x = this.options.xMin; x <= this.options.xMax; x += step) {
            const y = Math.pow(this.options.baseNumber, x);

            // Only draw if y is in reasonable range
            if (y > -1000 && y < 1000) {
                const screenX = this.toScreenX(x);
                const screenY = this.toScreenY(y);

                if (screenX >= 0 && screenX <= this.width && screenY >= 0 && screenY <= this.height) {
                    if (!started) {
                        this.ctx.moveTo(screenX, screenY);
                        started = true;
                    } else {
                        this.ctx.lineTo(screenX, screenY);
                    }
                }
            }
        }

        this.ctx.stroke();
    }

    drawLogarithmic() {
        // Draw y = log_base(x)
        this.ctx.strokeStyle = this.options.colors.logarithmic;
        this.ctx.lineWidth = this.options.lineWidth;
        this.ctx.beginPath();

        let started = false;
        const step = 0.05;

        // Logarithm only defined for x > 0
        for (let x = 0.01; x <= Math.exp(this.options.xMax); x += step) {
            const y = Math.log(x) / Math.log(this.options.baseNumber);

            const screenX = this.toScreenX(x);
            const screenY = this.toScreenY(y);

            if (screenX >= 0 && screenX <= this.width && screenY >= 0 && screenY <= this.height) {
                if (!started) {
                    this.ctx.moveTo(screenX, screenY);
                    started = true;
                } else {
                    this.ctx.lineTo(screenX, screenY);
                }
            }
        }

        this.ctx.stroke();
    }

    // Coordinate transformation helpers
    toScreenX(x) {
        return this.centerX + x * this.scale;
    }

    toScreenY(y) {
        return this.centerY - y * this.scale;  // Flip Y axis
    }

    toMathX(screenX) {
        return (screenX - this.centerX) / this.scale;
    }

    toMathY(screenY) {
        return -(screenY - this.centerY) / this.scale;
    }

    // Public methods to update visualization
    setBaseNumber(base) {
        this.options.baseNumber = base;
        this.draw();
    }

    toggleReflectionLine() {
        this.options.showReflectionLine = !this.options.showReflectionLine;
        this.draw();
    }

    resetView() {
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.scale = 50;
        this.draw();
    }

    zoomIn() {
        this.scale *= 1.2;
        this.draw();
    }

    zoomOut() {
        this.scale *= 0.8;
        this.draw();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReflectionPairVisualizer;
}
