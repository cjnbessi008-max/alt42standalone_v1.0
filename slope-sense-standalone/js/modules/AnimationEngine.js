/**
 * AnimationEngine - Canvas-based slope visualization with animations
 */

export class AnimationEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Animation state
        this.isPlaying = false;
        this.animationId = null;
        this.speed = 1.0;
        this.progress = 0;

        // Problem data
        this.point1 = { x: 0, y: 0 };
        this.point2 = { x: 4, y: 2 };
        this.slope = 0.5;

        // Animation type
        this.animationType = 'ball_roll';

        // Setup canvas
        this.setupCanvas();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = container.clientWidth * dpr;
        this.canvas.height = container.clientHeight * dpr;
        this.canvas.style.width = `${container.clientWidth}px`;
        this.canvas.style.height = `${container.clientHeight}px`;

        this.ctx.scale(dpr, dpr);

        // Calculate grid parameters
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.originX = this.width / 2;
        this.originY = this.height / 2;
        this.scale = Math.min(this.width, this.height) / 14;
    }

    setProblem(point1, point2) {
        this.point1 = point1;
        this.point2 = point2;
        this.slope = (point2.y - point1.y) / (point2.x - point1.x);
        this.progress = 0;
        this.render();
    }

    setAnimationType(type) {
        this.animationType = type;
        this.render();
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    toCanvasX(x) {
        return this.originX + x * this.scale;
    }

    toCanvasY(y) {
        return this.originY - y * this.scale;
    }

    drawGrid() {
        const gridSize = this.scale;

        this.ctx.strokeStyle = '#f1f3f5';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawAxes() {
        this.ctx.strokeStyle = '#495057';
        this.ctx.lineWidth = 2;

        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.originY);
        this.ctx.lineTo(this.width, this.originY);
        this.ctx.stroke();

        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.originX, 0);
        this.ctx.lineTo(this.originX, this.height);
        this.ctx.stroke();

        // Draw axis labels
        this.ctx.font = '12px -apple-system, sans-serif';
        this.ctx.fillStyle = '#868e96';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // X-axis labels
        const xMin = Math.floor(-this.originX / this.scale);
        const xMax = Math.ceil((this.width - this.originX) / this.scale);

        for (let x = xMin; x <= xMax; x++) {
            if (x === 0) continue;
            const canvasX = this.toCanvasX(x);
            if (canvasX >= 0 && canvasX <= this.width) {
                this.ctx.fillText(x.toString(), canvasX, this.originY + 15);

                // Tick mark
                this.ctx.strokeStyle = '#495057';
                this.ctx.beginPath();
                this.ctx.moveTo(canvasX, this.originY - 4);
                this.ctx.lineTo(canvasX, this.originY + 4);
                this.ctx.stroke();
            }
        }

        // Y-axis labels
        const yMin = Math.floor(-this.originY / this.scale);
        const yMax = Math.ceil((this.height - this.originY) / this.scale);

        this.ctx.textAlign = 'right';
        for (let y = yMin; y <= yMax; y++) {
            if (y === 0) continue;
            const canvasY = this.toCanvasY(y);
            if (canvasY >= 0 && canvasY <= this.height) {
                this.ctx.fillText(y.toString(), this.originX - 10, canvasY);

                // Tick mark
                this.ctx.strokeStyle = '#495057';
                this.ctx.beginPath();
                this.ctx.moveTo(this.originX - 4, canvasY);
                this.ctx.lineTo(this.originX + 4, canvasY);
                this.ctx.stroke();
            }
        }

        // Origin
        this.ctx.textAlign = 'right';
        this.ctx.fillText('0', this.originX - 10, this.originY + 15);
    }

    drawLine() {
        const gradient = this.ctx.createLinearGradient(
            this.toCanvasX(this.point1.x),
            this.toCanvasY(this.point1.y),
            this.toCanvasX(this.point2.x),
            this.toCanvasY(this.point2.y)
        );
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([]);

        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvasX(this.point1.x), this.toCanvasY(this.point1.y));
        this.ctx.lineTo(this.toCanvasX(this.point2.x), this.toCanvasY(this.point2.y));
        this.ctx.stroke();
    }

    drawPoints() {
        // Point 1
        const gradient1 = this.ctx.createRadialGradient(
            this.toCanvasX(this.point1.x), this.toCanvasY(this.point1.y), 0,
            this.toCanvasX(this.point1.x), this.toCanvasY(this.point1.y), 8
        );
        gradient1.addColorStop(0, '#ff8787');
        gradient1.addColorStop(1, '#ff6b6b');

        this.ctx.fillStyle = gradient1;
        this.ctx.beginPath();
        this.ctx.arc(
            this.toCanvasX(this.point1.x),
            this.toCanvasY(this.point1.y),
            7,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Point 2
        const gradient2 = this.ctx.createRadialGradient(
            this.toCanvasX(this.point2.x), this.toCanvasY(this.point2.y), 0,
            this.toCanvasX(this.point2.x), this.toCanvasY(this.point2.y), 8
        );
        gradient2.addColorStop(0, '#63e6be');
        gradient2.addColorStop(1, '#4ecdc4');

        this.ctx.fillStyle = gradient2;
        this.ctx.beginPath();
        this.ctx.arc(
            this.toCanvasX(this.point2.x),
            this.toCanvasY(this.point2.y),
            7,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Labels
        this.ctx.font = 'bold 13px -apple-system, sans-serif';
        this.ctx.textAlign = 'left';

        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillText(
            `P₁(${this.point1.x}, ${this.point1.y})`,
            this.toCanvasX(this.point1.x) + 12,
            this.toCanvasY(this.point1.y) - 8
        );

        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.fillText(
            `P₂(${this.point2.x}, ${this.point2.y})`,
            this.toCanvasX(this.point2.x) + 12,
            this.toCanvasY(this.point2.y) - 8
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

        this.ctx.setLineDash([]);

        // Labels with background
        this.ctx.font = 'bold 14px -apple-system, sans-serif';

        // Rise label
        const riseText = `rise = ${rise}`;
        const riseX = this.toCanvasX(this.point2.x) + 15;
        const riseY = this.toCanvasY((this.point1.y + this.point2.y) / 2);

        this.ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
        this.ctx.fillRect(riseX - 4, riseY - 10, this.ctx.measureText(riseText).width + 8, 20);

        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillText(riseText, riseX, riseY);

        // Run label
        const runText = `run = ${run}`;
        const runX = this.toCanvasX((this.point1.x + this.point2.x) / 2);
        const runY = this.toCanvasY(this.point1.y) + 25;

        this.ctx.fillStyle = 'rgba(78, 205, 196, 0.2)';
        const runTextWidth = this.ctx.measureText(runText).width;
        this.ctx.fillRect(runX - runTextWidth / 2 - 4, runY - 10, runTextWidth + 8, 20);

        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(runText, runX, runY);
    }

    drawSlopeInfo() {
        const rise = this.point2.y - this.point1.y;
        const run = this.point2.x - this.point1.x;

        this.ctx.font = 'bold 15px -apple-system, sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = '#212529';

        const infoX = 12;
        const infoY = 20;
        const lineHeight = 22;

        const lines = [
            `기울기 = rise / run`,
            `기울기 = ${rise} / ${run}`,
            `기울기 = ${this.slope.toFixed(2)}`
        ];

        // Background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(infoX - 6, infoY - 16, 180, lineHeight * lines.length + 8);

        // Text
        this.ctx.fillStyle = '#212529';
        lines.forEach((line, i) => {
            this.ctx.fillText(line, infoX, infoY + i * lineHeight);
        });
    }

    drawAnimatedObject() {
        const t = this.progress;
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
        const radius = 14;
        const rotation = t * Math.PI * 6;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(rotation);

        // Ball shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, radius + 4, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.rotate(-rotation);

        // Ball gradient
        const gradient = this.ctx.createRadialGradient(-6, -6, 0, 0, 0, radius);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, '#667eea');
        gradient.addColorStop(1, '#764ba2');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.beginPath();
        this.ctx.arc(-4, -4, 5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawSkier(x, y, t) {
        this.ctx.save();
        this.ctx.translate(x, y);

        const angle = Math.atan2(this.point2.y - this.point1.y, this.point2.x - this.point1.x);
        this.ctx.rotate(angle);

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.fillRect(-10, 18, 20, 4);

        // Head
        this.ctx.fillStyle = '#fab005';
        this.ctx.beginPath();
        this.ctx.arc(0, -18, 6, 0, Math.PI * 2);
        this.ctx.fill();

        // Body
        this.ctx.strokeStyle = '#212529';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(0, 5);
        this.ctx.stroke();

        // Arms
        this.ctx.beginPath();
        this.ctx.moveTo(-8, 0);
        this.ctx.lineTo(0, -5);
        this.ctx.lineTo(8, 0);
        this.ctx.stroke();

        // Legs/Skis
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-6, 5);
        this.ctx.lineTo(-4, 18);
        this.ctx.moveTo(6, 5);
        this.ctx.lineTo(4, 18);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawCar(x, y, t) {
        this.ctx.save();
        this.ctx.translate(x, y);

        const angle = Math.atan2(this.point2.y - this.point1.y, this.point2.x - this.point1.x);
        this.ctx.rotate(angle);

        // Shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        this.ctx.fillRect(-18, 14, 36, 4);

        // Car body
        const carGradient = this.ctx.createLinearGradient(0, -10, 0, 8);
        carGradient.addColorStop(0, '#ff8787');
        carGradient.addColorStop(1, '#ff6b6b');

        this.ctx.fillStyle = carGradient;
        this.ctx.fillRect(-18, -10, 36, 18);

        // Windows
        this.ctx.fillStyle = '#4ecdc4';
        this.ctx.fillRect(-14, -8, 10, 10);
        this.ctx.fillRect(4, -8, 10, 10);

        // Wheels
        this.ctx.fillStyle = '#212529';
        this.ctx.beginPath();
        this.ctx.arc(-10, 8, 5, 0, Math.PI * 2);
        this.ctx.arc(10, 8, 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Wheel rims
        this.ctx.fillStyle = '#868e96';
        this.ctx.beginPath();
        this.ctx.arc(-10, 8, 3, 0, Math.PI * 2);
        this.ctx.arc(10, 8, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawWater(x, y, t) {
        const numDrops = 5;

        for (let i = 0; i < numDrops; i++) {
            const offset = (t * 15 + i * 0.2) % 1;
            const dropX = x - 20 + i * 10;
            const dropY = y - offset * 30;
            const alpha = 1 - offset;

            this.ctx.fillStyle = `rgba(78, 205, 196, ${alpha * 0.8})`;
            this.ctx.beginPath();
            this.ctx.arc(dropX, dropY, 5 - offset * 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Drop tail
            this.ctx.fillStyle = `rgba(78, 205, 196, ${alpha * 0.5})`;
            this.ctx.beginPath();
            this.ctx.ellipse(dropX, dropY - 3, 2, 4, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.drawGrid();
        this.drawAxes();
        this.drawLine();
        this.drawRiseRun();
        this.drawPoints();
        this.drawAnimatedObject();
        this.drawSlopeInfo();
    }

    animate() {
        if (!this.isPlaying) return;

        this.render();

        this.progress += 0.008 * this.speed;
        if (this.progress >= 1) {
            this.progress = 0;
        }

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
        this.progress = 0;
        this.render();
    }

    destroy() {
        this.pause();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export default AnimationEngine;
