/**
 * Particle System Module
 * Handles exponential burst visualization with particles
 */

class Particle {
    constructor(x, y, vx, vy, radius, color, stage) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.alpha = 1;
        this.decay = 0.008 + Math.random() * 0.012;
        this.stage = stage;
        this.trail = [];
        this.maxTrailLength = 8;
    }

    update() {
        // Save position for trail
        this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Apply physics
        this.vy += 0.08; // Gravity
        this.vx *= 0.99; // Air resistance
        this.vy *= 0.99;

        // Fade out
        this.alpha -= this.decay;
    }

    draw(ctx) {
        if (this.alpha <= 0) return;

        // Draw trail
        this.trail.forEach((point, index) => {
            const trailAlpha = (index / this.trail.length) * point.alpha * 0.5;
            const trailRadius = this.radius * (index / this.trail.length) * 0.7;

            ctx.beginPath();
            ctx.arc(point.x, point.y, trailRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = trailAlpha;
            ctx.fill();
        });

        // Draw main particle
        ctx.globalAlpha = this.alpha;

        // Glow effect
        if (this.radius > 3) {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.5, this.color + '80');
            gradient.addColorStop(1, this.color + '00');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Main particle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle effect for larger particles
        if (this.radius > 4 && this.alpha > 0.7) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = this.alpha * 0.8;
            ctx.beginPath();
            ctx.arc(
                this.x - this.radius * 0.3,
                this.y - this.radius * 0.3,
                this.radius * 0.3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    isAlive() {
        return this.alpha > 0;
    }
}

class ParticleSystem {
    constructor(canvas, density = 'medium') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.density = density;
        this.densityMultipliers = {
            low: 0.5,
            medium: 1.0,
            high: 1.5
        };

        this.colors = [
            '#FF6B6B', // Red
            '#4ECDC4', // Cyan
            '#45B7D1', // Blue
            '#FFA07A', // Orange
            '#98D8C8', // Mint
            '#F7DC6F', // Yellow
            '#BB8FCE', // Purple
            '#85C1E2', // Sky Blue
            '#F093FB', // Pink
            '#4ADEAF'  // Green
        ];

        this.resize();
    }

    /**
     * Resize canvas to match container
     */
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    /**
     * Set particle density
     */
    setDensity(density) {
        this.density = density;
    }

    /**
     * Create exponential burst
     * base^exponent determines the number of particles
     */
    createBurst(base, exponent) {
        const stages = exponent;
        const stageDelay = 180; // milliseconds

        for (let stage = 1; stage <= stages; stage++) {
            setTimeout(() => {
                const particleCount = Math.pow(base, stage);
                this.createBurstStage(particleCount, stage);
            }, stage * stageDelay);
        }
    }

    /**
     * Create a single stage of burst
     */
    createBurstStage(count, stage) {
        const multiplier = this.densityMultipliers[this.density] || 1.0;
        const adjustedCount = Math.min(Math.floor(count * multiplier), 500); // Cap for performance

        const stageColors = this.getStageColors(stage);

        for (let i = 0; i < adjustedCount; i++) {
            const angle = (Math.PI * 2 * i) / adjustedCount + (Math.random() - 0.5) * 0.3;
            const speed = 1.5 + Math.random() * 3 + stage * 0.3;
            const size = 2 + Math.random() * 4 + stage * 0.5;

            // Add some randomness to spawn position for variety
            const spawnRadius = Math.random() * 20;
            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnX = this.centerX + Math.cos(spawnAngle) * spawnRadius;
            const spawnY = this.centerY + Math.sin(spawnAngle) * spawnRadius;

            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 1; // Slight upward bias

            const color = stageColors[Math.floor(Math.random() * stageColors.length)];

            this.particles.push(new Particle(spawnX, spawnY, vx, vy, size, color, stage));
        }
    }

    /**
     * Get colors for specific stage (gradient effect)
     */
    getStageColors(stage) {
        const colorSets = [
            ['#FF6B6B', '#FFA07A'], // Reds/Oranges
            ['#4ECDC4', '#45B7D1'], // Blues/Cyans
            ['#F7DC6F', '#98D8C8'], // Yellows/Mints
            ['#BB8FCE', '#F093FB'], // Purples/Pinks
            ['#85C1E2', '#4ADEAF']  // Sky/Greens
        ];

        return colorSets[(stage - 1) % colorSets.length];
    }

    /**
     * Create celebration burst (for milestones)
     */
    createCelebration() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createBurstStage(50, i + 1);
            }, i * 100);
        }
    }

    /**
     * Update all particles
     */
    update() {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update();

            // Remove dead particles
            if (!particle.isAlive()) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Draw all particles
     */
    draw() {
        // Clear with fade effect
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.15)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw particles
        this.particles.forEach(particle => {
            particle.draw(this.ctx);
        });
    }

    /**
     * Animation loop
     */
    animate() {
        this.update();
        this.draw();
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Get particle count
     */
    getParticleCount() {
        return this.particles.length;
    }
}

export default ParticleSystem;
