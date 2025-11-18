/**
 * Slope Sense Animation Engine
 * Visualizes slope/gradient with interactive animations
 */

class SlopeAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this.isPlaying = false;
        this.speed = 1.0;
        this.animationType = 'ball_roll';

        // Problem data
        this.point1 = { x: 0, y: 0 };
        this.point2 = { x: 4, y: 2 };
        this.slope = 0;

        // Animation state
        this.animationProgress = 0;
        this.objectPosition = { x: 0, y: 0 };

        // Canvas setup
        this.setupCanvas();
        this.setupGrid();
    }

    setupCanvas() {
        // Set canvas size to match container
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;

        // Calculate grid parameters
        this.gridSize = 20;
        this.originX = this.canvas.width / 2;
        this.originY = this.canvas.height / 2;
        this.scale = Math.min(this.canvas.width, this.canvas.height) / 12;
    }

    setupGrid() {
        this.drawGrid();
        this.drawAxes();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;

        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.originY);
        this.ctx.lineTo(this.canvas.width, this.originY);
        this.ctx.stroke();

        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.originX, 0);
        this.ctx.lineTo(this.originX, this.canvas.height);
        this.ctx.stroke();

        // Draw tick marks and labels
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'center';

        // X-axis ticks
        for (let i = -6; i <= 6; i++) {
            if (i === 0) continue;
            const x = this.originX + i * this.scale;
            this.ctx.fillText(i.toString(), x, this.originY + 15);
        }

        // Y-axis ticks
        this.ctx.textAlign = 'right';
        for (let i = -6; i <= 6; i++) {
            if (i === 0) continue;
            const y = this.originY - i * this.scale;
            this.ctx.fillText(i.toString(), this.originX - 10, y + 5);
        }

        // Origin label
        this.ctx.fillText('0', this.originX - 10, this.originY + 15);
    }

    toCanvasX(x) {
        return this.originX + x * this.scale;
    }

    toCanvasY(y) {
        return this.originY - y * this.scale;
    }

    setProblem(point1, point2) {
        this.point1 = point1;
        this.point2 = point2;
        this.slope = (point2.y - point1.y) / (point2.x - point1.x);
        this.animationProgress = 0;
        this.reset();
    }

    drawLine() {
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([]);

        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(this.point1.x), this.toCanvasY(this.point1.y));
        this.ctx.lineTo(this.toCanvasX(this.point2.x), this.toCanvasY(this.point2.y));
        this.ctx.stroke();
    }

    drawPoints() {
        // Point 1
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.beginPath();
        this.ctx.arc(
            this.toCanvasX(this.point1.x),
            this.toCanvasY(this.point1.y),
            6,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Point 2
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.beginPath();
        this.ctx.arc(
            this.toCanvasX(this.point2.x),
            this.toCanvasY(this.point2.y),
            6,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Labels
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.fillText(
            `P1(${this.point1.x}, ${this.point1.y})`,
            this.toCanvasX(this.point1.x) + 15,
            this.toCanvasY(this.point1.y) - 10
        );
        this.ctx.fillText(
            `P2(${this.point2.x}, ${this.point2.y})`,
            this.toCanvasX(this.point2.x) + 15,
            this.toCanvasY(this.point2.y) - 10
        );
    }

    drawRiseRun() {
        const rise = this.point2.y - this.point1.y;
        const run = this.point2.x - this.point1.x;

        // Rise line (vertical)
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(this.point2.x), this.toCanvasY(this.point1.y));
        this.ctx.lineTo(this.toCanvasX(this.point2.x), this.toCanvasY(this.point2.y));
        this.ctx.stroke();

        // Run line (horizontal)
        this.ctx.strokeStyle = '#4ecdc4';
        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(this.point1.x), this.toCanvasY(this.point1.y));
        this.ctx.lineTo(this.toCanvasX(this.point2.x), this.toCanvasY(this.point1.y));
        this.ctx.stroke();

        // Labels
        this.ctx.setLineDash([]);
        this.ctx.font = 'bold 14px Arial';

        // Rise label
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillText(
            `rise = ${rise}`,
            this.toCanvasX(this.point2.x) + 15,
            this.toCanvasY((this.point1.y + this.point2.y) / 2)
        );

        // Run label
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.fillText(
            `run = ${run}`,
            this.toCanvasX((this.point1.x + this.point2.x) / 2),
            this.toCanvasY(this.point1.y) + 20
        );
    }

    drawAnimatedObject() {
        const t = this.animationProgress;
        const x = this.point1.x + (this.point2.x - this.point1.x) * t;
        const y = this.point1.y + (this.point2.y - this.point1.y) * t;

        const canvasX = this.toCanvasX(x);
        const canvasY = this.toCanvasY(y);

        switch (this.animationType) {
            case 'ball_roll':
                this.drawBall(canvasX, canvasY, t);
                break;
            case 'skier':
                this.drawSkier(canvasX, canvasY, t);
                break;
            case 'car_drive':
                this.drawCar(canvasX, canvasY, t);
                break;
            case 'water_flow':
                this.drawWater(canvasX, canvasY, t);
                break;
        }
    }

    drawBall(x, y, t) {
        const radius = 12;
        const rotation = t * Math.PI * 4;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);

        // Ball
        const gradient = this.ctx.createRadialGradient(-5, -5, 0, 0, 0, radius);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.5, '#667eea');
        gradient.addColorStop(1, '#764ba2');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Pattern
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawSkier(x, y, t) {
        this.ctx.save();
        this.ctx.translate(x, y);

        // Skier body (simple stick figure)
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';

        // Head
        this.ctx.beginPath();
        this.ctx.arc(0, -15, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fill();

        // Body
        this.ctx.beginPath();
        this.ctx.moveTo(0, -10);
        this.ctx.lineTo(0, 5);
        this.ctx.stroke();

        // Skis
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-8, 5);
        this.ctx.lineTo(-3, 15);
        this.ctx.moveTo(8, 5);
        this.ctx.lineTo(3, 15);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawCar(x, y, t) {
        this.ctx.save();
        this.ctx.translate(x, y);

        // Car body
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(-15, -8, 30, 12);

        // Windows
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.fillRect(-10, -6, 8, 8);
        this.ctx.fillRect(2, -6, 8, 8);

        // Wheels
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(-8, 4, 4, 0, Math.PI * 2);
        this.ctx.arc(8, 4, 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawWater(x, y, t) {
        // Water droplets
        for (let i = 0; i < 3; i++) {
            const offset = (t * 10 + i) % 1;
            const dropX = x - 10 + i * 10;
            const dropY = y - offset * 20;

            this.ctx.fillStyle = `rgba(78, 205, 196, ${1 - offset})`;
            this.ctx.beginPath();
            this.ctx.arc(dropX, dropY, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawSlopeInfo() {
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'left';

        const infoText = [
            `기울기 = rise / run`,
            `기울기 = ${(this.point2.y - this.point1.y)} / ${(this.point2.x - this.point1.x)}`,
            `기울기 = ${this.slope.toFixed(2)}`
        ];

        infoText.forEach((text, i) => {
            this.ctx.fillText(text, 10, 25 + i * 20);
        });
    }

    animate() {
        if (!this.isPlaying) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Redraw everything
        this.drawGrid();
        this.drawAxes();
        this.drawLine();
        this.drawRiseRun();
        this.drawPoints();
        this.drawAnimatedObject();
        this.drawSlopeInfo();

        // Update progress
        this.animationProgress += 0.01 * this.speed;
        if (this.animationProgress >= 1) {
            this.animationProgress = 0;
        }

        // Continue animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.animate();
        }
    }

    pause() {
        this.isPlaying = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    reset() {
        this.pause();
        this.animationProgress = 0;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawAxes();
        this.drawLine();
        this.drawRiseRun();
        this.drawPoints();
        this.drawSlopeInfo();
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    setAnimationType(type) {
        this.animationType = type;
    }
}
