/**
 * Chaos Harmony Visualization
 * Creates seemingly random but patterned visualizations based on learning data
 */

class ChaosHarmony {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Canvas dimensions
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // Particles for visualization
        this.particles = [];
        this.maxParticles = 100;

        // Pattern data
        this.patterns = {
            successRhythm: 0,
            struggleWave: 0,
            speedPattern: 0
        };

        // Emotion state
        this.emotion = 'neutral';
        this.animationSpeed = 1.0;

        // Color palette
        this.colors = {
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#f093fb',
            success: '#4ade80',
            struggle: '#f87171',
            neutral: '#60a5fa'
        };

        // Animation frame
        this.animationId = null;
        this.time = 0;

        // Initialize
        this.initParticles();
        this.start();
    }

    /**
     * Initialize particles with chaos
     */
    initParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle());
        }
    }

    /**
     * Create a single particle
     */
    createParticle() {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: Math.random() * 3 + 1,
            alpha: Math.random() * 0.5 + 0.3,
            hue: Math.random() * 60 + 200, // Blue-purple range
            phase: Math.random() * Math.PI * 2,
            frequency: Math.random() * 0.02 + 0.01
        };
    }

    /**
     * Update patterns from API data
     */
    updatePatterns(patterns) {
        if (!patterns || !Array.isArray(patterns)) return;

        patterns.forEach(pattern => {
            switch (pattern.type) {
                case 'success_rhythm':
                    this.patterns.successRhythm = pattern.intensity;
                    break;
                case 'struggle_wave':
                    this.patterns.struggleWave = pattern.intensity;
                    break;
                case 'speed_pattern':
                    this.patterns.speedPattern = pattern.intensity;
                    break;
            }
        });

        // Adjust particle behavior based on patterns
        this.adjustParticleBehavior();
    }

    /**
     * Adjust particle behavior based on patterns
     */
    adjustParticleBehavior() {
        const { successRhythm, struggleWave, speedPattern } = this.patterns;

        this.particles.forEach(particle => {
            // Success rhythm creates organized flow
            if (successRhythm > 0.5) {
                particle.vx += Math.sin(this.time * 0.01) * successRhythm * 0.1;
                particle.vy += Math.cos(this.time * 0.01) * successRhythm * 0.1;
            }

            // Struggle wave creates turbulence
            if (struggleWave > 0.5) {
                particle.vx += (Math.random() - 0.5) * struggleWave * 0.5;
                particle.vy += (Math.random() - 0.5) * struggleWave * 0.5;
            }

            // Speed pattern affects particle velocity
            if (speedPattern > 0.3) {
                const speedMultiplier = 1 + speedPattern;
                particle.vx *= speedMultiplier;
                particle.vy *= speedMultiplier;
            }
        });
    }

    /**
     * Update emotion state
     */
    setEmotion(emotion) {
        this.emotion = emotion;

        // Change color palette based on emotion
        switch (emotion) {
            case 'joy':
                this.colors.primary = '#4ade80';
                this.colors.secondary = '#22c55e';
                break;
            case 'flow':
                this.colors.primary = '#667eea';
                this.colors.secondary = '#764ba2';
                break;
            case 'struggle':
                this.colors.primary = '#f87171';
                this.colors.secondary = '#ef4444';
                break;
            default:
                this.colors.primary = '#60a5fa';
                this.colors.secondary = '#3b82f6';
        }
    }

    /**
     * Set animation speed
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(3.0, speed));
    }

    /**
     * Perlin-like noise function (simplified)
     */
    noise(x, y, time) {
        const n = Math.sin(x * 0.1 + time * 0.001) *
                 Math.cos(y * 0.1 + time * 0.001) *
                 Math.sin((x + y) * 0.05);
        return (n + 1) / 2; // Normalize to 0-1
    }

    /**
     * Update particle positions
     */
    updateParticles() {
        this.particles.forEach(particle => {
            // Apply chaos-based movement using noise
            const noiseValue = this.noise(particle.x, particle.y, this.time);
            const angle = noiseValue * Math.PI * 2;

            // Base velocity influenced by noise
            particle.vx += Math.cos(angle) * 0.1;
            particle.vy += Math.sin(angle) * 0.1;

            // Apply damping
            particle.vx *= 0.95;
            particle.vy *= 0.95;

            // Update position
            particle.x += particle.vx * this.animationSpeed;
            particle.y += particle.vy * this.animationSpeed;

            // Wrap around edges
            if (particle.x < 0) particle.x = this.width;
            if (particle.x > this.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.height;
            if (particle.y > this.height) particle.y = 0;

            // Oscillate alpha for "breathing" effect
            particle.alpha = 0.3 + Math.sin(this.time * particle.frequency + particle.phase) * 0.3;

            // Oscillate hue slightly
            particle.hue = 200 + Math.sin(this.time * 0.001) * 60;
        });
    }

    /**
     * Draw connections between nearby particles
     */
    drawConnections() {
        const connectionDistance = 80;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < connectionDistance) {
                    const alpha = (1 - distance / connectionDistance) * 0.3;

                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `hsla(${p1.hue}, 70%, 65%, ${alpha})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }
    }

    /**
     * Draw particles
     */
    drawParticles() {
        this.particles.forEach(particle => {
            // Create gradient for particle
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.radius * 2
            );

            gradient.addColorStop(0, `hsla(${particle.hue}, 70%, 65%, ${particle.alpha})`);
            gradient.addColorStop(1, `hsla(${particle.hue}, 70%, 65%, 0)`);

            this.ctx.beginPath();
            this.ctx.fillStyle = gradient;
            this.ctx.arc(particle.x, particle.y, particle.radius * 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * Draw pattern-based background effects
     */
    drawBackgroundEffects() {
        const { successRhythm, struggleWave, speedPattern } = this.patterns;

        // Success rhythm: smooth flowing waves
        if (successRhythm > 0.2) {
            this.ctx.strokeStyle = `rgba(74, 222, 128, ${successRhythm * 0.2})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();

            for (let x = 0; x < this.width; x += 10) {
                const y = this.height / 2 +
                         Math.sin(x * 0.02 + this.time * 0.01) * 50 * successRhythm;
                if (x === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            this.ctx.stroke();
        }

        // Struggle wave: chaotic interference patterns
        if (struggleWave > 0.2) {
            this.ctx.strokeStyle = `rgba(248, 113, 113, ${struggleWave * 0.15})`;
            this.ctx.lineWidth = 1.5;

            for (let i = 0; i < 5; i++) {
                this.ctx.beginPath();
                for (let x = 0; x < this.width; x += 5) {
                    const y = this.height / 2 +
                             Math.sin(x * 0.05 + this.time * 0.02 + i) * 30 * struggleWave +
                             Math.cos(x * 0.03 - this.time * 0.01) * 20 * struggleWave;
                    if (x === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.stroke();
            }
        }

        // Speed pattern: pulsating circles
        if (speedPattern > 0.2) {
            const pulseRadius = 50 + Math.sin(this.time * 0.05 * speedPattern) * 30;
            this.ctx.strokeStyle = `rgba(96, 165, 250, ${speedPattern * 0.3})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.width / 2, this.height / 2, pulseRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    /**
     * Render frame
     */
    render() {
        // Clear canvas with fade effect for trails
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw background effects
        this.drawBackgroundEffects();

        // Draw connections
        this.drawConnections();

        // Draw particles
        this.drawParticles();
    }

    /**
     * Animation loop
     */
    animate() {
        this.time += this.animationSpeed;

        this.updateParticles();
        this.render();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Start animation
     */
    start() {
        if (!this.animationId) {
            this.animate();
        }
    }

    /**
     * Stop animation
     */
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Reset visualization
     */
    reset() {
        this.time = 0;
        this.initParticles();
        this.patterns = {
            successRhythm: 0,
            struggleWave: 0,
            speedPattern: 0
        };
    }
}
