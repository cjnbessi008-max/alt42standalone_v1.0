// Dual Dance Visualization Module
export class DualDanceVisualization {
    constructor(canvas, speed = 3) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.speed = speed;
        this.animationPhase = 0;
        this.animationFrame = null;
        this.isRunning = false;

        // Function parameters
        this.expBase = 2;
        this.logBase = 2;
        this.expCoeff = 1;
        this.logCoeff = 1;
    }

    setProblem(problem) {
        this.expBase = parseFloat(problem.exp_base);
        this.logBase = parseFloat(problem.log_base);
        this.expCoeff = parseFloat(problem.exp_coefficient);
        this.logCoeff = parseFloat(problem.log_coefficient);

        // Update labels
        document.getElementById('exp-function-label').textContent =
            `f(x) = ${this.expCoeff.toFixed(1)} × ${this.expBase.toFixed(1)}^x`;
        document.getElementById('log-function-label').textContent =
            `g(x) = ${this.logCoeff.toFixed(1)} × log${this.logBase.toFixed(1)}(x)`;
    }

    setSpeed(speed) {
        this.speed = speed;
    }

    start() {
        this.isRunning = true;
        this.animate();
    }

    stop() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    animate() {
        if (!this.isRunning) return;

        this.animationPhase += 0.02 * this.speed;
        this.draw();

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    draw() {
        const { width, height } = this.canvas;
        const ctx = this.ctx;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#f8f9fa');
        gradient.addColorStop(1, '#e9ecef');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        this.drawGrid(ctx, width, height);

        // Draw axes
        this.drawAxes(ctx, width, height);

        // Draw functions
        this.drawExponential(ctx, width, height);
        this.drawLogarithmic(ctx, width, height);
    }

    drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#dee2e6';
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= width; x += width / 10) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 0; y <= height; y += height / 10) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawAxes(ctx, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.strokeStyle = '#495057';
        ctx.lineWidth = 2;

        // X-axis
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.stroke();
    }

    drawExponential(ctx, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = 30;

        const animatedBase = this.expBase + 0.3 * Math.sin(this.animationPhase);

        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';

        ctx.beginPath();
        let started = false;

        for (let x = -5; x <= 5; x += 0.05) {
            const y = this.expCoeff * Math.pow(animatedBase, x);
            const canvasX = centerX + x * scale;
            const canvasY = centerY - y * scale;

            if (canvasY >= -50 && canvasY <= height + 50) {
                if (!started) {
                    ctx.moveTo(canvasX, canvasY);
                    started = true;
                } else {
                    ctx.lineTo(canvasX, canvasY);
                }
            }
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawLogarithmic(ctx, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = 30;

        const animatedBase = this.logBase + 0.3 * Math.cos(this.animationPhase * 1.1);

        ctx.strokeStyle = '#4facfe';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(79, 172, 254, 0.5)';

        ctx.beginPath();
        let started = false;

        for (let x = 0.1; x <= 10; x += 0.05) {
            const y = this.logCoeff * Math.log(x) / Math.log(animatedBase);
            const canvasX = centerX + x * scale;
            const canvasY = centerY - y * scale;

            if (canvasX >= 0 && canvasX <= width && canvasY >= -50 && canvasY <= height + 50) {
                if (!started) {
                    ctx.moveTo(canvasX, canvasY);
                    started = true;
                } else {
                    ctx.lineTo(canvasX, canvasY);
                }
            }
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    getState() {
        return {
            animationPhase: this.animationPhase,
            expBase: this.expBase,
            logBase: this.logBase
        };
    }
}
