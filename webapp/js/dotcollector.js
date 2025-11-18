// Dot Collector Logic - Area Accumulation with Dots

class DotCollector {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.dots = [];
        this.dotValue = 1.0; // Default dot value in cm²
        this.accumulatedArea = 0.0;
        this.gridSize = 20; // Grid spacing
        this.dotRadius = 8;
        this.maxDots = 100;

        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        // Draw grid
        this.drawGrid();
    }

    setupEventListeners() {
        // Click to add dot
        this.canvas.addEventListener('click', (e) => {
            this.addDotAtPosition(e);
        });

        // Touch support for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('click', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        }, { passive: false });
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid lines
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    addDotAtPosition(event) {
        if (this.dots.length >= this.maxDots) {
            alert('최대 도트 개수에 도달했습니다!');
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Snap to grid
        const snappedX = Math.round(x / this.gridSize) * this.gridSize;
        const snappedY = Math.round(y / this.gridSize) * this.gridSize;

        // Check if dot already exists at this position
        const existingDot = this.dots.find(dot =>
            Math.abs(dot.x - snappedX) < 5 && Math.abs(dot.y - snappedY) < 5
        );

        if (existingDot) {
            // Remove existing dot
            this.removeDot(existingDot);
        } else {
            // Add new dot
            this.addDot(snappedX, snappedY, this.dotValue);
        }
    }

    addDot(x, y, value) {
        const dot = {
            x: x,
            y: y,
            value: value,
            color: this.getColorForValue(value)
        };

        this.dots.push(dot);
        this.accumulatedArea += value;
        this.render();
        this.updateDisplay();
    }

    removeDot(dot) {
        const index = this.dots.indexOf(dot);
        if (index > -1) {
            this.accumulatedArea -= dot.value;
            this.dots.splice(index, 1);
            this.render();
            this.updateDisplay();
        }
    }

    removeLastDot() {
        if (this.dots.length > 0) {
            const lastDot = this.dots.pop();
            this.accumulatedArea -= lastDot.value;
            this.render();
            this.updateDisplay();
        }
    }

    clearAllDots() {
        this.dots = [];
        this.accumulatedArea = 0;
        this.render();
        this.updateDisplay();
    }

    setDotValue(value) {
        this.dotValue = parseFloat(value) || 1.0;
    }

    getColorForValue(value) {
        // Color gradient based on value
        if (value <= 0.5) return '#3498db'; // Blue for small values
        if (value <= 1.0) return '#2ecc71'; // Green for medium values
        if (value <= 2.0) return '#f39c12'; // Orange for large values
        return '#e74c3c'; // Red for very large values
    }

    render() {
        // Clear and redraw grid
        this.drawGrid();

        // Draw all dots
        this.dots.forEach(dot => {
            this.drawDot(dot);
        });
    }

    drawDot(dot) {
        // Draw dot shadow
        this.ctx.beginPath();
        this.ctx.arc(dot.x + 2, dot.y + 2, this.dotRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fill();

        // Draw dot
        this.ctx.beginPath();
        this.ctx.arc(dot.x, dot.y, this.dotRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = dot.color;
        this.ctx.fill();

        // Draw dot border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw value text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(dot.value.toFixed(1), dot.x, dot.y);
    }

    updateDisplay() {
        const accumulatedAreaElement = document.getElementById('accumulated-area');
        if (accumulatedAreaElement) {
            accumulatedAreaElement.textContent = this.accumulatedArea.toFixed(2);
        }

        // Auto-fill answer input
        const finalAnswerInput = document.getElementById('final-answer');
        if (finalAnswerInput) {
            finalAnswerInput.value = this.accumulatedArea.toFixed(2);
        }
    }

    getAccumulatedArea() {
        return parseFloat(this.accumulatedArea.toFixed(2));
    }

    getDots() {
        return this.dots.map(dot => ({
            x: dot.x,
            y: dot.y,
            value: dot.value
        }));
    }

    getState() {
        return {
            dots: this.getDots(),
            accumulatedArea: this.getAccumulatedArea(),
            dotCount: this.dots.length
        };
    }

    loadState(state) {
        this.clearAllDots();
        if (state && state.dots) {
            state.dots.forEach(dot => {
                this.addDot(dot.x, dot.y, dot.value);
            });
        }
    }

    // Visualization helper: show target area
    showTargetArea(targetArea) {
        const targetElement = document.getElementById('accumulated-area');
        if (targetElement && targetElement.parentElement) {
            const hint = document.createElement('span');
            hint.style.fontSize = '12px';
            hint.style.color = '#95a5a6';
            hint.style.marginLeft = '10px';
            hint.textContent = `(목표: ${targetArea} cm²)`;
            hint.id = 'target-hint';

            const existingHint = document.getElementById('target-hint');
            if (existingHint) {
                existingHint.remove();
            }

            targetElement.parentElement.appendChild(hint);
        }
    }
}
