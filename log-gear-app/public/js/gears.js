/**
 * Log Gear Visualization Engine
 * Demonstrates multiplication → addition conversion using mechanical gears
 * Based on logarithmic principle: log(a × b) = log(a) + log(b)
 */

class LogGearEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Gear properties
        this.gears = {
            input1: { x: 80, y: 120, radius: 50, teeth: 20, angle: 0, color: '#3498db', value: 1 },
            input2: { x: 240, y: 120, radius: 50, teeth: 20, angle: 0, color: '#3498db', value: 1 },
            log1: { x: 80, y: 220, radius: 40, teeth: 16, angle: 0, color: '#e74c3c', value: 0 },
            log2: { x: 240, y: 220, radius: 40, teeth: 16, angle: 0, color: '#e74c3c', value: 0 },
            output: { x: 160, y: 270, radius: 55, teeth: 24, angle: 0, color: '#2ecc71', value: 1 }
        };

        this.animationId = null;
        this.isAnimating = false;
        this.animationProgress = 0;
        this.animationSpeed = 0.02;

        this.operand1 = 1;
        this.operand2 = 1;
        this.result = 1;
        this.operation = 'multiply';

        this.init();
    }

    init() {
        this.draw();
    }

    /**
     * Set problem values
     */
    setProblem(operand1, operand2, operation = 'multiply') {
        this.operand1 = parseFloat(operand1) || 1;
        this.operand2 = parseFloat(operand2) || 1;
        this.operation = operation;

        if (this.operation === 'multiply') {
            this.result = this.operand1 * this.operand2;
        } else {
            this.result = this.operand1 / this.operand2;
        }

        this.gears.input1.value = this.operand1;
        this.gears.input2.value = this.operand2;
        this.gears.output.value = this.result;

        this.resetGears();
        this.draw();
    }

    /**
     * Reset all gears to initial position
     */
    resetGears() {
        Object.values(this.gears).forEach(gear => {
            gear.angle = 0;
        });
        this.animationProgress = 0;
    }

    /**
     * Start animation showing multiplication → addition conversion
     */
    startAnimation() {
        if (this.isAnimating) return;

        this.resetGears();
        this.isAnimating = true;
        this.animate();
    }

    /**
     * Stop animation
     */
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isAnimating) return;

        this.animationProgress += this.animationSpeed;

        if (this.animationProgress >= 1) {
            this.animationProgress = 1;
            this.isAnimating = false;
        }

        // Calculate gear rotations based on logarithmic conversion
        const log1 = Math.log10(this.operand1);
        const log2 = Math.log10(this.operand2);
        const logResult = this.operation === 'multiply' ? log1 + log2 : log1 - log2;

        // Input gears rotate proportional to their values
        this.gears.input1.angle = this.animationProgress * (this.operand1 / 10) * Math.PI * 2;
        this.gears.input2.angle = this.animationProgress * (this.operand2 / 10) * Math.PI * 2;

        // Log gears rotate proportional to log values
        this.gears.log1.angle = this.animationProgress * log1 * Math.PI;
        this.gears.log2.angle = this.animationProgress * log2 * Math.PI;

        // Output gear shows the addition/subtraction of log values
        this.gears.output.angle = this.animationProgress * logResult * Math.PI;

        this.draw();

        if (this.isAnimating) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    /**
     * Draw all gears and connections
     */
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw title
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Log Gear Mechanism', this.canvas.width / 2, 25);

        // Draw connection lines
        this.drawConnectionLine(this.gears.input1, this.gears.log1, '#95a5a6');
        this.drawConnectionLine(this.gears.input2, this.gears.log2, '#95a5a6');
        this.drawConnectionLine(this.gears.log1, this.gears.output, '#95a5a6');
        this.drawConnectionLine(this.gears.log2, this.gears.output, '#95a5a6');

        // Draw labels for stages
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';

        // Input stage
        this.ctx.fillText('입력 (곱셈)', this.canvas.width / 2, 50);

        // Log stage
        this.ctx.fillText('로그 변환', this.canvas.width / 2, 170);

        // Output stage
        this.ctx.fillText('결과 (덧셈)', this.canvas.width / 2, 250);

        // Draw all gears
        this.drawGear(this.gears.input1, `${this.operand1}`);
        this.drawGear(this.gears.input2, `${this.operand2}`);
        this.drawGear(this.gears.log1, `log ${this.operand1.toFixed(1)}`);
        this.drawGear(this.gears.log2, `log ${this.operand2.toFixed(1)}`);

        const opSymbol = this.operation === 'multiply' ? '×' : '÷';
        this.drawGear(this.gears.output, `${this.result.toFixed(2)}`);

        // Draw operation indicator
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.fillText(opSymbol, this.canvas.width / 2, 95);

        // Draw addition indicator for log values
        const logOpSymbol = this.operation === 'multiply' ? '+' : '-';
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillText(logOpSymbol, this.canvas.width / 2, 240);

        // Draw formula
        this.drawFormula();
    }

    /**
     * Draw connection line between gears
     */
    drawConnectionLine(gear1, gear2, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(gear1.x, gear1.y);
        this.ctx.lineTo(gear2.x, gear2.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    /**
     * Draw a single gear
     */
    drawGear(gear, label) {
        const ctx = this.ctx;

        // Draw gear body
        ctx.save();
        ctx.translate(gear.x, gear.y);
        ctx.rotate(gear.angle);

        // Draw teeth
        ctx.fillStyle = gear.color;
        ctx.strokeStyle = this.darkenColor(gear.color);
        ctx.lineWidth = 2;

        ctx.beginPath();
        for (let i = 0; i < gear.teeth; i++) {
            const angle = (i / gear.teeth) * Math.PI * 2;
            const nextAngle = ((i + 1) / gear.teeth) * Math.PI * 2;

            const outerRadius = gear.radius;
            const innerRadius = gear.radius * 0.8;

            // Outer tooth edge
            const x1 = Math.cos(angle) * outerRadius;
            const y1 = Math.sin(angle) * outerRadius;

            const x2 = Math.cos(angle + (nextAngle - angle) * 0.4) * outerRadius;
            const y2 = Math.sin(angle + (nextAngle - angle) * 0.4) * outerRadius;

            // Inner tooth edge
            const x3 = Math.cos(angle + (nextAngle - angle) * 0.4) * innerRadius;
            const y3 = Math.sin(angle + (nextAngle - angle) * 0.4) * innerRadius;

            const x4 = Math.cos(nextAngle - (nextAngle - angle) * 0.4) * innerRadius;
            const y4 = Math.sin(nextAngle - (nextAngle - angle) * 0.4) * innerRadius;

            const x5 = Math.cos(nextAngle - (nextAngle - angle) * 0.4) * outerRadius;
            const y5 = Math.sin(nextAngle - (nextAngle - angle) * 0.4) * outerRadius;

            if (i === 0) {
                ctx.moveTo(x1, y1);
            }

            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.lineTo(x4, y4);
            ctx.lineTo(x5, y5);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw center circle
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.arc(0, 0, gear.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw label
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, gear.x, gear.y);
    }

    /**
     * Draw formula explanation
     */
    drawFormula() {
        const ctx = this.ctx;
        const y = this.canvas.height - 10;

        ctx.fillStyle = '#7f8c8d';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';

        if (this.operation === 'multiply') {
            const formula = `log(${this.operand1} × ${this.operand2}) = log(${this.operand1}) + log(${this.operand2})`;
            ctx.fillText(formula, this.canvas.width / 2, y);
        } else {
            const formula = `log(${this.operand1} ÷ ${this.operand2}) = log(${this.operand1}) - log(${this.operand2})`;
            ctx.fillText(formula, this.canvas.width / 2, y);
        }
    }

    /**
     * Darken a color
     */
    darkenColor(color) {
        const colors = {
            '#3498db': '#2980b9',
            '#e74c3c': '#c0392b',
            '#2ecc71': '#27ae60'
        };
        return colors[color] || color;
    }
}

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogGearEngine;
}
