/**
 * Power Charge Animation System
 * Handles energy charging effects when numbers increase
 */

class PowerChargeAnimation {
    constructor() {
        this.canvas = document.getElementById('power-charge-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.powerScore = document.getElementById('power-score');
        this.powerBar = document.getElementById('power-bar');
        this.particles = [];
        this.isAnimating = false;

        // Animation settings
        this.particleCount = 30;
        this.maxParticles = 100;

        if (this.canvas && this.ctx) {
            this.setupCanvas();
            this.startAnimationLoop();
        }
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.centerX = rect.width / 2;
        this.centerY = rect.height / 2;
    }

    /**
     * Trigger power charge animation when score increases
     * @param {number} oldValue - Previous score
     * @param {number} newValue - New score
     * @param {number} maxValue - Maximum possible score for percentage calculation
     */
    charge(oldValue, newValue, maxValue = 1000) {
        const delta = newValue - oldValue;

        if (delta <= 0) return; // No animation for decrease

        // Update score with animation
        this.animateScoreChange(oldValue, newValue);

        // Update power bar
        const percentage = Math.min((newValue / maxValue) * 100, 100);
        this.updatePowerBar(percentage);

        // Create particle burst
        this.createParticleBurst(delta);

        // Trigger visual effects
        this.triggerChargeEffect();

        // Play sound (if available)
        this.playChargeSound(delta);
    }

    /**
     * Animate score number change with count-up effect
     */
    animateScoreChange(from, to) {
        const duration = 600; // milliseconds
        const startTime = Date.now();
        const scoreDelta = to - from;

        // Add charging class for CSS animation
        this.powerScore.classList.add('charging');

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(from + scoreDelta * eased);

            this.powerScore.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.powerScore.classList.remove('charging');
            }
        };

        animate();
    }

    /**
     * Update power bar with smooth transition
     */
    updatePowerBar(percentage) {
        this.powerBar.style.width = percentage + '%';

        // Add glow effect based on percentage
        if (percentage > 80) {
            this.powerBar.style.boxShadow = '0 0 20px rgba(255, 215, 0, 1)';
        } else if (percentage > 50) {
            this.powerBar.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.8)';
        } else {
            this.powerBar.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.6)';
        }
    }

    /**
     * Create particle burst effect
     */
    createParticleBurst(intensity) {
        const count = Math.min(Math.floor(intensity / 5) + 10, this.particleCount);

        for (let i = 0; i < count; i++) {
            if (this.particles.length < this.maxParticles) {
                this.particles.push(this.createParticle());
            }
        }
    }

    /**
     * Create a single particle
     */
    createParticle() {
        const angle = Math.random() * Math.PI * 2;
        const velocity = 1 + Math.random() * 3;
        const size = 2 + Math.random() * 4;

        return {
            x: this.centerX,
            y: this.centerY,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity - 2, // Bias upward
            size: size,
            life: 1.0,
            decay: 0.01 + Math.random() * 0.02,
            color: this.getRandomColor()
        };
    }

    /**
     * Get random particle color (energy theme)
     */
    getRandomColor() {
        const colors = [
            { r: 255, g: 215, b: 0 },   // Gold
            { r: 0, g: 255, b: 255 },   // Cyan
            { r: 255, g: 165, b: 0 },   // Orange
            { r: 255, g: 255, b: 255 }, // White
            { r: 135, g: 206, b: 250 }  // Light blue
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Trigger charge effect (screen flash, etc.)
     */
    triggerChargeEffect() {
        // Create screen flash
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%);
            pointer-events: none;
            z-index: 9999;
            animation: flashFade 0.5s ease-out;
        `;

        document.body.appendChild(flash);

        setTimeout(() => {
            document.body.removeChild(flash);
        }, 500);

        // Add CSS animation for flash
        if (!document.getElementById('flash-animation-style')) {
            const style = document.createElement('style');
            style.id = 'flash-animation-style';
            style.textContent = `
                @keyframes flashFade {
                    0% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Play charge sound (placeholder - add audio later)
     */
    playChargeSound(intensity) {
        // TODO: Add Web Audio API sound generation
        // For now, using a simple beep concept
        if (window.AudioContext || window.webkitAudioContext) {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                // Higher pitch for bigger gains
                oscillator.frequency.value = 400 + (intensity * 5);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.3);
            } catch (e) {
                console.log('Audio not supported');
            }
        }
    }

    /**
     * Animation loop for particles
     */
    startAnimationLoop() {
        const animate = () => {
            this.updateParticles();
            this.drawParticles();
            requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Update particle positions and life
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Update position
            p.x += p.vx;
            p.y += p.vy;

            // Apply gravity
            p.vy += 0.1;

            // Reduce life
            p.life -= p.decay;

            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Draw particles on canvas
     */
    drawParticles() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw each particle
        this.particles.forEach(p => {
            this.ctx.save();

            // Set opacity based on life
            this.ctx.globalAlpha = p.life;

            // Create gradient for glow effect
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            gradient.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 1)`);
            gradient.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });
    }

    /**
     * Create electric arc effect between points
     */
    createLightningEffect() {
        if (!this.ctx) return;

        const startX = this.centerX;
        const startY = this.centerY + 50;
        const endX = this.centerX;
        const endY = this.centerY - 50;

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = 'rgba(0, 255, 255, 1)';

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);

        // Create jagged lightning path
        let currentX = startX;
        let currentY = startY;
        const segments = 8;
        const segmentHeight = (endY - startY) / segments;

        for (let i = 0; i < segments; i++) {
            currentY += segmentHeight;
            currentX += (Math.random() - 0.5) * 20;
            this.ctx.lineTo(currentX, currentY);
        }

        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.restore();
    }

    /**
     * Reset animation state
     */
    reset() {
        this.particles = [];
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}

// Create global instance
window.powerChargeAnimation = new PowerChargeAnimation();
