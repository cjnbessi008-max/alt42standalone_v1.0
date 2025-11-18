/**
 * Live Graph Implementation
 * 그래프가 숨 쉬듯 움직이며 변화량을 보여주는 기능
 */

class LiveGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas with id '${canvasId}' not found`);
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.data = [];
        this.animationFrame = null;
        this.breathPhase = 0;
        this.breathSpeed = 0.02;
        this.pulseIntensity = 0.15;
        this.tooltip = this.createTooltip();

        this.setupCanvas();
        this.setupEventListeners();
        this.startBreathingAnimation();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);

        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'graph-tooltip';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
        window.addEventListener('resize', () => this.setupCanvas());
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find nearest data point
        const point = this.findNearestPoint(x, y);

        if (point && this.distance(x, y, point.x, point.y) < 20) {
            this.showTooltip(e.clientX, e.clientY, point);
        } else {
            this.hideTooltip();
        }
    }

    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    findNearestPoint(x, y) {
        if (!this.renderedPoints || this.renderedPoints.length === 0) return null;

        let nearest = null;
        let minDist = Infinity;

        for (const point of this.renderedPoints) {
            const dist = this.distance(x, y, point.x, point.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = point;
            }
        }

        return nearest;
    }

    showTooltip(x, y, point) {
        this.tooltip.innerHTML = `
            <strong>시간:</strong> ${new Date(point.timestamp * 1000).toLocaleTimeString('ko-KR')}<br>
            <strong>점수:</strong> ${point.value.toFixed(2)}
        `;
        this.tooltip.style.left = x + 10 + 'px';
        this.tooltip.style.top = y - 40 + 'px';
        this.tooltip.classList.add('show');
    }

    hideTooltip() {
        this.tooltip.classList.remove('show');
    }

    setData(data) {
        this.data = data;
        this.draw();
    }

    startBreathingAnimation() {
        const animate = () => {
            this.breathPhase += this.breathSpeed;
            this.draw();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    getBreathScale() {
        // Smooth breathing effect using sine wave
        return 1 + Math.sin(this.breathPhase) * this.pulseIntensity;
    }

    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Apply breathing scale from center
        const scale = this.getBreathScale();
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);

        // Draw grid with fade animation
        this.drawGrid(ctx, width, height);

        if (this.data && this.data.length > 0) {
            // Draw data
            this.drawLine(ctx, width, height);
            this.drawPoints(ctx, width, height);
        } else {
            // Draw placeholder
            this.drawPlaceholder(ctx, width, height);
        }

        ctx.restore();
    }

    drawGrid(ctx, width, height) {
        const gridColor = `rgba(0, 0, 0, ${0.1 + Math.abs(Math.sin(this.breathPhase * 0.5)) * 0.1})`;
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= width; x += width / 6) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += height / 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawLine(ctx, width, height) {
        if (this.data.length < 2) return;

        const maxValue = Math.max(...this.data.map(d => d.score));
        const minValue = Math.min(...this.data.map(d => d.score));
        const range = maxValue - minValue || 1;

        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        const hue = (Math.sin(this.breathPhase * 0.3) + 1) * 60 + 90; // 90-210 (green to blue)
        gradient.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.8)`);
        gradient.addColorStop(1, `hsla(${hue + 40}, 70%, 50%, 0.8)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw line
        ctx.beginPath();
        this.data.forEach((point, index) => {
            const x = padding + (index / (this.data.length - 1)) * graphWidth;
            const normalizedValue = (point.score - minValue) / range;
            const y = padding + graphHeight - (normalizedValue * graphHeight);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw fill area
        ctx.lineTo(padding + graphWidth, padding + graphHeight);
        ctx.lineTo(padding, padding + graphHeight);
        ctx.closePath();

        const fillGradient = ctx.createLinearGradient(0, padding, 0, padding + graphHeight);
        fillGradient.addColorStop(0, `hsla(${hue}, 70%, 50%, 0.3)`);
        fillGradient.addColorStop(1, `hsla(${hue}, 70%, 50%, 0.05)`);
        ctx.fillStyle = fillGradient;
        ctx.fill();
    }

    drawPoints(ctx, width, height) {
        const maxValue = Math.max(...this.data.map(d => d.score));
        const minValue = Math.min(...this.data.map(d => d.score));
        const range = maxValue - minValue || 1;

        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        this.renderedPoints = [];

        this.data.forEach((point, index) => {
            const x = padding + (index / (this.data.length - 1)) * graphWidth;
            const normalizedValue = (point.score - minValue) / range;
            const y = padding + graphHeight - (normalizedValue * graphHeight);

            this.renderedPoints.push({
                x, y,
                value: point.score,
                timestamp: point.timestamp
            });

            // Pulse effect on points
            const pulsePhase = this.breathPhase + index * 0.5;
            const pulseSize = 3 + Math.abs(Math.sin(pulsePhase)) * 2;

            // Outer glow
            const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, pulseSize * 2);
            glowGradient.addColorStop(0, 'rgba(76, 175, 80, 0.6)');
            glowGradient.addColorStop(1, 'rgba(76, 175, 80, 0)');

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x, y, pulseSize * 2, 0, Math.PI * 2);
            ctx.fill();

            // Main point
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
            ctx.fill();

            // Inner highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(x - 1, y - 1, pulseSize / 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawPlaceholder(ctx, width, height) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const message = '데이터를 불러오는 중...';
        ctx.fillText(message, width / 2, height / 2);

        // Animated loading dots
        const dots = '.'.repeat((Math.floor(this.breathPhase * 2) % 3) + 1);
        ctx.fillText(dots, width / 2, height / 2 + 25);
    }

    destroy() {
        this.stopAnimation();
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveGraph;
}
