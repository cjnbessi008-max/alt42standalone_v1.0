/**
 * Blossom Sequence Visualization Engine
 * Handles flower petal animation on canvas
 */

class BlossomVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.baseRadius = 80;
        this.petalLength = 55;
        this.petalWidth = 35;

        this.colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
            '#F8B500', '#FF69B4', '#7FDBFF', '#39CCCC'
        ];

        this.sequence = [];
        this.petalCount = 0;
        this.currentStep = 0;
        this.animationSpeed = 400;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.currentStep = 0;
    }

    drawCenter() {
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, 5,
            this.centerX, this.centerY, 22
        );
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#FFA500');

        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, 22, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        this.ctx.strokeStyle = '#FF8C00';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    setSequence(sequence, petalCount) {
        this.sequence = sequence;
        this.petalCount = petalCount || sequence.length;
        this.clear();
    }

    startAnimation() {
        this.clear();
        this.drawCenter();
        this.currentStep = 0;
        this.animateSequence();
    }

    animateSequence() {
        if (this.currentStep >= this.sequence.length) {
            return;
        }

        setTimeout(() => {
            this.drawPetal(this.currentStep);
            this.currentStep++;
            this.animateSequence();
        }, this.animationSpeed);
    }

    drawPetal(index) {
        const angle = (2 * Math.PI * index) / this.petalCount;
        const value = this.sequence[index];
        const color = this.colors[index % this.colors.length];

        const petalX = this.centerX + Math.cos(angle) * this.baseRadius;
        const petalY = this.centerY + Math.sin(angle) * this.baseRadius;

        this.animatePetalGrowth(petalX, petalY, angle, color, value, 0);
    }

    animatePetalGrowth(x, y, angle, color, value, progress) {
        if (progress >= 1) {
            this.drawCompletePetal(x, y, angle, color, value);
            return;
        }

        const eased = this.easeOutCubic(progress);

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        this.ctx.globalAlpha = eased;
        this.ctx.scale(eased, eased);

        this.drawPetalShape(color);

        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(value.toString(), this.petalLength / 2, 0);

        this.ctx.restore();

        requestAnimationFrame(() => {
            this.animatePetalGrowth(x, y, angle, color, value, progress + 0.05);
        });
    }

    drawCompletePetal(x, y, angle, color, value) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        this.drawPetalShape(color);

        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 17px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(value.toString(), this.petalLength / 2, 0);

        this.ctx.restore();
    }

    drawPetalShape(color) {
        const gradient = this.ctx.createLinearGradient(
            0, -this.petalWidth / 2,
            0, this.petalWidth / 2
        );
        gradient.addColorStop(0, this.lightenColor(color, 20));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, this.darkenColor(color, 20));

        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.bezierCurveTo(
            this.petalLength / 3, -this.petalWidth / 2,
            2 * this.petalLength / 3, -this.petalWidth / 2,
            this.petalLength, 0
        );
        this.ctx.bezierCurveTo(
            2 * this.petalLength / 3, this.petalWidth / 2,
            this.petalLength / 3, this.petalWidth / 2,
            0, 0
        );
        this.ctx.closePath();

        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        this.ctx.strokeStyle = this.darkenColor(color, 30);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Highlight
        this.ctx.beginPath();
        this.ctx.moveTo(this.petalLength / 4, -this.petalWidth / 4);
        this.ctx.lineTo(3 * this.petalLength / 4, -this.petalWidth / 4);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
            (G > 0 ? G : 0) * 0x100 +
            (B > 0 ? B : 0))
            .toString(16).slice(1);
    }

    celebrate() {
        this.canvas.classList.add('petal-glow');
        setTimeout(() => {
            this.canvas.classList.remove('petal-glow');
        }, 2000);
    }
}

// Sequence Generator
class SequenceGenerator {
    static generate(type, count, params = {}) {
        switch (type) {
            case 'fibonacci':
                return this.generateFibonacci(count);
            case 'arithmetic':
                return this.generateArithmetic(count, params);
            case 'geometric':
                return this.generateGeometric(count, params);
            case 'square':
                return this.generateSquare(count);
            case 'prime':
                return this.generatePrime(count);
            default:
                return this.generateArithmetic(count, { start: 1, step: 1 });
        }
    }

    static generateFibonacci(count) {
        const seq = [1, 1];
        for (let i = 2; i < count; i++) {
            seq.push(seq[i - 1] + seq[i - 2]);
        }
        return seq.slice(0, count);
    }

    static generateArithmetic(count, { start = 1, step = 2 } = {}) {
        return Array.from({ length: count }, (_, i) => start + i * step);
    }

    static generateGeometric(count, { start = 2, ratio = 2 } = {}) {
        return Array.from({ length: count }, (_, i) => start * Math.pow(ratio, i));
    }

    static generateSquare(count) {
        return Array.from({ length: count }, (_, i) => (i + 1) * (i + 1));
    }

    static generatePrime(count) {
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61];
        return primes.slice(0, count);
    }

    static calculateNext(sequence, type) {
        if (sequence.length < 2) return 0;

        switch (type) {
            case 'fibonacci':
                return sequence[sequence.length - 1] + sequence[sequence.length - 2];
            case 'arithmetic':
                return sequence[sequence.length - 1] + (sequence[1] - sequence[0]);
            case 'geometric':
                return sequence[sequence.length - 1] * (sequence[1] / sequence[0]);
            case 'square':
                const n = sequence.length + 1;
                return n * n;
            case 'prime':
                return this.nextPrime(sequence[sequence.length - 1]);
            default:
                return sequence[sequence.length - 1] + (sequence[1] - sequence[0]);
        }
    }

    static nextPrime(n) {
        let candidate = n + 1;
        while (!this.isPrime(candidate)) {
            candidate++;
        }
        return candidate;
    }

    static isPrime(n) {
        if (n < 2) return false;
        if (n === 2) return true;
        if (n % 2 === 0) return false;
        for (let i = 3; i <= Math.sqrt(n); i += 2) {
            if (n % i === 0) return false;
        }
        return true;
    }
}
