/**
 * ALT42 Melt Intersection Effect
 * Warm-colored melting animation for graph intersections
 * 교집합 영역이 따뜻한 색으로 스르륵 녹아내리는 효과
 */

class MeltParticle {
    constructor(x, y, color, intensity = 1.0) {
        this.x = x;
        this.y = y;

        // Melting motion - more downward, less sideways
        this.vx = (Math.random() - 0.5) * 2 * intensity; // Reduced horizontal spread
        this.vy = Math.random() * 3 * intensity; // More downward velocity

        this.life = 1.0;
        this.decay = 0.005 + Math.random() * 0.01; // Slower decay for melting effect
        this.size = 4 + Math.random() * 8; // Larger particles
        this.color = color;

        // Stronger gravity for melting effect
        this.gravity = 0.15;
        this.friction = 0.95; // Less friction, more flow

        // Melting effect properties
        this.stretch = 1.0; // Vertical stretch factor
        this.stretchVelocity = Math.random() * 0.05 + 0.02;
        this.temperature = 1.0; // Heat level (1 = hot, 0 = cool)
        this.temperatureCooldown = 0.008;

        // Trail effect
        this.trail = [];
        this.maxTrailLength = 5;
    }

    update() {
        // Apply physics
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;

        // Store trail position
        this.trail.push({ x: this.x, y: this.y, life: this.life });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Update life and temperature
        this.life -= this.decay;
        this.temperature = Math.max(0, this.temperature - this.temperatureCooldown);

        // Stretching effect (particles elongate as they fall)
        this.stretch += this.stretchVelocity;

        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();

        // Draw trail for melting streak effect
        this.trail.forEach((point, index) => {
            const trailAlpha = (index / this.trail.length) * point.life * 0.3;
            ctx.globalAlpha = trailAlpha;
            ctx.fillStyle = this.getTemperatureColor();
            ctx.beginPath();
            const trailSize = this.size * (index / this.trail.length);
            ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
            ctx.fill();
        });

        // Main particle with glow
        ctx.globalAlpha = this.life;

        // Create temperature-based color
        const color = this.getTemperatureColor();

        // Glow effect (larger blur for hot particles)
        const glowSize = this.size * (2 + this.temperature);
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, glowSize
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, this.addAlpha(color, 0.5));
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(
            this.x, this.y,
            this.size,
            this.size * this.stretch,
            Math.PI / 2, // Vertical orientation
            0, Math.PI * 2
        );
        ctx.fill();

        // Inner bright core (hotter = brighter)
        if (this.temperature > 0.5) {
            ctx.globalAlpha = this.life * this.temperature;
            ctx.fillStyle = this.getHotCoreColor();
            ctx.beginPath();
            ctx.ellipse(
                this.x, this.y,
                this.size * 0.6,
                this.size * this.stretch * 0.6,
                Math.PI / 2,
                0, Math.PI * 2
            );
            ctx.fill();
        }

        ctx.restore();
    }

    getTemperatureColor() {
        // Interpolate between hot (yellow/orange) and cool (red/dark)
        if (this.temperature > 0.7) {
            // Very hot - bright yellow/white
            return `rgba(255, 255, ${Math.floor(200 * this.temperature)}, ${this.life})`;
        } else if (this.temperature > 0.4) {
            // Hot - orange
            return `rgba(255, ${Math.floor(165 * this.temperature)}, 0, ${this.life})`;
        } else {
            // Cooling - red to dark red
            return `rgba(${Math.floor(255 * this.temperature)}, ${Math.floor(69 * this.temperature)}, 0, ${this.life})`;
        }
    }

    getHotCoreColor() {
        // Bright white-yellow core for very hot particles
        return `rgba(255, 255, 240, ${this.temperature})`;
    }

    addAlpha(color, alpha) {
        // Simple alpha addition to color
        if (color.startsWith('rgba')) {
            return color.replace(/[\d.]+\)$/g, `${alpha})`);
        }
        return color;
    }
}

class MeltIntersectionEffect {
    constructor() {
        this.particles = [];
        this.enabled = true;
        this.particleCount = 40; // More particles for dense melt effect
        this.intensity = 1.2;
        this.meltHistory = [];
        this.maxHistory = 10;

        // Warm color palette
        this.warmColors = [
            '#FF6B35', // Flame orange
            '#FF8C42', // Light orange
            '#FFA07A', // Light salmon
            '#FF4500', // Orange red
            '#FFD700', // Gold
            '#FFA500', // Orange
            '#FF7F50', // Coral
            '#FF6347', // Tomato
        ];
    }

    createMelt(x, y, baseColor = null) {
        if (!this.enabled) return;

        // Use warm color palette
        const color = baseColor || this.warmColors[Math.floor(Math.random() * this.warmColors.length)];

        // Create melt particles with warm colors
        for (let i = 0; i < this.particleCount; i++) {
            const particleColor = this.warmColors[Math.floor(Math.random() * this.warmColors.length)];
            this.particles.push(new MeltParticle(x, y, particleColor, this.intensity));
        }

        // Add to history
        this.meltHistory.push({
            x, y, color,
            timestamp: Date.now()
        });
        if (this.meltHistory.length > this.maxHistory) {
            this.meltHistory.shift();
        }

        // Create heat wave effect
        this.createHeatWave(x, y);
    }

    createHeatWave(x, y) {
        const heatWave = {
            x, y,
            radius: 0,
            maxRadius: 80,
            alpha: 1.0,
            active: true,
            pulsePhase: 0
        };

        const animate = () => {
            if (!heatWave.active) return;

            heatWave.radius += 4;
            heatWave.alpha -= 0.04;
            heatWave.pulsePhase += 0.2;

            if (heatWave.radius >= heatWave.maxRadius || heatWave.alpha <= 0) {
                heatWave.active = false;
            } else {
                requestAnimationFrame(animate);
            }
        };

        this.heatWaves = this.heatWaves || [];
        this.heatWaves.push(heatWave);
        animate();
    }

    update() {
        // Update particles
        this.particles = this.particles.filter(particle => particle.update());

        // Update heat waves
        if (this.heatWaves) {
            this.heatWaves = this.heatWaves.filter(hw => hw.active);
        }
    }

    draw(ctx) {
        // Draw heat waves (distortion effect)
        if (this.heatWaves) {
            this.heatWaves.forEach(hw => {
                ctx.save();

                // Create pulsing heat distortion
                const pulseIntensity = Math.sin(hw.pulsePhase) * 0.3 + 0.7;
                ctx.globalAlpha = hw.alpha * pulseIntensity;

                // Draw multiple rings for heat shimmer effect
                for (let i = 0; i < 3; i++) {
                    const ringRadius = hw.radius + i * 10;
                    const ringAlpha = hw.alpha * (1 - i * 0.3);

                    ctx.globalAlpha = ringAlpha;

                    // Warm gradient for heat wave
                    const gradient = ctx.createRadialGradient(
                        hw.x, hw.y, ringRadius * 0.8,
                        hw.x, hw.y, ringRadius
                    );
                    gradient.addColorStop(0, 'rgba(255, 165, 0, 0)');
                    gradient.addColorStop(0.5, `rgba(255, 100, 0, ${ringAlpha * 0.3})`);
                    gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(hw.x, hw.y, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }

                ctx.restore();
            });
        }

        // Draw particles (sorted by y position for proper layering)
        const sortedParticles = [...this.particles].sort((a, b) => a.y - b.y);
        sortedParticles.forEach(particle => particle.draw(ctx));
    }

    setParticleCount(count) {
        this.particleCount = Math.max(20, Math.min(100, count));
    }

    setIntensity(intensity) {
        this.intensity = Math.max(0.5, Math.min(3.0, intensity));
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    clear() {
        this.particles = [];
        this.heatWaves = [];
        this.meltHistory = [];
    }

    getActiveParticleCount() {
        return this.particles.length;
    }

    getStats() {
        return {
            particles: this.particles.length,
            heatWaves: this.heatWaves ? this.heatWaves.length : 0,
            totalMelts: this.meltHistory.length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeltIntersectionEffect;
}
