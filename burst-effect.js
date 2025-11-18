/**
 * ALT42 Intersection Burst Effect
 * Particle system for visualizing graph intersections
 */

class Particle {
    constructor(x, y, color, intensity = 1.0) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 8 * intensity;
        this.vy = (Math.random() - 0.5) * 8 * intensity;
        this.life = 1.0;
        this.decay = 0.01 + Math.random() * 0.02;
        this.size = 3 + Math.random() * 5;
        this.color = color;
        this.gravity = 0.1;
        this.friction = 0.98;
    }

    update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class BurstEffect {
    constructor() {
        this.particles = [];
        this.enabled = true;
        this.particleCount = 30;
        this.intensity = 1.0;
        this.burstHistory = [];
        this.maxHistory = 10;
    }

    createBurst(x, y, color = '#FFD700') {
        if (!this.enabled) return;

        const colors = this.generateColorPalette(color);

        for (let i = 0; i < this.particleCount; i++) {
            const particleColor = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, particleColor, this.intensity));
        }

        // Add to history
        this.burstHistory.push({
            x, y, color,
            timestamp: Date.now()
        });
        if (this.burstHistory.length > this.maxHistory) {
            this.burstHistory.shift();
        }

        // Create shockwave effect
        this.createShockwave(x, y, color);
    }

    createShockwave(x, y, color) {
        const shockwave = {
            x, y, color,
            radius: 0,
            maxRadius: 100,
            alpha: 1.0,
            active: true
        };

        const animate = () => {
            if (!shockwave.active) return;

            shockwave.radius += 5;
            shockwave.alpha -= 0.05;

            if (shockwave.radius >= shockwave.maxRadius || shockwave.alpha <= 0) {
                shockwave.active = false;
            } else {
                requestAnimationFrame(animate);
            }
        };

        this.shockwaves = this.shockwaves || [];
        this.shockwaves.push(shockwave);
        animate();
    }

    update() {
        this.particles = this.particles.filter(particle => particle.update());

        if (this.shockwaves) {
            this.shockwaves = this.shockwaves.filter(sw => sw.active);
        }
    }

    draw(ctx) {
        // Draw shockwaves
        if (this.shockwaves) {
            this.shockwaves.forEach(sw => {
                ctx.save();
                ctx.globalAlpha = sw.alpha;
                ctx.strokeStyle = sw.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            });
        }

        // Draw particles
        this.particles.forEach(particle => particle.draw(ctx));
    }

    generateColorPalette(baseColor) {
        // Generate complementary colors for the burst
        const colors = [
            baseColor,
            '#FF6B6B', // Red
            '#4ECDC4', // Cyan
            '#FFD93D', // Yellow
            '#95E1D3', // Mint
            '#F38181', // Pink
            '#AA96DA', // Purple
            '#FCBAD3', // Light Pink
        ];
        return colors;
    }

    setParticleCount(count) {
        this.particleCount = Math.max(10, Math.min(100, count));
    }

    setIntensity(intensity) {
        this.intensity = Math.max(0.5, Math.min(3.0, intensity));
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    clear() {
        this.particles = [];
        this.shockwaves = [];
        this.burstHistory = [];
    }

    getActiveParticleCount() {
        return this.particles.length;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BurstEffect;
}
