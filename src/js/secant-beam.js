/**
 * secant-beam.js
 * Secant beam visualization with glowing effect
 */

class SecantBeam {
    constructor(renderer, options = {}) {
        this.renderer = renderer;
        this.ctx = renderer.ctx;

        // Beam visual properties
        this.beamWidth = options.beamWidth || 8;
        this.glowRadius = options.glowRadius || 20;
        this.animationSpeed = options.animationSpeed || 0.02;

        // Animation state
        this.animationPhase = 0;
        this.isAnimating = false;
        this.animationFrame = null;

        // Colors
        this.colors = {
            beamStart: 'rgba(0, 169, 206, 0.9)',      // Cyan
            beamMid: 'rgba(227, 24, 55, 0.8)',        // Red
            beamEnd: 'rgba(0, 64, 152, 0.7)',         // Blue
            glow: 'rgba(0, 169, 206, 0.3)',
            particle: 'rgba(255, 255, 255, 0.8)'
        };

        // Particle system for enhanced effect
        this.particles = [];
    }

    /**
     * Draw secant beam with glowing effect
     */
    draw(point1, point2, animated = false) {
        if (!point1 || !point2) return;

        // Get canvas coordinates
        const x1 = this.renderer.toCanvasX(point1.x);
        const y1 = this.renderer.toCanvasY(point1.y);
        const x2 = this.renderer.toCanvasX(point2.x);
        const y2 = this.renderer.toCanvasY(point2.y);

        // Calculate angle and length
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

        // Save context state
        this.ctx.save();

        // Draw glow layers (multiple layers for depth)
        this.drawGlowLayers(x1, y1, x2, y2, length);

        // Draw main beam with gradient
        this.drawMainBeam(x1, y1, x2, y2, angle, length);

        // Draw animated particles if enabled
        if (animated) {
            this.drawParticles(x1, y1, x2, y2, length);
        }

        // Draw pulse effect
        this.drawPulseEffect(x1, y1, x2, y2, length);

        // Restore context state
        this.ctx.restore();
    }

    /**
     * Draw multiple glow layers for depth effect
     */
    drawGlowLayers(x1, y1, x2, y2, length) {
        const layers = 5;

        for (let i = layers; i > 0; i--) {
            const layerWidth = this.beamWidth + (this.glowRadius * (i / layers));
            const opacity = 0.1 * (1 - i / layers);

            // Create gradient for this layer
            const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `rgba(0, 169, 206, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(227, 24, 55, ${opacity})`);
            gradient.addColorStop(1, `rgba(0, 64, 152, ${opacity})`);

            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = layerWidth;
            this.ctx.lineCap = 'round';

            // Apply blur
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = this.colors.glow;

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }

        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    /**
     * Draw main beam with animated gradient
     */
    drawMainBeam(x1, y1, x2, y2, angle, length) {
        // Create animated gradient
        const gradient = this.ctx.createLinearGradient(x1, y1, x2, y2);

        // Animate gradient stops based on phase
        const phase = this.animationPhase;
        const numStops = 5;

        for (let i = 0; i <= numStops; i++) {
            const stop = i / numStops;
            const animatedStop = (stop + phase) % 1;

            // Color cycling through beam colors
            let color;
            if (animatedStop < 0.33) {
                color = this.colors.beamStart;
            } else if (animatedStop < 0.66) {
                color = this.colors.beamMid;
            } else {
                color = this.colors.beamEnd;
            }

            gradient.addColorStop(stop, color);
        }

        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = this.beamWidth;
        this.ctx.lineCap = 'round';

        // Strong glow effect
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = this.colors.beamStart;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        // Reset shadow
        this.ctx.shadowBlur = 0;
    }

    /**
     * Draw animated particles along the beam
     */
    drawParticles(x1, y1, x2, y2, length) {
        const numParticles = 10;
        const phase = this.animationPhase;

        for (let i = 0; i < numParticles; i++) {
            const t = (i / numParticles + phase) % 1;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;

            // Particle size varies with position
            const size = 2 + 3 * Math.sin(t * Math.PI);

            // Draw particle
            this.ctx.fillStyle = this.colors.particle;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = this.colors.beamStart;

            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, 2 * Math.PI);
            this.ctx.fill();
        }

        this.ctx.shadowBlur = 0;
    }

    /**
     * Draw pulsing effect at endpoints
     */
    drawPulseEffect(x1, y1, x2, y2, length) {
        const pulseSize = 10 + 5 * Math.sin(this.animationPhase * Math.PI * 4);
        const pulseOpacity = 0.5 + 0.3 * Math.sin(this.animationPhase * Math.PI * 4);

        // Draw pulse at both endpoints
        [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach(point => {
            const gradient = this.ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, pulseSize
            );

            gradient.addColorStop(0, `rgba(0, 169, 206, ${pulseOpacity})`);
            gradient.addColorStop(0.5, `rgba(227, 24, 55, ${pulseOpacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 169, 206, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, pulseSize, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    /**
     * Start animation loop
     */
    startAnimation() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        const animate = () => {
            if (!this.isAnimating) return;

            this.animationPhase += this.animationSpeed;
            if (this.animationPhase > 1) {
                this.animationPhase -= 1;
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Stop animation loop
     */
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /**
     * Draw extended secant line (beyond the two points)
     */
    drawExtendedSecant(point1, point2) {
        const linePoints = MathFunctions.getSecantLinePoints(point1, point2, 2);

        // Draw faint extended line
        const x1 = this.renderer.toCanvasX(linePoints[0].x);
        const y1 = this.renderer.toCanvasY(linePoints[0].y);
        const x2 = this.renderer.toCanvasX(linePoints[1].x);
        const y2 = this.renderer.toCanvasY(linePoints[1].y);

        this.ctx.strokeStyle = 'rgba(0, 169, 206, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    /**
     * Draw slope triangle (rise over run visualization)
     */
    drawSlopeTriangle(point1, point2) {
        const x1 = this.renderer.toCanvasX(point1.x);
        const y1 = this.renderer.toCanvasY(point1.y);
        const x2 = this.renderer.toCanvasX(point2.x);
        const y2 = this.renderer.toCanvasY(point2.y);

        // Draw horizontal line (run)
        this.ctx.strokeStyle = 'rgba(227, 24, 55, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([3, 3]);

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y1);
        this.ctx.stroke();

        // Draw vertical line (rise)
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Labels
        this.ctx.fillStyle = 'rgba(227, 24, 55, 0.8)';
        this.ctx.font = 'bold 12px sans-serif';

        // Δx label
        const midX = (x1 + x2) / 2;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Δx = ${(point2.x - point1.x).toFixed(2)}`, midX, y1 + 5);

        // Δy label
        const midY = (y1 + y2) / 2;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`Δy = ${(point2.y - point1.y).toFixed(2)}`, x2 + 5, midY);
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.stopAnimation();
        this.particles = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecantBeam;
}
