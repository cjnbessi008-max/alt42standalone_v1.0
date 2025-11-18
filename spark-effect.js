/**
 * Spark Effect - Creates beautiful spark particle animations at zero points
 * Zero Spark Effect for ALT42 Standalone
 */

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = 0.01 + Math.random() * 0.02;
        this.size = 2 + Math.random() * 3;
        this.color = color;
        this.glow = Math.random() > 0.5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity effect
        this.life -= this.decay;
        this.size *= 0.98;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = this.life;

        if (this.glow) {
            // Create glow effect
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size * 2
            );
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.5, this.color + 'aa');
            gradient.addColorStop(1, this.color + '00');
            ctx.fillStyle = gradient;
            ctx.fillRect(
                this.x - this.size * 2,
                this.y - this.size * 2,
                this.size * 4,
                this.size * 4
            );
        }

        // Draw particle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    isAlive() {
        return this.life > 0;
    }
}

class SparkEffect {
    constructor() {
        this.particles = [];
        this.sparkColors = [
            '#FFD700', // Gold
            '#FFA500', // Orange
            '#FF6347', // Tomato
            '#FF4500', // OrangeRed
            '#FFFF00', // Yellow
            '#00FFFF', // Cyan
            '#FF1493', // DeepPink
            '#7FFF00'  // Chartreuse
        ];
    }

    /**
     * Create a spark explosion at a specific point
     * @param {number} x - X coordinate on canvas
     * @param {number} y - Y coordinate on canvas
     * @param {number} intensity - Number of particles (default: 50)
     */
    createSpark(x, y, intensity = 50) {
        // Create main burst
        for (let i = 0; i < intensity; i++) {
            const color = this.sparkColors[Math.floor(Math.random() * this.sparkColors.length)];
            this.particles.push(new Particle(x, y, color));
        }

        // Create secondary burst with slight delay
        setTimeout(() => {
            for (let i = 0; i < intensity / 2; i++) {
                const color = this.sparkColors[Math.floor(Math.random() * this.sparkColors.length)];
                this.particles.push(new Particle(x, y, color));
            }
        }, 100);
    }

    /**
     * Create a pulsing glow effect at a point
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} radius - Glow radius
     * @param {number} pulse - Pulse phase (0-1)
     */
    drawPulsingGlow(ctx, x, y, radius, pulse) {
        const pulseSize = radius * (1 + Math.sin(pulse * Math.PI * 2) * 0.3);

        ctx.save();
        ctx.globalAlpha = 0.4 + Math.sin(pulse * Math.PI * 2) * 0.2;

        // Outer glow
        const gradient1 = ctx.createRadialGradient(x, y, 0, x, y, pulseSize * 2);
        gradient1.addColorStop(0, '#FFD700');
        gradient1.addColorStop(0.5, '#FFA500');
        gradient1.addColorStop(1, 'rgba(255, 165, 0, 0)');

        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner glow
        const gradient2 = ctx.createRadialGradient(x, y, 0, x, y, pulseSize);
        gradient2.addColorStop(0, '#FFFFFF');
        gradient2.addColorStop(0.7, '#FFD700');
        gradient2.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Draw a star shape at zero point
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} cx - Center X
     * @param {number} cy - Center Y
     * @param {number} spikes - Number of spikes
     * @param {number} outerRadius - Outer radius
     * @param {number} innerRadius - Inner radius
     * @param {number} rotation - Rotation angle
     */
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, rotation) {
        let rot = Math.PI / 2 * 3 + rotation;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            let x = cx + Math.cos(rot) * outerRadius;
            let y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }

        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
    }

    /**
     * Update all particles
     */
    update() {
        this.particles.forEach(particle => particle.update());
        this.particles = this.particles.filter(particle => particle.isAlive());
    }

    /**
     * Draw all particles
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    draw(ctx) {
        this.particles.forEach(particle => particle.draw(ctx));
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }

    /**
     * Check if animation is complete
     * @returns {boolean}
     */
    isComplete() {
        return this.particles.length === 0;
    }
}

// Create a global instance
const sparkEffect = new SparkEffect();
