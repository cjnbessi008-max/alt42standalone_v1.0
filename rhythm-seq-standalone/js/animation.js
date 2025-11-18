/**
 * Animation Engine
 * Canvas-based sequence animation
 */

class AnimationEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.sequence = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.speed = 5;
        this.style = 'wave';
        this.animationFrame = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }

    /**
     * Start animation
     */
    start(sequence, style = 'wave', speed = 5) {
        this.sequence = sequence;
        this.style = style;
        this.speed = speed;
        this.currentIndex = 0;
        this.isPlaying = true;
        this.isPaused = false;

        this.createParticles();
        this.animate();
    }

    /**
     * Pause animation
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume animation
     */
    resume() {
        if (this.isPlaying) {
            this.isPaused = false;
            this.animate();
        }
    }

    /**
     * Stop animation
     */
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.clear();
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Create particles from sequence
     */
    createParticles() {
        this.particles = this.sequence.map((value, index) => {
            const maxValue = Math.max(...this.sequence);
            const minSize = 30;
            const maxSize = 80;
            const size = minSize + (value / maxValue) * (maxSize - minSize);

            return {
                value,
                size,
                x: this.centerX,
                y: this.centerY,
                targetX: 0,
                targetY: 0,
                vx: 0,
                vy: 0,
                rotation: 0,
                scale: 0,
                opacity: 0,
                color: Utils.valueToColor(value, maxValue),
                active: false,
                index
            };
        });

        this.updateParticlePositions();
    }

    /**
     * Update particle target positions based on style
     */
    updateParticlePositions() {
        const count = this.particles.length;
        const radius = Math.min(this.width, this.height) * 0.3;

        this.particles.forEach((particle, index) => {
            switch (this.style) {
                case 'wave':
                    const angle = (index / count) * Math.PI * 2;
                    particle.targetX = this.centerX + Math.cos(angle) * radius;
                    particle.targetY = this.centerY + Math.sin(angle) * radius;
                    break;

                case 'bounce':
                    const cols = Math.ceil(Math.sqrt(count));
                    const row = Math.floor(index / cols);
                    const col = index % cols;
                    const spacing = Math.min(this.width, this.height) / (cols + 1);
                    particle.targetX = spacing * (col + 1);
                    particle.targetY = spacing * (row + 1);
                    break;

                case 'spiral':
                    const spiralAngle = index * 0.5;
                    const spiralRadius = (index / count) * radius;
                    particle.targetX = this.centerX + Math.cos(spiralAngle) * spiralRadius;
                    particle.targetY = this.centerY + Math.sin(spiralAngle) * spiralRadius;
                    break;

                case 'random':
                    particle.targetX = Math.random() * this.width;
                    particle.targetY = Math.random() * this.height;
                    break;

                default:
                    particle.targetX = this.centerX;
                    particle.targetY = this.centerY;
            }
        });
    }

    /**
     * Main animation loop
     */
    animate() {
        if (!this.isPlaying || this.isPaused) return;

        this.clear();
        this.updateParticles();
        this.drawParticles();

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Update particle physics
     */
    updateParticles() {
        const frameDelay = 120 - (this.speed * 10);
        const now = Date.now();

        this.particles.forEach((particle, index) => {
            // Activate particles one by one
            if (!particle.active && index === this.currentIndex) {
                particle.active = true;
                particle.scale = 1;
                particle.opacity = 1;

                // Play sound for this number
                if (AudioManager.enabled) {
                    AudioManager.playNumberNote(particle.value);
                }

                // Move to next after delay
                setTimeout(() => {
                    if (this.currentIndex < this.particles.length - 1) {
                        this.currentIndex++;
                    } else {
                        this.currentIndex = 0;
                        this.particles.forEach(p => {
                            p.active = false;
                            p.opacity = 0.3;
                            p.scale = 0.8;
                        });
                    }
                }, frameDelay);
            }

            // Update active particle
            if (particle.active) {
                // Move towards target
                particle.x += (particle.targetX - particle.x) * 0.1;
                particle.y += (particle.targetY - particle.y) * 0.1;

                // Pulsate
                const pulse = Math.sin(now * 0.01) * 0.1;
                particle.scale = 1 + pulse;

                // Rotate
                particle.rotation += 0.02;
            } else if (particle.opacity > 0) {
                // Fade out inactive particles
                particle.opacity *= 0.95;
                particle.scale *= 0.98;
            }
        });
    }

    /**
     * Draw all particles
     */
    drawParticles() {
        // Draw connections first
        if (this.style === 'wave') {
            this.drawConnections();
        }

        // Draw particles
        this.particles.forEach(particle => {
            if (particle.opacity > 0.01) {
                this.drawParticle(particle);
            }
        });
    }

    /**
     * Draw single particle
     */
    drawParticle(particle) {
        this.ctx.save();

        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        this.ctx.scale(particle.scale, particle.scale);

        // Shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 5;

        // Circle
        this.ctx.globalAlpha = particle.opacity;
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Inner glow
        if (particle.active) {
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size / 2);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(0.5, particle.color);
            gradient.addColorStop(1, particle.color);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Text
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${particle.size / 2.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(particle.value, 0, 0);

        this.ctx.restore();
    }

    /**
     * Draw connections between particles
     */
    drawConnections() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.3)';
        this.ctx.lineWidth = 2;

        for (let i = 0; i < this.particles.length - 1; i++) {
            const p1 = this.particles[i];
            const p2 = this.particles[i + 1];

            if (p1.opacity > 0.1 && p2.opacity > 0.1) {
                this.ctx.globalAlpha = Math.min(p1.opacity, p2.opacity);
                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    /**
     * Set animation speed
     */
    setSpeed(speed) {
        this.speed = Utils.clamp(speed, 1, 10);
    }

    /**
     * Set animation style
     */
    setStyle(style) {
        this.style = style;
        this.updateParticlePositions();
    }

    /**
     * Get current progress
     */
    getProgress() {
        return {
            current: this.currentIndex + 1,
            total: this.sequence.length,
            percentage: ((this.currentIndex + 1) / this.sequence.length) * 100
        };
    }

    /**
     * Draw background effects
     */
    drawBackground() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.05)');
        gradient.addColorStop(1, 'rgba(240, 147, 251, 0.05)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
}
