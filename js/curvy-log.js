/**
 * Curvy Log - Emotional Log Animation Engine
 * Smooth, aesthetic curved line animations for log data visualization
 */

class CurvyLog {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Configuration
        this.config = {
            animationSpeed: options.animationSpeed || 2,
            curveIntensity: options.curveIntensity || 0.6,
            lineWidth: options.lineWidth || 3,
            pointRadius: options.pointRadius || 6,
            colors: options.colors || {
                primary: '#4ECDC4',
                secondary: '#FF6B6B',
                accent: '#FFE66D',
                background: 'transparent'
            },
            padding: options.padding || 40
        };

        // Animation state
        this.data = [];
        this.currentFrame = 0;
        this.totalFrames = 0;
        this.isAnimating = false;
        this.animationId = null;
        this.completionCallbacks = [];

        // Visual effects
        this.particles = [];
        this.gradientCache = null;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.createGradient();
    }

    createGradient() {
        this.gradientCache = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        this.gradientCache.addColorStop(0, this.config.colors.primary);
        this.gradientCache.addColorStop(0.5, this.config.colors.secondary);
        this.gradientCache.addColorStop(1, this.config.colors.accent);
    }

    setData(data) {
        this.data = data;
        this.currentFrame = 0;
        this.totalFrames = data.length * 30; // 30 frames per data point
        this.normalizeData();
    }

    normalizeData() {
        if (this.data.length === 0) return;

        const yValues = this.data.map(d => d.y);
        const minY = Math.min(...yValues);
        const maxY = Math.max(...yValues);

        const height = this.canvas.height - (this.config.padding * 2);
        const width = this.canvas.width - (this.config.padding * 2);

        this.data = this.data.map((point, index) => ({
            ...point,
            normalizedX: this.config.padding + (index / (this.data.length - 1)) * width,
            normalizedY: this.canvas.height - this.config.padding -
                ((point.y - minY) / (maxY - minY)) * height
        }));
    }

    // Catmull-Rom spline interpolation for smooth curves
    catmullRomSpline(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;

        const v0 = (p2 - p0) * 0.5;
        const v1 = (p3 - p1) * 0.5;

        return (2 * p1 - 2 * p2 + v0 + v1) * t3 +
               (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
               v0 * t + p1;
    }

    getPointOnCurve(index, t) {
        const tension = this.config.curveIntensity;

        let p0, p1, p2, p3;

        if (index === 0) {
            p0 = this.data[0];
            p1 = this.data[0];
            p2 = this.data[1] || this.data[0];
            p3 = this.data[2] || this.data[1] || this.data[0];
        } else if (index >= this.data.length - 2) {
            p0 = this.data[this.data.length - 3] || this.data[0];
            p1 = this.data[this.data.length - 2] || this.data[0];
            p2 = this.data[this.data.length - 1];
            p3 = this.data[this.data.length - 1];
        } else {
            p0 = this.data[index - 1];
            p1 = this.data[index];
            p2 = this.data[index + 1];
            p3 = this.data[index + 2];
        }

        const x = this.catmullRomSpline(
            p0.normalizedX,
            p1.normalizedX,
            p2.normalizedX,
            p3.normalizedX,
            t
        ) * tension + p1.normalizedX * (1 - tension) + (p2.normalizedX - p1.normalizedX) * t * (1 - tension);

        const y = this.catmullRomSpline(
            p0.normalizedY,
            p1.normalizedY,
            p2.normalizedY,
            p3.normalizedY,
            t
        ) * tension + p1.normalizedY * (1 - tension) + (p2.normalizedY - p1.normalizedY) * t * (1 - tension);

        return { x, y };
    }

    drawCurve(progress) {
        const ctx = this.ctx;
        const pointsToShow = Math.floor(progress * this.data.length);

        if (pointsToShow < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = this.gradientCache;
        ctx.lineWidth = this.config.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Start path
        const firstPoint = this.data[0];
        ctx.moveTo(firstPoint.normalizedX, firstPoint.normalizedY);

        // Draw smooth curve through points
        for (let i = 0; i < pointsToShow - 1; i++) {
            const steps = 20; // Smoothness factor

            for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                const point = this.getPointOnCurve(i, t);
                ctx.lineTo(point.x, point.y);
            }
        }

        ctx.stroke();

        // Draw glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.config.colors.primary;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawPoints(progress) {
        const ctx = this.ctx;
        const pointsToShow = Math.floor(progress * this.data.length);

        for (let i = 0; i < pointsToShow; i++) {
            const point = this.data[i];
            const isLatest = i === pointsToShow - 1;

            // Draw point
            ctx.beginPath();
            ctx.arc(
                point.normalizedX,
                point.normalizedY,
                isLatest ? this.config.pointRadius * 1.5 : this.config.pointRadius,
                0,
                Math.PI * 2
            );

            // Color based on position
            const colorIndex = i / this.data.length;
            if (colorIndex < 0.33) {
                ctx.fillStyle = this.config.colors.primary;
            } else if (colorIndex < 0.66) {
                ctx.fillStyle = this.config.colors.secondary;
            } else {
                ctx.fillStyle = this.config.colors.accent;
            }

            ctx.fill();

            // Glow for latest point
            if (isLatest) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Pulsing effect
                const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
                ctx.globalAlpha = pulse;
                ctx.beginPath();
                ctx.arc(
                    point.normalizedX,
                    point.normalizedY,
                    this.config.pointRadius * 2,
                    0,
                    Math.PI * 2
                );
                ctx.strokeStyle = this.config.colors.accent;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    }

    drawParticles() {
        const ctx = this.ctx;

        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.life -= 0.02;
            particle.y -= particle.speed;
            particle.x += particle.drift;

            if (particle.life <= 0) return false;

            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();

            return true;
        });

        ctx.globalAlpha = 1;
    }

    createParticle(x, y) {
        const colors = [
            this.config.colors.primary,
            this.config.colors.secondary,
            this.config.colors.accent
        ];

        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 10,
                y: y + (Math.random() - 0.5) * 10,
                speed: Math.random() * 2 + 1,
                drift: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                life: 1,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        const padding = this.config.padding;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Horizontal lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (this.canvas.height - padding * 2) * (i / 5);
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(this.canvas.width - padding, y);
            ctx.stroke();
        }

        // Vertical lines
        for (let i = 0; i <= 5; i++) {
            const x = padding + (this.canvas.width - padding * 2) * (i / 5);
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, this.canvas.height - padding);
            ctx.stroke();
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render(progress) {
        this.clear();
        this.drawGrid();
        this.drawCurve(progress);
        this.drawPoints(progress);
        this.drawParticles();

        // Create particles at latest point occasionally
        if (Math.random() < 0.1 && this.data.length > 0) {
            const latestIndex = Math.floor(progress * this.data.length) - 1;
            if (latestIndex >= 0 && latestIndex < this.data.length) {
                const point = this.data[latestIndex];
                this.createParticle(point.normalizedX, point.normalizedY);
            }
        }
    }

    animate() {
        if (!this.isAnimating) return;

        this.currentFrame += this.config.animationSpeed;

        if (this.currentFrame >= this.totalFrames) {
            this.currentFrame = this.totalFrames;
            this.isAnimating = false;
            this.completionCallbacks.forEach(cb => cb());
        }

        const progress = this.currentFrame / this.totalFrames;
        this.render(progress);

        if (this.isAnimating) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    play() {
        if (this.data.length === 0) {
            console.warn('No data to animate');
            return;
        }

        this.currentFrame = 0;
        this.isAnimating = true;
        this.animate();
    }

    pause() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    reset() {
        this.pause();
        this.currentFrame = 0;
        this.particles = [];
        this.clear();
    }

    setSpeed(speed) {
        this.config.animationSpeed = speed;
    }

    setCurveIntensity(intensity) {
        this.config.curveIntensity = intensity;
        if (!this.isAnimating) {
            const progress = this.currentFrame / this.totalFrames;
            this.render(progress);
        }
    }

    onComplete(callback) {
        this.completionCallbacks.push(callback);
    }

    getCurrentPoint() {
        const index = Math.floor((this.currentFrame / this.totalFrames) * this.data.length) - 1;
        if (index >= 0 && index < this.data.length) {
            return this.data[index];
        }
        return null;
    }
}
