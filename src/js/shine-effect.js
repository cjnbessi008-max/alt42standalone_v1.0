/**
 * Tangent Shine Effect
 * Creates beautiful glowing and particle effects when tangent lines are drawn
 */

class ShineEffect {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.glowLines = [];
        this.animationId = null;
        this.isAnimating = false;

        this.setupCanvas();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.width = rect.width;
        this.height = rect.height;
    }

    /**
     * Trigger shine effect at a point
     * @param {number} x - Canvas x coordinate
     * @param {number} y - Canvas y coordinate
     * @param {Object} tangentLine - Tangent line data
     */
    triggerShine(x, y, tangentLine = null) {
        // Create burst of particles at point
        this.createParticleBurst(x, y, 20);

        // Create glow line if tangent line is provided
        if (tangentLine) {
            this.createGlowLine(tangentLine);
        }

        // Start animation if not already running
        if (!this.isAnimating) {
            this.startAnimation();
        }
    }

    /**
     * Create particle burst effect
     */
    createParticleBurst(x, y, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const velocity = 1 + Math.random() * 2;
            const size = 2 + Math.random() * 4;
            const hue = 250 + Math.random() * 30; // Blue to purple range

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                size,
                life: 1.0,
                maxLife: 0.8 + Math.random() * 0.4,
                decay: 0.015 + Math.random() * 0.01,
                hue,
                type: 'burst'
            });
        }
    }

    /**
     * Create trailing sparkle particles along line
     */
    createSparkleTrail(x1, y1, x2, y2, count = 15) {
        for (let i = 0; i < count; i++) {
            const t = i / count;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            const delay = i * 0.05;

            setTimeout(() => {
                const sparkleCount = 3 + Math.random() * 3;
                for (let j = 0; j < sparkleCount; j++) {
                    const angle = Math.random() * Math.PI * 2;
                    const velocity = 0.5 + Math.random() * 1;
                    const size = 1 + Math.random() * 2;

                    this.particles.push({
                        x,
                        y,
                        vx: Math.cos(angle) * velocity,
                        vy: Math.sin(angle) * velocity,
                        size,
                        life: 1.0,
                        maxLife: 0.6,
                        decay: 0.02,
                        hue: 250 + Math.random() * 30,
                        type: 'sparkle'
                    });
                }
            }, delay * 1000);
        }
    }

    /**
     * Create glowing line effect
     */
    createGlowLine(tangentLine) {
        this.glowLines.push({
            x1: tangentLine.x1,
            y1: tangentLine.y1,
            x2: tangentLine.x2,
            y2: tangentLine.y2,
            intensity: 1.0,
            decay: 0.02,
            color: 'rgba(102, 126, 234, ',
            width: 4
        });

        // Create sparkle trail along the line
        this.createSparkleTrail(tangentLine.x1, tangentLine.y1, tangentLine.x2, tangentLine.y2);
    }

    /**
     * Create ripple effect at point
     */
    createRipple(x, y) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.particles.push({
                    x,
                    y,
                    radius: 0,
                    maxRadius: 50 + Math.random() * 30,
                    life: 1.0,
                    decay: 0.015,
                    hue: 250,
                    type: 'ripple'
                });
            }, i * 100);
        }
    }

    /**
     * Update particles
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (p.type === 'ripple') {
                p.radius += 2;
                p.life -= p.decay;
            } else {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.98;
                p.vy *= 0.98;
                p.life -= p.decay;
            }

            // Remove dead particles
            if (p.life <= 0 || (p.type === 'ripple' && p.radius >= p.maxRadius)) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Update glow lines
     */
    updateGlowLines() {
        for (let i = this.glowLines.length - 1; i >= 0; i--) {
            const line = this.glowLines[i];
            line.intensity -= line.decay;

            if (line.intensity <= 0) {
                this.glowLines.splice(i, 1);
            }
        }
    }

    /**
     * Draw particles
     */
    drawParticles() {
        this.particles.forEach(p => {
            const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));

            if (p.type === 'ripple') {
                this.ctx.strokeStyle = `hsla(${p.hue}, 70%, 60%, ${alpha * 0.6})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            } else {
                // Outer glow
                const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
                gradient.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${alpha * 0.8})`);
                gradient.addColorStop(0.5, `hsla(${p.hue}, 80%, 60%, ${alpha * 0.4})`);
                gradient.addColorStop(1, `hsla(${p.hue}, 80%, 50%, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                this.ctx.fill();

                // Core
                this.ctx.fillStyle = `hsla(${p.hue}, 90%, 80%, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    /**
     * Draw glow lines
     */
    drawGlowLines() {
        this.glowLines.forEach(line => {
            const alpha = line.intensity;

            // Outer glow
            this.ctx.strokeStyle = line.color + (alpha * 0.2) + ')';
            this.ctx.lineWidth = line.width * 3;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = line.color + (alpha * 0.5) + ')';
            this.ctx.beginPath();
            this.ctx.moveTo(line.x1, line.y1);
            this.ctx.lineTo(line.x2, line.y2);
            this.ctx.stroke();

            // Middle glow
            this.ctx.strokeStyle = line.color + (alpha * 0.5) + ')';
            this.ctx.lineWidth = line.width * 1.5;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.moveTo(line.x1, line.y1);
            this.ctx.lineTo(line.x2, line.y2);
            this.ctx.stroke();

            // Core line
            this.ctx.strokeStyle = line.color + alpha + ')';
            this.ctx.lineWidth = line.width;
            this.ctx.shadowBlur = 5;
            this.ctx.beginPath();
            this.ctx.moveTo(line.x1, line.y1);
            this.ctx.lineTo(line.x2, line.y2);
            this.ctx.stroke();

            // Reset shadow
            this.ctx.shadowBlur = 0;
        });
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Render frame
     */
    render() {
        this.clear();
        this.drawGlowLines();
        this.drawParticles();
    }

    /**
     * Animation loop
     */
    animate() {
        this.updateParticles();
        this.updateGlowLines();
        this.render();

        // Continue animation if there are active effects
        if (this.particles.length > 0 || this.glowLines.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.stopAnimation();
        }
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animate();
        }
    }

    /**
     * Stop animation loop
     */
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isAnimating = false;
        this.clear();
    }

    /**
     * Clear all effects
     */
    clearEffects() {
        this.particles = [];
        this.glowLines = [];
        this.stopAnimation();
    }
}
